import pandas as pd
import torch
import transformers
import re
import os
from huggingface_hub import login

# Log in to Hugging Face Hub (Replace "YOUR_TOKEN" with your actual token)
login(token="")

# Load the model and tokenizer
model_id = "meta-llama/Meta-Llama-3.1-8B-Instruct"
tokenizer = transformers.AutoTokenizer.from_pretrained(model_id)
tokenizer.pad_token_id = tokenizer.eos_token_id  # Set pad_token_id explicitly

text_gen_pipeline = transformers.pipeline(
    "text-generation",
    model=model_id,
    tokenizer=tokenizer,
    model_kwargs={"torch_dtype": torch.float16},
    device_map="auto",
)

# Function to process batch and generate text
def get_locale_batch(track_names, artist_names, years):
    # Create the prompt for each track in the batch
    messages = [
        {"role": "system", "content": "You are a music assistant specialized in identifying the locale (language) of songs based on track name, lyrics, artist, and release year."}
    ]
    
    user_prompts = [
        {"role": "user", "content": f"Determine the locale (original language) of the song '{track}' by '{artist}' from the year '{year}'. Strictly provide only one-word answer."}
        for track, artist, year in zip(track_names, artist_names, years)
    ]
    
    # Combine system and user prompts
    batch_messages = messages + user_prompts
    
    # Generate the batch of texts
    outputs = text_gen_pipeline(batch_messages, max_new_tokens=5, temperature=0.3, top_p=0.3)

     # Extract response content from the assistant role
    response = outputs[0]["generated_text"]
    
    # Find and clean the assistant's response
    for msg in response:
        if isinstance(msg, dict) and msg.get("role") == "assistant":
            locale = msg.get("content", "").strip()
            locale = re.sub(r"[^\w\s]", "", locale)  # Remove punctuation
            return locale.capitalize()  # Capitalize first letter

    return "Unknown"  # Default if no response found

# Function to process a chunk and append to a single CSV
def process_chunk(chunk, output_file, batch_size=1000, is_first_chunk=False):
    num_batches = (len(chunk) // batch_size) + 1
    all_locales = []

    for i in range(num_batches):
        start_idx = i * batch_size
        end_idx = min((i + 1) * batch_size, len(chunk))

        batch = chunk.iloc[start_idx:end_idx]
        track_names = batch["track_name"].tolist()
        artist_names = batch["artist_name"].tolist()
        years = batch["year"].tolist()

        locales = get_locale_batch(track_names, artist_names, years)
        all_locales.extend(locales)

        batch_df = batch.copy()
        batch_df["locale"] = locales

        # Append to CSV (first chunk includes header, others do not)
        batch_df.to_csv(output_file, mode="a", index=False, header=is_first_chunk and (i == 0))
        print(f"Processed batch {i + 1}/{num_batches} in current chunk")

    print(f"✅ Finished processing and saved to {output_file}")

# Main function to process the CSV in chunks
def main(input_csv, output_csv, chunk_size=100000):
    first_chunk = True  # Track the first chunk to include headers

    chunks = pd.read_csv(input_csv, chunksize=chunk_size)

    for i, chunk in enumerate(chunks):
        print(f"Processing chunk {i+1} with {len(chunk)} rows...")
        process_chunk(chunk, output_csv, is_first_chunk=first_chunk)
        first_chunk = False  # Ensure only first chunk includes headers

    print(f"✅ All data processed successfully! Results saved in {output_csv}")

if __name__ == "__main__":
    input_csv = "spotify_million_tracks.csv"
    output_csv = "MillionTrack_locale.csv"
    main(input_csv, output_csv)