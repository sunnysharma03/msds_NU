import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import json
import pandas as pd
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
from openai import OpenAI
import psycopg2
from psycopg2 import pool, DatabaseError
from datetime import datetime
from flask_cors import cross_origin
from models import find_similar_songs, recommend_songs
import uuid

# Load environment variables
load_dotenv()

# Flask App Initialization
app = Flask(__name__)
# app = Flask(__name__, static_folder="out")
CORS(app)  # Enable CORS for frontend access

currentUser = {"userName": "Sachin Sharma","id": "a2c47fd1-3989-4ac1-9544-6a14974a2d72"}
# Load Spotify API credentials from environment variables
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
# Read configuration from environment variables
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
SECRET_KEY = os.getenv("SECRET_KEY")
SESSION_DURATION_DAYS = int(os.getenv("SESSION_DURATION_DAYS", 60))
DATABASE_SSL = os.getenv("DATABASE_SSL", "false")
# Set sslmode based on DATABASE_SSL
ssl_mode = "require" if DATABASE_SSL.lower() == "true" else "disable"


#initialize clients
client = OpenAI(
    api_key=os.getenv("GEMINI_API"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

# Initialize Spotify Client
sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(client_id=SPOTIFY_CLIENT_ID, client_secret=SPOTIFY_CLIENT_SECRET))

# Connect to PostgreSQL
try:
    db_pool = psycopg2.pool.SimpleConnectionPool(
        1, 2000,  # minimum and maximum number of connections
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        sslmode=ssl_mode
    )
    print("✅ Connection pool created successfully!")
except psycopg2.OperationalError as e:
    print("❌ Failed to create connection pool:", e)
    exit(1)

def load_json_data(file_path):
    """Helper function to load JSON data from a file."""
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception as e:
        return None

#load dataset
def assign_moods_to_df(df):
    conditions = {
        "happy":      (df['valence'] > 0.6) & (df['danceability'] > 0.6) & (df['energy'] > 0.5),
        "sad":        (df['valence'] < 0.3) & (df['danceability'] < 0.4) & (df['energy'] < 0.5),
        "energetic":  (df['energy'] > 0.75) & (df['loudness'] > -5) & (df['tempo'] > 120),
        "romantic":   (df['valence'].between(0.4, 0.7)) & (df['acousticness'] > 0.5) & (df['energy'] < 0.6),
        "chill":      (df['acousticness'] > 0.6) & (df['energy'] < 0.4) & (df['danceability'] < 0.5),
        "angry":      (df['energy'] > 0.8) & (df['loudness'] > -5) & (df['valence'] < 0.4),
        "party":      (df['danceability'] > 0.75) & (df['energy'] > 0.7) & (df['tempo'] > 125) & (df['valence'] > 0.6)
    }

    mood_sets = [set() for _ in range(len(df))]
    for mood, condition in conditions.items():
        matched_positions = df[condition].index.to_list()  # Convert to position-based list
        for pos in matched_positions:
            mood_sets[df.index.get_loc(pos)].add(mood)  # ✅ Use get_loc() to map index to position


    df['mood'] = ["neutral" if not s else ",".join(sorted(s)) for s in mood_sets]
    return df

# Load CSV
try:
    print("loading CSV")
    songs_df = pd.read_csv("./data/spotify_data.csv").dropna() 
    print(songs_df.shape)
    # Check for columns
    if all(col in songs_df.columns for col in ["valence", "danceability", "energy", "loudness", "tempo", "acousticness"]):
        songs_df = assign_moods_to_df(songs_df)
        print("✅ CSV Loaded.")
    else:
        print("⚠ Some columns missing, can't assign mood. 'mood' column won't exist.")
except Exception as e:
    print("Error loading CSV:", e)
    songs_df = pd.DataFrame()

# @app.route("/", defaults={"path": ""})
# @app.route("/<path:path>/")  # ✅ Handles trailing slashes
# @app.route("/<path:path>")
# def serve_frontend(path):
#     full_path = os.path.join(app.static_folder, path)

#     # ✅ Serve index.html if the path is a directory
#     if os.path.isdir(full_path):
#         return send_from_directory(full_path, "index.html")

#     # ✅ Serve requested file if it exists
#     if os.path.isfile(full_path):
#         return send_from_directory(app.static_folder, path)

#     # ✅ Handle Next.js `_rsc` or query parameters correctly
#     clean_path = path.split("?")[0]  # Remove query parameters
#     if os.path.isfile(os.path.join(app.static_folder, clean_path)):
#         return send_from_directory(app.static_folder, clean_path)

# API route to fetch new album releases
@app.route('/getNewReleases', methods=['GET'])
def get_new_releases():
    try:
        # Fetch new releases from Spotify
        response = sp.new_releases(limit=10)

        albums = []
        for album in response["albums"]["items"]:
            album_id = album["id"]
            artist_id = album["artists"][0]["id"]

            # Fetch additional details about the album
            album_details = sp.album(album_id)
            artist_details = sp.artist(artist_id)

            # Calculate total duration of all tracks in the album
            total_duration_ms = sum(track["duration_ms"] for track in album_details["tracks"]["items"])
            total_duration_min = round(total_duration_ms / 60000, 2)  # Convert ms to minutes

            albums.append({
                "album_name": album["name"],
                "album_href": album["external_urls"]["spotify"],
                "album_image": album["images"][0]["url"] if len(album["images"]) > 1 else "",
                "artist_name": album["artists"][0]["name"],
                "artist_href": album["artists"][0]["external_urls"]["spotify"],
                "release_date": album["release_date"],
                "total_tracks": album["total_tracks"],
                "popularity": album_details.get("popularity", "N/A"),  # Album popularity score (0-100)
                "genre": artist_details["genres"][0] if artist_details["genres"] else "Unknown",  # First genre
                "artist_followers": artist_details.get("followers", {}).get("total", "N/A"),  # Total followers
                "album_type": album["album_type"].capitalize(),  # Single, Album, or Compilation
                "album_duration_ms": total_duration_ms,  # Total album duration in milliseconds
                "album_duration_min": total_duration_min,  # Total album duration in minutes
            })

        return jsonify({"status": True, "data": albums})

    except Exception as e:
        print("Error fetching new releases:", e)
        return jsonify({"status": False, "message": "Failed to fetch new releases"}), 500

@app.route("/playlist/<playlist_id>", methods=["GET"])
def get_playlist_tracks(playlist_id):
    try:
        tracks = []
        results = sp.playlist_tracks(playlist_id)

        while results:
            for item in results["items"]:
                track = item["track"]
                tracks.append({
                    "name": track["name"],
                    "artist": ", ".join(artist["name"] for artist in track["artists"]),
                    "album": track["album"]["name"],
                    "url": track["external_urls"]["spotify"]
                })

            results = sp.next(results)  # Fetch next batch if exists

        return jsonify(tracks)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/getAllFeaturedSongs", methods=["GET"])
def getAllFeaturedSongs():
    fileDetails = {
        "dailyTopSongs": "dailyTopSongs.json",
        "dailyViralSongs": "dailyViralSongs.json",
        "trendingCitySongs": "trendingCitySongs.json",
        "weeklyTopAlbums": "weeklyTopAlbums.json",
        "weeklyTopArtist": "weeklyTopArtist.json"
    }

    country = request.args.get("country")
    query = request.args.get("query", "").lower()
    
    if not country:
        return jsonify({"status": False, "error": "Country parameter is required"}), 400
    
    result = {}
    
    for key, file_name in fileDetails.items():
        data = load_json_data(f"./data/{file_name}")
        if data is None:
            return jsonify({"status": False, "error": f"Failed to load {file_name}"}), 500
        
        # Filtering based on country or city
        if key == "trendingCitySongs":
            filtered_data = data
        else:
            filtered_data = [song for song in data if song.get("country", "").lower() == country.lower()]
        
        # Further filtering based on query if provided
        if query:
            filtered_data = [
                song for song in filtered_data
                if query in song.get("song_name", "").lower()
                or query in song.get("artist_name", "").lower()
                or query in song.get("album_name", "").lower()
                or query in song.get("city", "").lower()
            ]
        
        result[key] = filtered_data
    
    return jsonify({"status": True, "data": result})

@app.route("/getDailyTop_ViralSongs", methods=["GET"])
def getDailyTop_ViralSongs():

    fileDetails = {
        "latestTopSongs": "dailyTopSongs.json",
        "viralTopSongs": "dailyViralSongs.json"
    }

    country = request.args.get("country")
    query = request.args.get("query", "").lower()
    selectionCategory = request.args.get("selectionCategory")
    
    if not country or not selectionCategory:
        return jsonify({"status": False, "error": "Country and selectionCategory parameters are required"}), 400
    
    # Load data from the specified JSON file
    try:
        with open(f"./data/{fileDetails[selectionCategory]}", "r", encoding="utf-8") as file:
            songs = json.load(file)
    except Exception as e:
        return jsonify({"status": False, "error": f"Failed to load data: {str(e)}"}), 500
    
    # Filter songs by country
    filtered_songs = [
        song for song in songs
        if song.get("country", "").lower() == country.lower()
    ]
    
    # If query is provided, filter by song_name or artist_name
    if query:
        filtered_songs = [
            song for song in filtered_songs
            if query in song.get("song_name", "").lower() or query in song.get("artist_name", "").lower()
        ]
    
    return jsonify({"status": True, "data": filtered_songs})

# Route to get unique countries
@app.route('/get-countries', methods=['GET'])
def get_countries():
    try:
        # Path to the JSON file
        file_path = './data/dailyTopSongs.json'
        
        # Check if the file exists
        if not os.path.exists(file_path):
            return jsonify({"status": False, "message": "File not found"}), 404
        
        # Load the data from the JSON file
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        # Extract unique countries
        countries = set(song['country'] for song in data)
        
        # Return response with unique countries
        return jsonify({"status": True, "data": list(countries)})
    
    except Exception as e:
        # Handle any errors that occur
        return jsonify({"status": False, "message": str(e)}), 500

# Route to get unique countries
@app.route('/get-trending-city-songs', methods=['GET'])
def get_trending_city_songs():
    try:
        # Path to the JSON file
        file_path = './data/trendingCitySongs.json'
        
        # Load data from the specified JSON file
        try:
            with open(file_path, "r", encoding="utf-8") as file:
                songs = json.load(file)
        except Exception as e:
            return jsonify({"status": False, "error": f"Failed to load data: {str(e)}"}), 500
        
        # Limit the response to 7 records
        trending_city_songs = songs[:7]
        
        return jsonify({"status": True, "data": trending_city_songs})
    except Exception as e:
        return jsonify({"status": False, "error": str(e)}), 500

@app.route("/dailySongsFacts", methods=["GET"])
def get_songs_facts():
    file_path = "./data/dailySongsFacts.json"  # Update with the correct file path
    country = request.args.get("country")

    if not country:
        return jsonify({"status": False, "error": "Country parameter is required"}), 400

    # Load the JSON file
    facts_data = load_json_data(file_path)
    if facts_data is None:
        return jsonify({"status": False, "error": "Failed to load slider facts"}), 500

    # Define the default background image URL
    default_bg_image = "https://img.freepik.com/free-vector/musical-instruments-neon-style_18591-76796.jpg?t=st=1739616064~exp=1739619664~hmac=c42e5b6612fad2d2364b76dedfdefa6d7ff83862ed4a75924e026b42deda563a&w=996"

    # Filter facts by country and add bgImage key
    filtered_facts = [
        {**fact, "bgImage": default_bg_image}
        for fact in facts_data if fact.get("country", "").lower() == country.lower()
    ]

    return jsonify({"status": True, "data": filtered_facts})

@app.route('/events', methods=['GET'])
def get_events():
    API_KEY = os.getenv("TICKETMASTER_API_KEY")

    # Get query parameters
    size = request.args.get('size', 10, type=int)
    country = request.args.get('country', 'US')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    event_name = request.args.get('eventName', '')
    category = request.args.get('category', 'music')  # Default to music

    # Ticketmaster API URL
    url = "https://app.ticketmaster.com/discovery/v2/events.json"

    # Build query parameters
    params = {
        'apikey': API_KEY,
        'size': size,
        'countryCode': country,
        'keyword': event_name,
        'classificationName': category,  # Dynamic category filter
        'startDateTime': f"{start_date}T00:00:00Z" if start_date else None,
        'endDateTime': f"{end_date}T23:59:59Z" if end_date else None
    }

    # Remove None values
    params = {k: v for k, v in params.items() if v}

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        # Get events from API response
        events = data.get("_embedded", {}).get("events", [])
        if not events:
            return jsonify({"status": False, "message": "No events found", "data": []})

        # Transform events to include price details
        transformed_events = []
        for event in events:
            event_price = event.get("priceRanges", [{}])[0]  # Get the first price range
            max_price = event_price.get("max")
            currency = event_price.get("currency")

            # Format price as a readable string
            price_str = f"{max_price:.2f} {currency}" if max_price else "Price not available"

            transformed_events.append({
                "name": event.get("name"),
                "date": event.get("dates", {}).get("start", {}).get("dateTime"),
                "venue": event.get("_embedded", {}).get("venues", [{}])[0].get("name", "Unknown Venue"),
                "city": event.get("_embedded", {}).get("venues", [{}])[0].get("city", {}).get("name", "Unknown City"),
                "country": event.get("_embedded", {}).get("venues", [{}])[0].get("country", {}).get("name", "Unknown Country"),
                "imgUrl": event.get("images", [{}])[0].get("url", ""),
                "url": event.get("url", "#"),
                "price": price_str
            })

        return jsonify({"status": True, "data": transformed_events})

    except requests.exceptions.RequestException as e:
        return jsonify({"status": False, "error": str(e)}), 500

def get_artist_details_and_top_tracks(artist_id = None):
    """
    Fetch artist details, top 5 tracks, and top 5 single albums given a artist_id.
    Only one of song_id or album_id should be provided.
    """
    try:
         
        # Fetch artist details
        artist = sp.artist(artist_id)
        artist_details = {
            "name": artist["name"],
            "genres": artist["genres"],
            "followers": artist["followers"]["total"],
            "image": artist["images"][0]["url"] if artist["images"] else "",
            "spotify_url": artist["external_urls"]["spotify"],
            "popularity": artist["popularity"],
            "type": artist["type"]
        }
        
        # Fetch top 7 tracks
        top_tracks = sp.artist_top_tracks(artist_id)
        top_7_tracks = [
            {
                "name": track["name"],
                "popularity": track["popularity"],
                "spotify_url": track["external_urls"]["spotify"],
                "image": track["album"]["images"][0]["url"] if track["album"]["images"] else "",
                "album_name": track["album"]["name"],
                "release_date": track["album"]["release_date"],
                "duration_ms": track["duration_ms"],
            }
            for track in top_tracks["tracks"][:7]
        ]
        
        # Fetch top 10 single albums
        albums = sp.artist_albums(artist_id, album_type='single', limit=10)
        top_10_singles = [
            {
                "name": album["name"],
                "release_date": album["release_date"],
                "spotify_url": album["external_urls"]["spotify"],
                "image": album["images"][0]["url"] if album["images"] else ""
            }
            for album in albums["items"]
        ]
        
        return {"artist_details": artist_details, "artist_top_tracks": top_7_tracks, "artist_top_singles": top_10_singles}
    
    except Exception as e:
        print(" 356 error ", str(e))
        return {"artist_details": {}, "artist_top_tracks": [], "artist_top_singles": []}

def get_artist_id(album_id=None):
    if album_id:
        album_details = sp.album(album_id)  # Fetch album details from Spotify API
        artist_ids = [artist["id"] for artist in album_details.get("artists", [])]
        return artist_ids[0] if artist_ids else ""

    return ""

def get_spotify_album_details(album_id):
    """
    Fetch album details and all its tracks given an album ID.
    """
    try:
        # Load Spotify API credentials from environment variables
        SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
        SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

        # Initialize Spotify Client
        sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET
        ))
        
        if not album_id:
            return {"error": "No valid album_id provided"}
        
        # Fetch album details
        album = sp.album(album_id)
        album_tracks = sp.album_tracks(album_id)

        # Calculate total album duration (sum of all track durations)
        total_album_duration_ms = sum(track["duration_ms"] for track in album_tracks["items"])

        album_details = {
            "name": album["name"],
            "release_date": album["release_date"],
            "total_tracks": album["total_tracks"],
            "image": album["images"][0]["url"] if album["images"] else "",
            "spotify_url": album["external_urls"]["spotify"],
            "artists": [artist["name"] for artist in album["artists"]],
            "type": album["type"],
            "popularity": album["popularity"],
            "duration_ms": total_album_duration_ms  # Added total album duration
        }

        
        # Fetch all tracks in the album
        album_tracks = sp.album_tracks(album_id)
        tracks = [
            {
                "name": track["name"],
                "number": track["track_number"],
                "artists": [artist["name"] for artist in track["artists"]],
                "spotify_url": track["external_urls"]["spotify"],
                "duration_ms": track["duration_ms"],
                "popularity": track.get("popularity", 0),  # Added popularity (if available)
                "image": album_details["image"]
            }
            for track in album_tracks["items"]
        ]

        
        return {"album_details": album_details, "album_tracks": tracks}
    
    except Exception as e:
        print("Error in album details: ", str(e))
        return {"album_details": {}, "album_tracks": []}

