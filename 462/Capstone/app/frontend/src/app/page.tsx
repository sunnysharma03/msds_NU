'use client';

import { useState, useEffect } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import Accordion from 'react-bootstrap/Accordion';
import 'bootstrap/dist/css/bootstrap.min.css';
import { processVideoStream } from './api/api';

interface DetectedObject {
  frameSecond: string;
  ocrText: string;
  detectedObjects: [string, number[], number][]; // Tuple type for detected objects
}

export default function Layout() {
  const [video, setVideo] = useState<File | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [videoStatus, setVideoStatus] = useState('');
  const [audioStatus, setAudioStatus] = useState('');
  const [outputStatus, setOutputStatus] = useState('');
  const [transcription, setTranscription] = useState('');
  const [detectedText, setDetectedText] = useState<DetectedObject[]>([]);
  const [finalSummary, setFinalSummary] = useState('');
  const [disableInput, setDisableInput] = useState(false);
  const [imagePaths, setImagePaths] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleUpload = () => {
    setDisableInput(true);

    if (!video) {
      alert("Please select a video first.");
      setDisableInput(false);
      return;
    }

    setDetectedLanguage("In Progress");
    setVideoStatus("In Progress");
    setAudioStatus("In Progress");
    setOutputStatus("In Progress");
    setTranscription("In Progress");
    setFinalSummary("In Progress");

    processVideoStream((update: any) => {
      if (update.videoStatus) setVideoStatus(update.videoStatus);
      if (update.detectedLanguage) setDetectedLanguage(update.detectedLanguage);
      if (update.audioStatus) setAudioStatus(update.audioStatus);
      if (update.transcription) setTranscription(update.transcription);
      if (update.finalStatus) setOutputStatus(update.finalStatus);
      
      // Store detected OCR text and frame timestamp
      if (update.detectedText) {
        setDetectedText((prev) => [
          ...prev,
          { frameSecond: update.frameSecond, ocrText: update.detectedText, detectedObjects: update.detectedObjects },
        ]);
      }
      // Store image paths separately for the slider
      if (update.imagePath) {
        setImagePaths((prev) => [...prev, update.imagePath]);
      }
      // final summary from LLM
      if (update.summary) {
        setFinalSummary(update.summary);
        setDisableInput(false);
      }
      
    }, video); // Send actual File object
  };

  // Update active index when new images are added
  useEffect(() => {
    if (imagePaths.length > 0) {
      setActiveIndex(imagePaths.length - 1); // Move to the latest image
    }
  }, [imagePaths]);

  const handleSelect = (selectedIndex: number) => {
    setActiveIndex(selectedIndex);
  };

  return (
    <div className="container mt-4">
      
      <div className="alert alert-primary text-center" role="alert" style={{fontSize: "xxx-large"}}>
        Interactive Boards
      </div>

      {/* Video Selection */}
      <div className="d-flex gap-2 mb-3">
        <input 
          type="file" 
          className="form-control" 
          accept="video/*" 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setVideo(e.target.files[0]);
            }
          }}
          disabled={disableInput}
        />
        <button className="btn btn-primary" onClick={handleUpload} disabled={disableInput}>Upload</button>
      </div>
      
      <hr />
      
      {/* Status Inputs */}
      <div className="row g-3">
        <div className="col-md-6">
          <label>Detected Language</label>
          <input type="text" className="form-control" value={detectedLanguage} readOnly />
        </div>
        <div className="col-md-6">
          <label>Video Converted Status</label>
          <input type="text" className="form-control" value={videoStatus} readOnly />
        </div>
        <div className="col-md-6">
          <label>Audio Transcription Status</label>
          <input type="text" className="form-control" value={audioStatus} readOnly />
        </div>
        <div className="col-md-6">
          <label>Output Complete Status</label>
          <input type="text" className="form-control" value={outputStatus} readOnly />
        </div>
      </div>
      
      <hr />
      
      {/* Image Slider */}
      {imagePaths.length > 0 && (
      <>
        <h3>Detected White Boards Images</h3>
        <Carousel
          className="mt-4"
          activeIndex={activeIndex}
          onSelect={handleSelect}
        >
          {imagePaths.map((path, index) => (
            <Carousel.Item key={index}>
              <img
                className="d-block w-100"
                src={`http://127.0.0.1:5000/${path}`}
                alt={`Frame ${index + 1}`}
              />
            </Carousel.Item>
          ))}
        </Carousel>
      </>
      )}
      
      {/* Transcription Text Area */}
      {transcription != "" && (
        <div style={{paddingTop: "50px"}}>
          <h3>Transcription of Audio</h3>
          <textarea className="form-control mb-4" rows={10} value={transcription} readOnly style={{resize: "none"}} />
        </div>
      )}
      
     {/* Accordion for OCR Text */}
     {detectedText.length > 0 && (
      <div style={{paddingTop: "50px"}}>
        <h3>Frame Level Information</h3>
        <Accordion defaultActiveKey="0" className="mt-4" style={{ height: "400px", overflow: "auto" }}>
          {detectedText.map((item, index) => (
            <Accordion.Item eventKey={index.toString()} key={index}>
              <Accordion.Header>Frame at {item.frameSecond}</Accordion.Header>
              <Accordion.Body>
                <p><strong>Detected Text (OCR):</strong> {item.ocrText || "No text detected"}</p>

                <p><strong>Detected Objects:</strong></p>
                <ul>
                  {item.detectedObjects.map((obj, i) => (
                    <li key={i}>
                      <strong>{obj[0]}</strong> (Confidence: {(obj[2] * 100).toFixed(2)}%)
                      <br />
                      <span>Coordinates: ({obj[1].map(coord => coord.toFixed(2)).join(", ")})</span>
                    </li>
                  ))}
                </ul>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
      )}
      
      {/* Final Summary */}
      {finalSummary != "" && (
        <div className="card" style={{marginBottom: "100px", marginTop: "50px"}}>
          <div className="card-header text-white bg-primary">Final Summary</div>
          <div className="card-body">
            <p className="card-text">{finalSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
