export async function processVideoStream(updateState, videoFile) {
  if (!videoFile) {
    console.error("No video file provided");
    return;
  }

  const formData = new FormData();
  formData.append("video", videoFile);

  try {
    const response = await fetch("http://127.0.0.1:5000/process-video", {
      method: "POST",
      body: formData, // No need to set Content-Type, browser handles it
    });

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; // Store incomplete chunks

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Attempt to extract and parse complete JSON objects
      let boundary = buffer.indexOf("}{");
      while (boundary !== -1) {
        const jsonString = buffer.slice(0, boundary + 1); // Extract full JSON
        buffer = buffer.slice(boundary + 1); // Keep remaining part

        try {
          const data = JSON.parse(jsonString);
          updateState(data);
        } catch (error) {
          console.error("Error parsing chunk:", error);
        }

        boundary = buffer.indexOf("}{"); // Check for more objects
      }

      // Try parsing the last remaining object if it's complete
      try {
        const data = JSON.parse(buffer);
        updateState(data);
        buffer = ""; // Clear buffer after parsing
      } catch (error) {
        // Keep buffer if parsing fails (incomplete JSON)
      }
    }
  } catch (error) {
    console.error("Error processing video stream:", error);
  }
}