def get_spotify_track_details(track_id):
    """
    Fetch track details given a track ID.
    """
    try:
        # Fetch track details
        track = sp.track(track_id)
        track_details = {
            "name": track["name"],
            "artists": [artist["name"] for artist in track["artists"]],
            "artist_id": track["artists"][0]["id"] if track["artists"] else None,  # First artist ID
            "albumName": track["album"]["name"],
            "album_id": track["album"]["id"],  # Added Album ID
            "release_date": track["album"]["release_date"],
            "duration_ms": track["duration_ms"],
            "spotify_url": track["external_urls"]["spotify"],
            "image": track["album"]["images"][0]["url"] if track["album"]["images"] else "",
            "type": track["type"],
            "total_tracks": track["album"]["total_tracks"],
            "popularity": track["popularity"]
        }

        
        return track_details
    
    except Exception as e:
        return {"error": str(e)}

def get_custom_album_details(track_ids, release_date, total_tracks, name):
    """
    Constructs an album-like object from multiple track IDs.
    Since it's not a Spotify album, some details are manually filled.
    """
    try:
        
        if not track_ids or not isinstance(track_ids, list):
            return {"error": "Invalid track IDs provided"}

        tracks_data = []
        all_artists = []

        # Fetch track details for each track ID
        for track_id in track_ids:
            try:
                track = sp.track(track_id)
                track_info = {
                    "name": track["name"],
                    "number": track.get("track_number", 0),
                    "artists": [artist["name"] for artist in track["artists"]],
                    "spotify_url": track["external_urls"]["spotify"],
                    "duration_ms": track["duration_ms"],
                    "popularity": track.get("popularity", 0),  # Default to 0 if missing
                    "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                }
                tracks_data.append(track_info)
                all_artists.extend(track_info["artists"])  # Collect all artists

            except Exception as e:
                print(f"Error fetching track {track_id}: {str(e)}")

        album_details = {
            "name": name,
            "release_date": release_date,
            "total_tracks": total_tracks,
            "image": "",  # No album image
            "spotify_url": "",  # No Spotify URL
            "artists": ["Unknown Artist"],  # Select one artist
            "type": "custom-collection",  # Indicating this is a custom album
            "popularity": sum(track["popularity"] for track in tracks_data) // max(len(tracks_data), 1),  # Average popularity
            "duration_ms": sum(track["duration_ms"] for track in tracks_data)  # Total duration
        }

        return {"album_details": album_details, "album_tracks": tracks_data}

    except Exception as e:
        print("Error in album details: ", str(e))
        return {"album_details": {}, "album_tracks": []}

def getTracksInfo(track_ids):
    
    spotify_tracks = sp.tracks(track_ids)

    tracks = []
    for track in spotify_tracks.get("tracks", []):
        if track:  # Ensure track data exists
            track_info = {
                "track_id": track["id"],
                "name": track["name"],
                "album": track["album"]["name"],
                "artist": ", ".join(artist["name"] for artist in track["artists"]),
                "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                "url": track["external_urls"]["spotify"],
                "duration": round(track["duration_ms"] / 60000, 2)  # Convert ms to minutes
            }

            tracks.append(track_info)
    return tracks

def get_playlist_songIds(playlist_id):
    conn = None
    try:
        conn = db_pool.getconn()
        with conn.cursor() as cur:
            # ✅ Fetch playlist name and creation date
            cur.execute(
                "SELECT playlist_name, created_at FROM playlist WHERE playlist_id = %s",
                (playlist_id,)
            )
            playlist = cur.fetchone()

            if not playlist:
                return None, None, None  # Playlist not found

            playlist_name, creation_date = playlist

            # ✅ Fetch track IDs from the playlist_song table
            cur.execute(
                "SELECT track_id FROM playlist_song WHERE playlist_id = %s",
                (playlist_id,)
            )
            track_ids = [row[0] for row in cur.fetchall()]

        return track_ids, creation_date, playlist_name

    except Exception as e:
        print("Error fetching playlist details:", e)
        return None, None, None
    finally:
        if conn:
            db_pool.putconn(conn)

@app.route('/fetchMusicData', methods=['GET'])
def fetch_music_data():
    source = request.args.get('source')
    song_id = request.args.get('songId')
    album_id = request.args.get('albumId')
    artist_id = request.args.get('artistId')
    # playlist_id = request.args.get('playlistId')
    
    if source == "spotify":
        with ThreadPoolExecutor() as executor:
            if song_id:
                track_details = get_spotify_track_details(song_id)
                albumId = track_details.get("album_id")
                artistId = track_details.get("artist_id")  # Ensure artist_id is fetched correctly

                album_details = executor.submit(get_spotify_album_details, albumId)
                artist_details = executor.submit(get_artist_details_and_top_tracks, artistId)

                # Extract album details separately
                album_result = album_details.result()
                artist_results = artist_details.result()
                return jsonify({
                    "track_details": track_details,
                    "album_details": album_result.get("album_details"),
                    "album_tracks": album_result.get("album_tracks"),  # Extract tracks separately
                    "artist_details": artist_results.get("artist_details"),
                    "artist_top_tracks": artist_results.get("artist_top_tracks"),
                    "artist_top_singles": artist_results.get("artist_top_singles"),
                })
            elif album_id:
                artistId = get_artist_id(album_id)
                album_details = executor.submit(get_spotify_album_details, album_id)
                artist_details = executor.submit(get_artist_details_and_top_tracks, artistId)

                # Extract album details separately
                album_result = album_details.result()
                artist_results = artist_details.result()
                return jsonify({
                    "album_details": album_result.get("album_details"),
                    "album_tracks": album_result.get("album_tracks"),  # Extract tracks separately
                    "artist_details": artist_results.get("artist_details"),
                    "artist_top_tracks": artist_results.get("artist_top_tracks"),
                    "artist_top_singles": artist_results.get("artist_top_singles"),
                })

            elif artist_id:
                artist_details = executor.submit(get_artist_details_and_top_tracks, artist_id)
                # Extract album details separately
                artist_results = artist_details.result()
                return jsonify({
                    "artist_details": artist_results.get("artist_details"),
                    "artist_top_tracks": artist_results.get("artist_top_tracks"),
                    "artist_top_singles": artist_results.get("artist_top_singles"),
                })
            
    elif source == "local":
        with ThreadPoolExecutor() as executor:
            if album_id:
                matching_songs = []
                songsIds, date, name = get_playlist_songIds(album_id)

                album_details = executor.submit(get_custom_album_details, songsIds, date, len(songsIds), name)
                # Extract album details separately
                album_result = album_details.result()
                
                return jsonify({
                    "album_details": album_result.get("album_details"),
                    "album_tracks": album_result.get("album_tracks"),  # Extract tracks separately
                })

            if song_id:
                track_details = get_spotify_track_details(song_id)
                albumId = track_details.get("album_id")
                artistId = track_details.get("artist_id")  # Ensure artist_id is fetched correctly

                album_details = executor.submit(get_spotify_album_details, albumId)
                artist_details = executor.submit(get_artist_details_and_top_tracks, artistId)
                
                # Extract album details separately
                album_result = album_details.result()
                artist_results = artist_details.result()
                return jsonify({
                    "track_details": track_details,
                    "album_details": album_result.get("album_details"),
                    "album_tracks": album_result.get("album_tracks"),  # Extract tracks separately
                    "artist_details": artist_results.get("artist_details"),
                    "artist_top_tracks": artist_results.get("artist_top_tracks"),
                    "artist_top_singles": artist_results.get("artist_top_singles"),
                    "matching_songs": {"tracks": {}}
                })

    else:
        return jsonify({"error": "Invalid source"}), 400

@app.route("/getSearchResults", methods=["GET"])
def search_spotify():
    query = request.args.get("query")
    search_type = request.args.get("searchType")  # "Global" or "Local"

    if not query:
        return jsonify({"status": False, "message": "Query parameter is required"}), 400

    if search_type == "global":
        try:
            # Search for album, artist, and track
            results = sp.search(q=query, type="album,artist,track", limit=4)

            # Extract album results
            albums = [
                {"name": album["name"], "type": "album", "url": album["external_urls"]["spotify"]}
                for album in results.get("albums", {}).get("items", [])
            ]

            # Extract artist results
            artists = [
                {"name": artist["name"], "type": "artist", "url": artist["external_urls"]["spotify"]}
                for artist in results.get("artists", {}).get("items", [])
            ]

            # Extract track results
            tracks = [
                {"name": track["name"], "type": "track", "url": track["external_urls"]["spotify"]}
                for track in results.get("tracks", {}).get("items", [])
            ]

            # Combine all results
            all_results = albums + artists + tracks

            return jsonify({"status": True, "data": all_results})

        except Exception as e:
            return jsonify({"status": False, "message": str(e)}), 500

    elif search_type == "local":
        if songs_df is None:
            return jsonify({"status": False, "message": "Local data not available"}), 500

        try:
            # Search for matching artist name or track name
            matches = songs_df[
                songs_df["artist_name"].str.contains(query, na=False) |
                songs_df["track_name"].str.contains(query, na=False)
            ].head(10)

            # Format results (always link to tracks)
            tracks = [
                {"name": row["track_name"], "type": "track", "url": f"https://open.spotify.com/track/{row['track_id']}"}
                for _, row in matches.iterrows()
            ]

            return jsonify({"status": True, "data": tracks})

        except Exception as e:
            return jsonify({"status": False, "message": f"Local search error: {str(e)}"}), 500


    # If searchType is Local, return an empty response for now
    return jsonify({"status": True, "data": []})

# System prompt to guide the chatbot
SYSTEM_PROMPT = """
You are a helpful and knowledgeable music expert.  Your expertise includes songs, artists, albums, genres, music history, and playlists. You are enthusiastic and enjoy helping users discover new music.  You are also *context-aware*, meaning you consider the previous conversation history when responding.

When answering questions:

* Be concise and informative.
* If the question is ambiguous, ask clarifying questions to understand the user's intent, *taking into account the conversation history*. For example, if a user asks "Recommend some songs," and the previous conversation was about rock music, you can say, "Sure! Still in the mood for rock, or something different?"
* If the question is not related to music, politely state that you are a music expert and cannot answer that question.

When providing song recommendations:

* Recommend up to 10 songs. If the user requests more, politely explain that you are limited to 10 recommendations at a time.
* For each song, provide the song title and artist. Do not provide a link of the song.
* Briefly explain why you are recommending each song. Mention something specific about the song, artist, or genre that makes it a good recommendation, *considering the user's past preferences and requests*. For example, "Since you liked 'Bohemian Rhapsody,' I thought you might enjoy this song by Queen," or "Based on our previous discussion about alternative rock, this song fits the genre and has a similar vibe to what you were describing."
* If the user asks for a playlist, treat it as a request for recommendations and follow the same guidelines.

*Remember to always refer to the conversation history provided to you.  Use it to understand user preferences, track past requests, and provide more personalized and relevant responses.*

Example Interaction (Illustrative - the actual history will be provided by the application):

User: "I like rock and alternative music."

Assistant: "Great!  I'll keep that in mind.  What kind of mood are you in?"

User: "Something energetic."

Assistant: "Okay, here are a few energetic rock and alternative recommendations:

1. 'Seven Nation Army' by The White Stripes: This is a high-energy rock anthem with a driving beat.
2. 'Can't Stop' by Red Hot Chili Peppers: A funky and energetic alternative rock track.
... (up to 10 songs)

"""

def search_spotify_songs(query):
    """Fetch songs from Spotify based on a search query"""
    results = sp.search(q=query, type="track", limit=3)  # Fetch top 3 results
    songs = []
    for item in results["tracks"]["items"]:
        songs.append({"name": item["name"], "artist": item["artists"][0]["name"], "url": item["external_urls"]["spotify"]})
    return songs

@app.route("/llmChat", methods=["POST"])
def llmChat():
    data = request.json
    history = data.get("history", [])
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"response": "Please ask a music-related question."})

    # Construct conversation history
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        role = "user" if msg["sender"] == "user" else "assistant"
        messages.append({"role": role, "content": msg["text"]})
    
    # Add the new user message
    messages.append({"role": "user", "content": user_message})

    try:
        # Get response from OpenAI
        response = client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=messages,
            n=1,
            max_tokens=1024
        )
        bot_response = response.choices[0].message.content

    except Exception as e:
        print(e)
        bot_response = "Sorry, something went wrong while processing your request."

    return jsonify({"response": bot_response})

