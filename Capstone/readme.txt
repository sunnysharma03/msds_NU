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

Note: If your Python server is running at http://127.0.0.1:5000, no changes are needed. If it is running at a different address, like http://localhost:5000, update the frontend/src/app/api/api.js file with the correct address.

EDA: You can run the Jupyter Notebook in the EDA folder to explore the analysis performed on the last 50 songs played by the user and the Spotify 1M songs dataset(https://www.kaggle.com/datasets/amitanshjoshi/spotify-1million-tracks/data).

**Generating JSON files:** Run the scripts in the **scripts** folder to fetch the latest song data from Spotify Charts for each country. Make sure to provide your email and password in the environment variables before running the scripts.  

There are also scripts for adding locale information to the original 1M Spotify Songs dataset, as well as a script to fetch the user's last 50 played songs.