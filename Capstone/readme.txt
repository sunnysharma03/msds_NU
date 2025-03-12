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
- Spotify App ID & Secret: https://developer.spotify.com  
- Ticketmaster API Key: https://developer.ticketmaster.com/products-and-docs/apis/getting-started/  
- Spotify Username & Password (for scraping pipelines)  
- Google Gemini API Key: https://ai.google.dev/gemini-api/docs/models/gemini  
- PostgreSQL Database Credentials  

### 4.2 Configure Environment Variables  
- Create a `.env` file inside the `backend` folder.  
- Add the above credentials **without** single or double quotes.  

### 4.3 Setup the Database  
1. Ensure PostgreSQL is installed and running.  
2. Open a terminal and navigate to the folder containing `setup_songfox.sql`.  
3. Run the following command to set up the database:  

   psql -U postgres -f setup_songfox.sql  

   (Replace `postgres` with your PostgreSQL username if different.)  

4. Connect to the database to verify the setup:  

   psql -U postgres -d songfox  

5. Check if the tables were created:  

   \dt  

### 4.4 Start the Backend  
- Run the backend server using:  

   python app.py  

## 5. Open the Application  
- Open your browser and visit:  

  http://localhost:3000  

Your project is now running! 🚀  