def songNameArtistName(song_id):
    track = sp.track(song_id)
    return track["name"], track["artists"][0]["name"] if track["artists"] else None

#############################################
# Endpoint: User Profiles
#############################################

@app.route('/updateCurrentUser', methods=['POST'])
def update_current_user():
    global currentUser
    try:
        data = request.get_json()

        user_name = data.get("userName")
        user_id = data.get("id")

        if not user_name or not user_id:
            return jsonify({"status": False}), 400  # Return only status false if missing data

        print(currentUser)
        # Update the global currentUser dictionary
        currentUser = {"userName": user_name, "id": user_id}

        return jsonify({"status": True}), 200  # Return only status true on success

    except Exception as e:
        print("Error updating current user:", e)
        return jsonify({"status": False}), 500  # Return only status false on error

@app.route('/getCurrentUser', methods=['GET'])
@cross_origin()
def get_current_user():
    try:
        if not currentUser:
            return jsonify({"status": False}), 404  # Return status false if no user is set
        
        return jsonify({"status": True, "user": currentUser}), 200  # Return user details with status true

    except Exception as e:
        print("Error fetching current user:", e)
        return jsonify({"status": False}), 500  # Return only status false on error

@app.route('/getAllUsers', methods=['GET'])
@cross_origin()
def get_all_users():
    conn = None
    try:
        conn = db_pool.getconn()
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, first_name, last_name FROM \"user\"")
            users = cur.fetchall()

            user_list = [
                {"user_id": user[0], "name": f"{user[1]} {user[2]}"}
                for user in users
            ]
            user_list.append({"user_id": "newuser", "name": "New User"})

            return jsonify({"users": user_list})

    except DatabaseError as db_error:
        print("Database error:", db_error)
        return jsonify({"message": "Internal server error"}), 500

    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({"message": "An unexpected error occurred"}), 500

    finally:
        if conn:
            db_pool.putconn(conn)  # Return connection to pool

