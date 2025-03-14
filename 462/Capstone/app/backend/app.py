import os
import shutil
import cv2
import json
import time
import threading
import queue
import whisper
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from moviepy import *
from ultralytics import YOLO
from google.cloud import vision
from flask import send_from_directory
import supervision as sv
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Load models
whisper_model = whisper.load_model("tiny")
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
yolo_model = YOLO('./utils/best.pt')

# Output directory
OUTPUT_FOLDER = "uploads"
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
# Initialize annotators
box_annotator = sv.BoxAnnotator()
label_annotator = sv.LabelAnnotator()
results = {"transcription": "", "detectedLanguage": "", "detection": []}
# Thread-safe queue for streaming results
result_queue = queue.Queue()

# Configure your API key (replace with your actual API key)
#initialize clients
client = OpenAI(
    api_key=os.getenv("GEMINI_API"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

def process_video_stream(video_path):
    """ Main function to process the video and stream results """
    yield json.dumps({'status': 'Processing started'})

    # Step 1: Convert Video to MP3
    mp3_file_path = video_path.replace(".mp4", ".mp3")
    video = VideoFileClip(video_path)
    video.audio.write_audiofile(mp3_file_path)
    yield json.dumps({'videoStatus': 'Completed'})

    # Step 2: Start Transcription & Language Detection
    transcription_thread = threading.Thread(target=mp3_to_text, args=(mp3_file_path,), daemon=True)
    lang_detection_thread = threading.Thread(target=detect_lang, args=(mp3_file_path,), daemon=True)
    
    transcription_thread.start()
    lang_detection_thread.start()

    # Step 3: Start Object Detection & OCR in Parallel
    inference_thread = threading.Thread(target=run_inference_on_video, args=(video_path,), daemon=True)
    inference_thread.start()

    # Step 4: Stream results as they arrive (Non-blocking)
    while True:
        try:
            result = result_queue.get(timeout=5)  # Wait for up to 5 seconds
            yield json.dumps(result)
        except queue.Empty:
            # Check if all threads are finished
            if not (transcription_thread.is_alive() or lang_detection_thread.is_alive() or inference_thread.is_alive()):
                break  # Stop streaming once all threads finish

    # Step 5: All processing is done, call summarization
    summary = summarize_lecture(results["transcription"], results["detectedLanguage"], results["detection"])
    yield json.dumps({'summary': summary})
    yield json.dumps({'finalStatus': 'Completed'})

def mp3_to_text(mp3_file_path):
    """ Transcribes the audio and sends results to the queue """
    result = whisper_model.transcribe(mp3_file_path)
    transcription = result['text']
    results["transcription"] = result['text']
    result_queue.put({'audioStatus': 'Completed', 'transcription': transcription})

def detect_lang(mp3_file_path):
    """ Detects the language of the audio and sends results to the queue """
    audio = whisper.load_audio(mp3_file_path)
    audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(audio, n_mels=whisper_model.dims.n_mels).to(whisper_model.device)
    _, probs = whisper_model.detect_language(mel)
    detected_lang = max(probs, key=probs.get)
    results["lang"] = detected_lang
    result_queue.put({'detectedLanguage': detected_lang})

def detect_whiteboard_objects(frame):
    """Detects whiteboards in a given frame"""
    results = yolo_model(frame, verbose=False)[0]
    detections = sv.Detections.from_ultralytics(results)

    detected_objects = []
    for bbox, conf, class_id in zip(results.boxes.xyxy, results.boxes.conf, results.boxes.cls):
        class_name = results.names[int(class_id)]
        if class_name == "White-board" and conf > 0.75:
            detected_objects.append((class_name, bbox.tolist(), float(conf)))
    
    return detections, detected_objects  # Return both for annotation & processing

def perform_ocr(image, frame_time, image_filename, detections):
    """ Runs OCR on the given image and sends results to the queue """
    client = vision.ImageAnnotatorClient()
    success, encoded_image = cv2.imencode(".jpg", image)
    if not success:
        return None

    image_bytes = encoded_image.tobytes()
    vision_image = vision.Image(content=image_bytes)
    response = client.text_detection(image=vision_image)
    texts = response.text_annotations
    ocr_text = texts[0].description if texts else ""

    # Send results to queue
    result_queue.put({
        "frameSecond": frame_time,
        "imagePath": image_filename,
        "detectedObjects": detections,
        "detectedText": ocr_text
    })
    if ocr_text!= "":
        currentDetections = results["detection"]
        currentDetections.append({"frameSecond": frame_time, "detectedText": ocr_text})
        results["detection"] = currentDetections

def run_inference_on_video(video_path):
    """Detects objects in video frames and runs OCR if needed"""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return

    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(fps)  # Process 1 frame per second
    frame_count = 0

    # Create a folder for the video inside OUTPUT_FOLDER
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    video_folder = os.path.join(OUTPUT_FOLDER, video_name)
    os.makedirs(video_folder, exist_ok=True)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_interval == 0:
            detections, detected_objects = detect_whiteboard_objects(frame)

            # Annotate the frame with bounding boxes
            annotated_frame = box_annotator.annotate(scene=frame.copy(), detections=detections)
            annotated_frame = label_annotator.annotate(scene=annotated_frame, detections=detections)

            # Save the annotated frame
            image_filename = os.path.join(video_folder, f"frame_{frame_count}.jpg")
            cv2.imwrite(image_filename, annotated_frame)

            frame_time = time.strftime('%H:%M:%S', time.gmtime(frame_count // fps))

            # Run OCR in a separate thread
            threading.Thread(
                target=perform_ocr,
                args=(annotated_frame, frame_time, image_filename, detected_objects),
                daemon=True
            ).start()

        frame_count += 1

    cap.release()

def summarize_lecture(transcription, lang, detection):
    
    messages = [
    {
        "role": "system",
        "content": (
            "You are an AI assistant skilled at summarizing lectures by integrating spoken transcription with handwritten text "
            "detected from a whiteboard. Your goal is to produce a summary that captures both verbal explanations and visual content."
        ),
    },
    {
        "role": "user",
        "content": f"""
        The following information has been extracted from a lecture video:

        **Spoken Content (Audio Transcription)**:
        {transcription}

        **Detected Language**: {lang}

        **Whiteboard Text (Handwritten OCR Extraction)**:
        {detection}

        **Your Task**:
        - Generate a well-structured summary that **effectively merges key details** from both the spoken lecture and handwritten text on the whiteboard.
        - Prioritize content from the whiteboard, as it often contains formulas, key points, diagrams, or notes that are crucial for understanding the lecture.
        - Ensure that definitions, equations, and important handwritten terms are included and appropriately contextualized with the spoken explanation.
        - Keep the summary **clear, structured, and engaging**, making it useful for someone who might not have access to the video but needs a full understanding of both verbal and visual information.
        """,
    },
    ]

    try:
        # Get response from OpenAI
        response = client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=messages,
            n=1,
            max_tokens=2048
        )
        bot_response = response.choices[0].message.content
    except Exception as e:
        print(e)
        bot_response = "Sorry, something went wrong while processing your request."

    return bot_response

def create_video_folder(filename):
    """Creates a unique folder for each uploaded video inside the uploads directory, clearing its contents if it exists."""
    base_name = os.path.splitext(filename)[0]  # Remove extension
    folder_path = os.path.join(OUTPUT_FOLDER, base_name)
    
    if os.path.exists(folder_path):
        # Folder exists, clear its contents
        try:
            shutil.rmtree(folder_path)  # Remove the existing folder
            os.makedirs(folder_path) # Recreate the empty folder
        except OSError as e:
            print(f"Error clearing folder {folder_path}: {e}")
            return None # Indicate failure to clear the folder
    else:
        os.makedirs(folder_path, exist_ok=True)  # Create folder if it doesn't exist

    return folder_path

@app.route("/process-video", methods=["POST"])
def process_video():
    global results
    results = {"transcription": "", "detectedLanguage": "", "detection": []}
    if "video" not in request.files:
        return jsonify({"error": "No video file provided"}), 400

    video_file = request.files["video"]
    if video_file.filename == "":
        return jsonify({"error": "Invalid filename"}), 400

    # Create a unique folder inside "uploads"
    video_folder = create_video_folder(video_file.filename)

    # Save the file inside its corresponding folder
    video_path = os.path.join(video_folder, video_file.filename)
    video_file.save(video_path)
    
    print(f"Saved video: {video_path}")

    return Response(process_video_stream(video_path), mimetype="text/event-stream")

# Serve uploaded images
@app.route('/uploads/<path:subpath>', methods=["GET"])
def serve_uploaded_file(subpath):
    return send_from_directory(OUTPUT_FOLDER, subpath)

if __name__ == "__main__":
    app.run(debug=True)
