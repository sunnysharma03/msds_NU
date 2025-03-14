# Instructions to Run the Project

## 1. Install Dependencies  
- Install Node.js: https://nodejs.org/en  
- Install Python 3.11: https://www.python.org/downloads/  

## 2. Setup Backend Environment  
- Create a virtual environment using Conda by selecting `requirements.txt` in the `backend` folder.  

## 3. Run the Frontend  
1. Open a terminal in the `frontend` folder.  
2. Run the following commands:  

   npm install  
   npm run dev  

## 4. Run the Backend  

### 4.1 Gather the Required API Keys & Credentials  
You will need the following:  
- Google Gemini API Key: https://ai.google.dev/gemini-api/docs/models/gemini 
- Google Vision Credentials json file.

### 4.2 Configure Environment Variables  
- Create a `.env` file inside the `backend` folder.  
- Add the above credentials **without** single or double quotes. 
- Add the Vision API credentials json inside backend folder and update the file name in env.

### 4.3 Start the Backend  
- Run the backend server using:  

   python app.py  

## 5. Open the Application  
- Open your browser and visit:  

  http://localhost:3000  

Your project is now running! 🚀  

Note: If your python is running on  Running on http://127.0.0.1:5000 then you don't need to worry about anything. 
If it is running on some other address like http://localhost:500 then you need to update the frontend/src/app/api/api.js file with the correct address.


Information: The white board object detection model is trained using Yolo V12, the folder dataset contains labelled images and model folder contains the script to train the model on google Colab.