@app.route('/profile', methods=['GET'])
@cross_origin()
def profile():
    conn = None
    try:
        # ✅ 1. Get user_id from request query parameters
        user_id = request.args.get('userId')
        if not user_id:
            return jsonify({"message": "User ID is required"}), 400

        conn = db_pool.getconn()
        with conn.cursor() as cur:
            # ✅ 2. Fetch User Profile Info
            cur.execute(
                "SELECT first_name, last_name, email, country, locale, since FROM \"user\" WHERE user_id = %s",
                (user_id,)
            )
            user = cur.fetchone()
            if not user:
                return jsonify({"message": "User not found"}), 404

            # ✅ 3. Fetch Playlist Count
            cur.execute("SELECT COUNT(*) FROM playlist WHERE user_id = %s", (user_id,))
            playlist_count = cur.fetchone()[0]

            # ✅ 4. Fetch Liked & Disliked Songs
            cur.execute(
                "SELECT status, COUNT(*) FROM usersongs WHERE user_id = %s GROUP BY status",
                (user_id,)
            )
            song_counts = dict(cur.fetchall())  # Convert list of tuples to dictionary
            liked_songs = song_counts.get('like', 0)
            disliked_songs = song_counts.get('dislike', 0)

        return jsonify({
            "first_name": user[0],
            "last_name": user[1],
            "email": user[2],
            "country": user[3],
            "locale": user[4],
            "userSince": user[5].strftime("%b %Y"),
            "totalPlaylist": playlist_count,
            "likedSongs": liked_songs,
            "dislikedSongs": disliked_songs,
            "tracks": []
        })

    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({
            "first_name": "New",
            "last_name": "User",
            "email": "You can explore tracks, discover events, and generate playlists—all without signing up!",
            "country": "US",
            "locale": "English",
            "userSince": "NA",
            "totalPlaylist": 0,
            "likedSongs": 0,
            "dislikedSongs": 0,
            "tracks": []
        })

    finally:
        if conn:
            db_pool.putconn(conn)  # Return connection to pool

@app.route('/userTracks', methods=['GET'])
@cross_origin()
def get_user_tracks():
    conn = None
    try:
        # ✅ Get parameters from request
        user_id = request.args.get('userId')
        track_type = request.args.get('trackType')  # "liked" or "disliked"
        search_query = request.args.get('search', '').strip().lower()  # Search filter

        if not user_id:
            return jsonify({"message": "User ID is required"}), 400
        if track_type not in ["like", "dislike"]:
            return jsonify({"message": "Invalid track type. Use 'liked' or 'disliked'."}), 400

        conn = db_pool.getconn()
        with conn.cursor() as cur:
            # ✅ Fetch tracks with their status
            cur.execute(
                "SELECT track_id, status FROM usersongs WHERE user_id = %s AND status = %s",
                (user_id, track_type)
            )
            user_tracks = cur.fetchall()

        if not user_tracks:
            return jsonify({"tracks": []})

        # ✅ Get Track Details from Spotify API
        track_ids = [track[0] for track in user_tracks]

        spotify_tracks = sp.tracks(track_ids)  # Fetch track details in bulk

        tracks = []
        for track in spotify_tracks.get("tracks", []):
            if track:  # Ensure track data exists
                track_info = {
                    "track_id": track["id"],
                    "name": track["name"],
                    "album": track["album"]["name"],
                    "artist": ", ".join(artist["name"] for artist in track["artists"]),
                    "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                    "url": track["external_urls"]["spotify"],
                    "duration": round(track["duration_ms"] / 60000, 2)
                }

                # ✅ Apply search filter (if provided)
                if search_query:
                    search_target = f"{track_info['name']} {track_info['artist']}".lower()
                    if search_query in search_target:
                        tracks.append(track_info)
                else:
                    tracks.append(track_info)

        return jsonify({"tracks": tracks})

    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({"tracks": []})

    finally:
        if conn:
            db_pool.putconn(conn)  # Return connection to pool

@app.route('/removeTrack', methods=['DELETE'])
@cross_origin()
def remove_track():
    conn = None
    try:
        # Parse JSON data from request
        data = request.json
        user_id = data.get("userId")
        track_id = data.get("trackId")

        # Validate input
        if not user_id or not track_id:
            return jsonify({"message": "User ID and Track ID are required"}), 400

        conn = db_pool.getconn()

        with conn.cursor() as cur:
            # Check if track exists for user
            cur.execute(
                "SELECT 1 FROM usersongs WHERE user_id = %s AND track_id = %s",
                (user_id, track_id)
            )
            if not cur.fetchone():
                return jsonify({"message": "Track not found for this user"}), 404

            # Delete track from usersongs table
            cur.execute(
                "DELETE FROM usersongs WHERE user_id = %s AND track_id = %s",
                (user_id, track_id)
            )
            conn.commit()

        return jsonify({"message": "Song unliked successfully"}), 200

    except Exception as e:
        print("Error removing track:", e)  # Log error
        return jsonify({"message": "Internal server error", "error": str(e)}), 500

    finally:
        if conn:
            db_pool.putconn(conn)  


#############################################
# Endpoint: Playlist
#############################################

@app.route('/track-status', methods=['GET'])
def get_track_status():
    conn = None
    try:
        # ✅ Get trackId and userId from request
        track_id = request.args.get('track_id')
        user_id = currentUser["id"]

        if not track_id or not user_id or user_id == "newuser":
            return jsonify({"status": "none"})

        conn = db_pool.getconn()
        with conn.cursor() as cur:
            # ✅ Fetch track status for the specific user
            cur.execute(
                "SELECT status FROM usersongs WHERE track_id = %s AND user_id = %s",
                (track_id, user_id)
            )
            result = cur.fetchone()

            # ✅ If track exists, return its status; otherwise, return "none"
            status = result[0] if result else "none"

        return jsonify({"status": status})

    except Exception as e:
        return jsonify({"status": "none"})

    finally:
        if conn:
            db_pool.putconn(conn)  # Return connection to pool

@app.route('/update-track-status', methods=['POST'])
def update_track_status():
    conn = None
    try:
        # ✅ Get JSON data from request
        data = request.get_json()
        track_id = data.get("track_id")
        status = data.get("status")  # Can be "liked", "disliked", or "none"
        user_id = currentUser["id"]

        print("track_id:", track_id)
        print("status:", status)
        print("current user:", user_id)

        if not track_id or not user_id or user_id == "newuser":
            return jsonify({"status": False})

        conn = db_pool.getconn()
        with conn.cursor() as cur:
            # ✅ Check if the track exists for this user
            cur.execute(
                "SELECT status FROM usersongs WHERE track_id = %s AND user_id = %s",
                (track_id, user_id)
            )
            existing_track = cur.fetchone()

            if existing_track:
                if status == "none":
                    # ✅ Delete record if status is "none"
                    cur.execute(
                        "DELETE FROM usersongs WHERE track_id = %s AND user_id = %s",
                        (track_id, user_id)
                    )
                else:
                    # ✅ Update status if track exists
                    cur.execute(
                        "UPDATE usersongs SET status = %s WHERE track_id = %s AND user_id = %s",
                        (status, track_id, user_id)
                    )
            else:
                if status != "none":
                    # ✅ Insert new record if track does not exist and status is not "none"
                    cur.execute(
                        "INSERT INTO usersongs (user_id, track_id, status) VALUES (%s, %s, %s)",
                        (user_id, track_id, status)
                    )

            conn.commit()
        return jsonify({"status": True})

    except Exception as e:
        print("Error:", e)
        return jsonify({"status": False})

    finally:
        if conn:
            db_pool.putconn(conn)  # Return connection to pool

@app.route('/loadFilters', methods=['GET'])
def loadPlaylistFilters():
    global songs_df
    try:
        # Extract unique values from songs_df
        genres = songs_df['genre'].dropna().unique().tolist()
        artists = songs_df['artist_name'].dropna().unique().tolist()
        locales = songs_df['locale'].dropna().unique().tolist()
        moods = songs_df['mood'].dropna().unique().tolist()

        return jsonify({
            "genres": genres,
            "artists": artists[:30],
            "locales": locales,
            "moods": moods
        }), 200

    except Exception as e:
        print("Error loading filters:", e)
        return jsonify({
            "genres": [],
            "artists": [],
            "locales": [],
            "moods": []
        }), 500

@app.route('/user/playlists', methods=['GET'])
@cross_origin()
def get_user_playlists():
    conn = None
    try:
        # ✅ 1. Get user_id from request query parameters
        user_id = currentUser["id"]

        conn = db_pool.getconn()
        with conn.cursor() as cur:
            # ✅ 2. Fetch Playlist IDs & Names for the user
            cur.execute(
                "SELECT playlist_id, playlist_name FROM playlist WHERE user_id = %s",
                (user_id,)
            )
            playlists = cur.fetchall()

            if not playlists:
                return jsonify({"message": "No playlists found", "playlists": []}), 200

            # ✅ 3. Fetch Songs Count for each Playlist
            playlist_data = []
            for playlist_id, playlist_name in playlists:
                cur.execute(
                    "SELECT COUNT(*) FROM playlist_song WHERE playlist_id = %s",
                    (playlist_id,)
                )
                track_count = cur.fetchone()  # Returns a tuple like (30,)

                playlist_data.append({
                    "playlistId": playlist_id,
                    "albumName": playlist_name,
                    "totalTracks": track_count[0] if track_count else 0  # Extract first element
                })

        return jsonify({
            "playlists": playlist_data
        })

    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({"message": "Error fetching playlists", "playlists": []}), 500

    finally:
        if conn:
            db_pool.putconn(conn)  # Return connection to pool

@app.route('/user/recentlyPlayed', methods=['GET'])
@cross_origin()
def get_user_recently_played_tracks():
    conn = None
    try:
        # ✅ Get parameters from request
        user_id = currentUser["id"]  # Ensure `currentUser` is set properly
        
        conn = db_pool.getconn()
        with conn.cursor() as cur:
            # ✅ Fetch track IDs for the user
            cur.execute("SELECT track_id FROM recently_played_song WHERE user_id = %s", (user_id,))
            user_tracks = cur.fetchall()

        if not user_tracks:
            return jsonify({"tracks": []})

        # ✅ Extract track IDs
        track_ids = [track[0] for track in user_tracks]

        # ✅ Get Track Details from Spotify API (only if track_ids exist)
        if not track_ids:
            return jsonify({"tracks": []})

        tracks = getTracksInfo(track_ids)
        
        return jsonify({"tracks": tracks})

    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({"error": "Failed to fetch recently played tracks", "details": str(e)})

    finally:
        if conn:
            db_pool.putconn(conn)  # ✅ Return connection to pool

@app.route('/playlist/save', methods=['POST'])
@cross_origin()
def save_playlist():
    conn = None
    try:
        data = request.get_json()
        user_id = currentUser["id"]  # Ensure frontend sends `user_id`
        playlist_name = data.get("playlistName")
        tracks = data.get("tracks")

        if not user_id or not playlist_name or not tracks:
            return jsonify({"status": False, "message": "Missing required fields"})

        conn = db_pool.getconn()

        with conn.cursor() as cur:
            # ✅ Check if playlist with the same name already exists for the user
            cur.execute("SELECT 1 FROM playlist WHERE user_id = %s AND playlist_name = %s", (user_id, playlist_name))
            if cur.fetchone():
                return jsonify({"status": False, "message": "Playlist name already exists"})

            # ✅ Generate a unique playlist ID
            playlist_id = str(uuid.uuid4())

            # ✅ Insert into playlist table
            cur.execute(
                "INSERT INTO playlist (playlist_id, user_id, playlist_name) VALUES (%s, %s, %s)",
                (playlist_id, user_id, playlist_name)
            )

            # ✅ Insert track details into playlist_song table
            track_values = [(playlist_id, track["track_id"], track["name"], track["artist"]) for track in tracks]

            cur.executemany(
                "INSERT INTO playlist_song (playlist_id, track_id, track_name, artist_name) VALUES (%s, %s, %s, %s)",
                track_values
            )

            conn.commit()

        return jsonify({"status": True, "message": "Playlist saved successfully"})

    except Exception as e:
        print("Error saving playlist:", e)  # Log error
        return jsonify({"status": False, "message": "Internal Server Error", "error": str(e)})

    finally:
        if conn:
            db_pool.putconn(conn)

@app.route('/playlist/delete', methods=['DELETE'])
@cross_origin()
def delete_playlist():
    conn = None
    try:
        data = request.get_json()
        user_id = currentUser["id"]  # Ensure frontend sends `user_id`
        playlist_id = data.get("playlistId")

        if not user_id or not playlist_id:
            return jsonify({"status": False, "message": "Missing required fields"})

        conn = db_pool.getconn()

        with conn.cursor() as cur:
            # ✅ Check if the playlist exists and belongs to the user
            cur.execute("SELECT 1 FROM playlist WHERE user_id = %s AND playlist_id = %s", (user_id, playlist_id))
            if not cur.fetchone():
                return jsonify({"status": False, "message": "Playlist not found or unauthorized"})

            # ✅ Delete all tracks related to the playlist
            cur.execute("DELETE FROM playlist_song WHERE playlist_id = %s", (playlist_id,))

            # ✅ Delete the playlist
            cur.execute("DELETE FROM playlist WHERE playlist_id = %s", (playlist_id,))

            conn.commit()

        return jsonify({"status": True, "message": "Playlist deleted successfully"})

    except Exception as e:
        print("Error deleting playlist:", e)
        return jsonify({"status": False, "message": "Internal Server Error", "error": str(e)})

    finally:
        if conn:
            db_pool.putconn(conn)

@app.route('/playlist/songs', methods=['GET'])
@cross_origin()
def get_playlist_songs():
    conn = None
    try:
        # ✅ Get user_id and playlist_id from request query parameters
        user_id = currentUser["id"]  # Ensure frontend sends `user_id`
        playlist_id = request.args.get("playlistId")

        if not user_id or not playlist_id:
            return jsonify({"status": False, "message": "Missing required parameters"})

        conn = db_pool.getconn()
        with conn.cursor() as cur:
            # ✅ Check if playlist exists for the user
            cur.execute(
                "SELECT playlist_name FROM playlist WHERE user_id = %s AND playlist_id = %s",
                (user_id, playlist_id)
            )
            playlist = cur.fetchone()

            if not playlist:
                return jsonify({"status": False, "message": "Playlist not found"})

            playlist_name = playlist[0]

            # ✅ Fetch track IDs from the playlist_song table
            cur.execute(
                "SELECT track_id FROM playlist_song WHERE playlist_id = %s",
                (playlist_id,)
            )
            track_ids = [row[0] for row in cur.fetchall()]

        if not track_ids:
            return jsonify({"status": True, "playlistName": playlist_name, "tracks": []})

        tracks = getTracksInfo(track_ids)

        return jsonify({
            "status": True,
            "playlistName": playlist_name,
            "tracks": tracks
        })

    except Exception as e:
        print("Unexpected error:", e)
        return jsonify({"status": False, "message": "Error fetching playlist songs", "error": str(e)})

    finally:
        if conn:
            db_pool.putconn(conn)  # ✅ Return connection to pool

@app.route('/playlist/update', methods=['PUT'])
@cross_origin()
def update_playlist():
    conn = None
    try:
        data = request.get_json()
        user_id = currentUser["id"]  # Ensure frontend sends `user_id`
        playlist_id = data.get("playlistId")
        new_playlist_name = data.get("playlistName")
        new_tracks = data.get("tracks")

        if not user_id or not playlist_id or not new_playlist_name or not new_tracks:
            return jsonify({"status": False, "message": "Missing required fields"})

        conn = db_pool.getconn()

        with conn.cursor() as cur:
            # ✅ Check if the playlist exists and belongs to the user
            cur.execute("SELECT 1 FROM playlist WHERE playlist_id = %s AND user_id = %s", (playlist_id, user_id))
            if not cur.fetchone():
                return jsonify({"status": False, "message": "Playlist not found or unauthorized"})

            # ✅ Delete existing tracks from playlist_song
            cur.execute("DELETE FROM playlist_song WHERE playlist_id = %s", (playlist_id,))

            # ✅ Update the playlist name in playlist table
            cur.execute("UPDATE playlist SET playlist_name = %s WHERE playlist_id = %s", (new_playlist_name, playlist_id))

            # ✅ Insert new tracks into playlist_song table
            track_values = [(playlist_id, track["track_id"], track["name"], track["artist"]) for track in new_tracks]

            cur.executemany(
                "INSERT INTO playlist_song (playlist_id, track_id, track_name, artist_name) VALUES (%s, %s, %s, %s)",
                track_values
            )

            conn.commit()

        return jsonify({"status": True, "message": "Playlist updated successfully"})

    except Exception as e:
        print("Error updating playlist:", e)  # Log error
        return jsonify({"status": False, "message": "Internal Server Error", "error": str(e)})

    finally:
        if conn:
            db_pool.putconn(conn)  # ✅ Return connection to pool

@app.route('/playlist/recommendations', methods=['POST'])
def playlistRecommendations():
    global songs_df
    try:
        data = request.get_json()
        if songs_df is None:
            return jsonify({"status": False, "message": "Data not loaded"}), 500
        
        user_name = currentUser["userName"]  # Ensure `currentUser` is set properly
        genres = data.get('genres')
        artists = data.get('artists')
        locales = data.get('locales')
        moods = data.get('moods')
        # days = None,
        # random_seed = 42
        num_songs = data.get('num_songs')
        
        recommendations = recommend_songs(
            songs_df,
            user_name=user_name,
            genres=genres,
            artists=artists,
            locale=locales,
            mood=moods,
            num_songs=num_songs,
            # random_seed=random_seed
        )

        track_ids = [track["track_id"] for track in recommendations]
        # track_ids = []

        if not track_ids:
            return jsonify({"status": True, "tracks": []})

        tracks = getTracksInfo(track_ids)

        # call spotify
        return jsonify({"status": True, "tracks": tracks})
    
    except Exception as e:
        print("Error in /playlist/recommendations:", e)
        return jsonify({"status": False, "tracks": []})  # Return only status false on error

@app.route('/findsimilarsongs', methods=['GET'])
def findsimilarsongs():
    try:
        global songs_df
        updatedSongName = None
        updatedArtistName = None

        if songs_df is None:
            return jsonify({"status": False, "message": "Data not loaded"}), 500
        
        song_name = request.args.get('song_name')
        locale = request.args.get('locale')
        num_songs = 5
        
        if song_name and song_name != None:
            updatedSongName, updatedArtistName = songNameArtistName(song_name)

        similar_songs = find_similar_songs(
            songs_df,
            song_name=updatedSongName,
            artist_name=updatedArtistName,
            locale=locale,
            n=num_songs
        )
        
        track_ids = [track["track_id"] for track in similar_songs]
        # track_ids = []

        if not track_ids:
            return jsonify({"status": True, "tracks": []})

        tracks = getTracksInfo(track_ids)

        # call spotify
        return jsonify({"status": True, "tracks": tracks})
    
    except Exception as e:
        print("Error in /findsimilarsongs", e)
        return jsonify({"status": False, "tracks": []})  # Return only status false on error

@app.route('/playlist/headerrecommendations', methods=['GET'])
def headerPlaylistRecommendations():
    global songs_df
    try:
        
        if songs_df is None:
            return jsonify({"status": False, "message": "Data not loaded"}), 500
        
        # user_name = currentUser["id"]  # Ensure `currentUser` is set properly
        
        # days = None,
        # random_seed = None
        num_songs = 5
        
        recommendations = recommend_songs(
            songs_df,
            user_name=None,
            genres=None,
            artists=None,
            locale=['English'],
            mood=None,
            num_songs=num_songs,
        )

        track_ids = [track["track_id"] for track in recommendations]
        # track_ids = []

        if not track_ids:
            return jsonify({"status": True, "tracks": []})

        tracks = getTracksInfo(track_ids)

        # call spotify
        return jsonify({"status": True, "tracks": tracks})
    
    except Exception as e:
        print("Error in /playlist/recommendations:", e)
        return jsonify({"status": False, "tracks": []})  # Return only status false on error


if __name__ == '__main__':
   app.run(host="0.0.0.0", port=5001, debug=True)