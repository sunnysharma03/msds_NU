import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.neighbors import NearestNeighbors
from scipy.sparse import coo_matrix
from surprise import Dataset, Reader, SVD
import pickle
import os
from lightfm import LightFM
from datetime import datetime, timedelta, timezone
from collections import Counter
import time

# Define variables
numerical_features = ['danceability', 'energy', 'key', 'loudness', 'mode', 'speechiness',
                      'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo',
                      'duration_ms', 'time_signature']
categorical_features_knn = ['genre', 'mood']
categorical_features_svd = ['locale_grouped']

key_mapping = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
    'Unknown': -1, '-1.0': -1
}

mode_mapping = {'Major': 1, 'Minor': 0, 'Unknown': -1, '-1.0': -1}

# Helper functions
def decodeStr(value):
    return str(value).encode('utf-8', errors='ignore').decode('utf-8')

def format_song_output(song_df):
    """Format song data into output structure."""
    output = []
    for _, song in song_df.iterrows():
        output.append({
            "track_name": decodeStr(song['track_name']),
            "artist_name": decodeStr(song['artist_name']),
            "track_id": song['track_id']
        })
    return output

def convert_key(value):
    value = str(value).strip()
    return int(float(value)) if value.replace('.', '', 1).isdigit() or value == '-1' else key_mapping.get(value, -1)

def convert_mode(value):
    value = str(value).strip()
    return int(float(value)) if value.replace('.', '', 1).isdigit() else mode_mapping.get(value, -1)


def assign_moods(df):
    # Define conditions for each mood
    conditions = {
        "happy":      (df['valence'] > 0.6) & (df['danceability'] > 0.6) & (df['energy'] > 0.5),
        "sad":        (df['valence'] < 0.3) & (df['danceability'] < 0.4) & (df['energy'] < 0.5),
        "energetic":  (df['energy'] > 0.75) & (df['loudness'] > -5) & (df['tempo'] > 120),
        "romantic":   (df['valence'].between(0.4, 0.7)) & (df['acousticness'] > 0.5) & (df['energy'] < 0.6),
        "chill":      (df['acousticness'] > 0.6) & (df['energy'] < 0.4) & (df['danceability'] < 0.5),
        "angry":      (df['energy'] > 0.8) & (df['loudness'] > -5) & (df['valence'] < 0.4),
        "party":      (df['danceability'] > 0.75) & (df['energy'] > 0.7) & (df['tempo'] > 125) & (df['valence'] > 0.6)
    }

    # Initialize an empty list for each row
    mood_labels = [[] for _ in range(len(df))]

    # Apply all conditions
    for mood, condition in conditions.items():
        for idx in np.where(condition)[0]:  # Get indices where condition is True
            mood_labels[idx].append(mood)

    # Assign "neutral" where no moods were assigned
    df['mood'] = [', '.join(moods) if moods else 'neutral' for moods in mood_labels]

    return df


def preprocess_data(songs_df):
    """Apply preprocessing to the songs DataFrame."""
    songs_df_original = songs_df.copy()  # Avoid modifying the original dataframe
    if 'Unnamed: 0' in songs_df_original.columns:
        songs_df_original.drop(columns=['Unnamed: 0'], axis=1, inplace=True)
        songs_df_original = songs_df_original.dropna()

    songs_df = songs_df_original.copy()
    
    songs_df['key'] = songs_df['key'].apply(convert_key)
    songs_df['mode'] = songs_df['mode'].apply(convert_mode)
    # songs_df = assign_moods(songs_df)
    return songs_df



# Function to find similar songs
def find_similar_songs(spotify_df, song_name=None, artist_name=None, locale=None, n=5):

    songs_df = preprocess_data(spotify_df)  # Ensure preprocessing
    localDf = songs_df.copy()

    # Remove 'locale_grouped' to prevent interference
    if 'locale_grouped' in localDf.columns:
        localDf = localDf.drop(columns=['locale_grouped'])

    # Standardize numerical features
    scaler = StandardScaler()
    localDf[numerical_features] = scaler.fit_transform(localDf[numerical_features])

    # Label encode categorical features
    label_encoders = {}
    for feature in categorical_features_knn:
        le = LabelEncoder()
        localDf[feature] = le.fit_transform(localDf[feature])
        label_encoders[feature] = le

    # Combine numerical and categorical features for further processing
    features = numerical_features + categorical_features_knn

    # Fit NearestNeighbors model on songs data
    nn = NearestNeighbors(metric='cosine', algorithm='brute')
    nn.fit(localDf[features])

    # Filter song based on input parameters
    filtered_song = localDf
    if song_name:
        filtered_song = filtered_song[filtered_song['track_name'] == song_name]
    if artist_name:
        filtered_song = filtered_song[filtered_song['artist_name'] == artist_name]

    # If no matching song is found, return an empty list
    if filtered_song.empty:
        print("⚠️ Song not found")
        return []

    # Get the feature vector for the input song
    song_vector = filtered_song[features].values

    # Find the nearest neighbors
    similar_songs = []
    added_songs = set()  # Track already returned songs
    extra_neighbors = 10  # Start with 10 extra recommendations
    max_attempts = 5       # Limit the number of expansions

    for attempt in range(max_attempts):
        # Find more candidates each time
        distances, indices = nn.kneighbors(song_vector, n_neighbors=n + extra_neighbors)

        # Collect similar songs
        for i in indices.flatten():
            if i >= len(localDf):  # Ensure index is valid
                continue

            similar_song = localDf.iloc[i][['track_name', 'artist_name', 'track_id', 'locale']].copy()

            # Exclude the exact match (same track_id)
            if (similar_song['track_name'] == song_name) and (similar_song['artist_name'] == artist_name):
                continue

            # Skip duplicate songs
            if similar_song['track_id'] in added_songs:
                continue

            # Apply locale filter
            if locale and similar_song['locale'] not in locale:
                continue  

            similar_songs.append({
                "track_name": decodeStr(similar_song['track_name']),
                "artist_name": decodeStr(similar_song['artist_name']),
                "track_id": similar_song['track_id']
            })

            # Track the added song to avoid duplicates
            added_songs.add(similar_song['track_id'])

            # Stop when we have enough results
            if len(similar_songs) >= n:
                return similar_songs  # ✅ Fix: Return the correct list format

        # Expand search if not enough results
        extra_neighbors += 10

    return similar_songs  # ✅ Fix: Return the list instead of DataFrame slicing

# Function for song recommendations
def recommend_songs(spotify_df, user_name=None, genres=None, artists=None, locale=None, mood=None, num_songs=50, days=30, random_seed=None):
    """
    Unified function for song recommendations.
    - If user history data is present, it fetches user history and recommends based on SVD.
    - If user history data is not present, it generates recommendations using LightFM.
    """
    songs_df = preprocess_data(spotify_df)  # Ensure preprocessing
    filtered_DF = songs_df.copy()

    print(f"Input - Genres: {genres}, Artists: {artists}, Locale: {locale}, Mood: {mood}, User: {user_name}")

    # Apply locale filter
    if locale:
        filtered_DF = filtered_DF[filtered_DF['locale'].isin(locale)]
        print(f"Filtered by locale: {filtered_DF.shape[0]} songs remaining.")

    # Apply mood filter
    if mood:
        mood_pattern = '|'.join(mood)
        filtered_DF = filtered_DF[filtered_DF['mood'].str.contains(mood_pattern, na=False, case=False, regex=True)]
        print(f"Filtered by mood: {filtered_DF.shape[0]} songs remaining.")

    # Apply genre filter
    if genres:
        filtered_DF = filtered_DF[filtered_DF['genre'].isin(genres)]
        print(f"Filtered by genres: {filtered_DF.shape[0]} songs remaining.")

    # Apply artist filter
    if artists:
        artist_filtered_DF = songs_df[songs_df['artist_name'].isin(artists)]
        print(f"Filtered by artists: {artist_filtered_DF.shape[0]} songs remaining.")
        filtered_DF = pd.concat([filtered_DF, artist_filtered_DF])

    # Drop duplicates
    filtered_DF = filtered_DF.drop_duplicates()

    # Ensure that songs that match *all* filters are prioritized
    matching_songs = filtered_DF.copy()

    # Prioritize songs based on the number of filter matches
    matching_songs['filter_match_score'] = 0
    if genres:
        matching_songs['filter_match_score'] += matching_songs['genre'].isin(genres).astype(int)
    if artists:
        matching_songs['filter_match_score'] += matching_songs['artist_name'].isin(artists).astype(int)
    if locale:
        matching_songs['filter_match_score'] += matching_songs['locale'].isin(locale).astype(int)
    if mood:
        matching_songs['filter_match_score'] += matching_songs['mood'].str.contains(mood_pattern, na=False, case=False, regex=True).astype(int)

    # Sort by filter match score first, then by other ranking factors (e.g., popularity or model score)
    matching_songs = matching_songs.sort_values(by=['filter_match_score', 'popularity'], ascending=[False, False])

    # Check if user history data exists
    user_history_path = f"./data/userdata/spotify_{user_name}.csv"
    print(user_history_path)
    if user_name and os.path.exists(user_history_path):
        return predict_songs_for_user(user_name, matching_songs, num_songs, days, random_seed)

    # If no user history, use LightFM-based recommendation
    return generate_playlist_recommendations(songs_df, matching_songs, num_songs, random_seed)

#LightFM Code Starts
MODEL_PATH = "./utils/lightfm_model.pkl"

def train_or_load_lightfm_model(songs_df):
    """Loads the LightFM model if available, otherwise trains and saves it on the full dataset."""
    if os.path.exists(MODEL_PATH):
        print("Loading saved LightFM model...")
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
    else:
        print("Training new LightFM model on the full dataset...")

        # Create interaction matrix for the full dataset (not filtered!)
        num_songs = songs_df.shape[0]
        rows = np.zeros(num_songs, dtype=np.int32)
        cols = np.arange(num_songs, dtype=np.int32)
        data = np.ones(num_songs, dtype=np.float32)

        interaction_matrix = coo_matrix((data, (rows, cols)), shape=(1, num_songs))

        model = LightFM(loss='warp')
        model.fit(interaction_matrix, epochs=30, num_threads=4, verbose=True)

        # Save model for reuse
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(model, f)

    return model

def generate_playlist_recommendations(songs_df, filtered_DF, num_songs, random_seed):
    """LightFM-based recommendation for new users."""

    if filtered_DF.empty:
        print("No songs available after filtering.")
        return []

    # Use the provided random seed or generate one dynamically
    if random_seed is None:
        random_seed = int(time.time()) % (2**32 - 1)
    np.random.seed(random_seed)

    # Create an interaction matrix
    num_filtered_songs = filtered_DF.shape[0]
    rows = np.zeros(num_filtered_songs, dtype=np.int32)
    cols = np.arange(num_filtered_songs, dtype=np.int32)
    data = np.ones(num_filtered_songs, dtype=np.float32)
    interaction_matrix = coo_matrix((data, (rows, cols)), shape=(1, num_filtered_songs))

    # Train or load LightFM model
    model = train_or_load_lightfm_model(songs_df)

    # Generate scores for all songs
    scores = model.predict(0, np.arange(num_filtered_songs))
    filtered_DF['combined_score'] = scores + (filtered_DF['popularity'] / 100) + (filtered_DF['filter_match_score'] * 10)

    # Add slight random noise to break ties and introduce randomness
    filtered_DF['combined_score'] += np.random.uniform(-0.01, 0.01, size=len(filtered_DF))

    # Sort by combined score
    sorted_songs = filtered_DF.sort_values(by='combined_score', ascending=False).head(num_songs)
    
    # Shuffle the top results to introduce randomness
    randomized_songs = sorted_songs.sample(frac=1, random_state=random_seed).reset_index(drop=True)

    return format_song_output(randomized_songs)
#LightFM Code Ends ---------------------------------------------------

#SVD Code Starts
def predict_songs_for_user(user_name, filtered_DF, num_songs, days, random_seed):
    """SVD-based recommendation for existing users."""

    user_df = pd.read_csv(f"./data/userdata/spotify_{user_name}.csv")
    user_df['played_at'] = pd.to_datetime(user_df['played_at'], utc=True)

    recent_songs = user_df[user_df['played_at'] >= datetime.now(timezone.utc) - timedelta(days=days)]

    # If recent_songs is not empty, assign it to user_df
    if not recent_songs.empty:
        user_df = recent_songs

    # Use the provided random seed or a dynamic value
    if random_seed is None:
        random_seed = int(time.time()) % (2**32 - 1)  # Use a timestamp-based seed
    np.random.seed(random_seed)

    # Ensure both datasets have the same columns before combining
    user_df = user_df.rename(columns={'language': 'locale'})  # Align column names

    # Get all column names from both datasets
    all_columns = set(filtered_DF.columns) | set(user_df.columns)

    # Fill missing values in user_df using track_id from songs_df
    for col in all_columns:
        if col not in user_df.columns:
            user_df[col] = user_df['track_id'].map(filtered_DF.set_index('track_id')[col])

    # Fill missing values in songs_df using track_id from user_df
    for col in all_columns:
        if col not in filtered_DF.columns:
            filtered_DF[col] = filtered_DF['track_id'].map(user_df.set_index('track_id')[col])

    # Assign default values for any remaining missing data
    for col in all_columns:
        if col not in numerical_features:
            user_df[col].fillna('unknown')
            filtered_DF[col].fillna('unknown')
        else:
            user_df[col].fillna(0)
            filtered_DF[col].fillna(0)

    # Standardize numerical features
    scaler = StandardScaler()
    filtered_DF[numerical_features] = scaler.fit_transform(filtered_DF[numerical_features])
    user_df[numerical_features] = scaler.transform(user_df[numerical_features])

    # Label encode categorical features
    label_encoders = {}
    for feature in categorical_features_svd:
        le = LabelEncoder()
        le.fit(pd.concat([filtered_DF[feature], user_df[feature]], axis=0))
        filtered_DF[feature] = le.transform(filtered_DF[feature])
        user_df[feature] = le.transform(user_df[feature])
        label_encoders[feature] = le

    # Prepare data for Surprise
    combined_df = pd.concat([user_df, filtered_DF])
    combined_df['user_name'] = combined_df['user_name'].fillna('unknown_user')
    reader = Reader(rating_scale=(combined_df['popularity'].min(), combined_df['popularity'].max()))
    data = Dataset.load_from_df(combined_df[['user_name', 'track_id', 'popularity']], reader)
    trainset = data.build_full_trainset()

    # Train SVD model
    model = SVD()
    model.fit(trainset)

    # Predict ratings
    user_songs = set(user_df['track_id'].tolist())
    all_songs = filtered_DF['track_id'].unique()
    predictions = [
        (track_id, model.predict('unknown_user', track_id).est + 
         filtered_DF.loc[filtered_DF['track_id'] == track_id, 'filter_match_score'].values[0] * 0.5)
        for track_id in all_songs if track_id not in user_songs
    ]

    # Shuffle & Select Top Recommendations
    np.random.shuffle(predictions)
    sampled_predictions = predictions[:num_songs]

    recommended_songs = filtered_DF[filtered_DF['track_id'].isin([x[0] for x in sampled_predictions])]

    # Shuffle the top results to introduce randomness
    randomized_songs = recommended_songs.sample(frac=1, random_state=random_seed).reset_index(drop=True)

    return format_song_output(randomized_songs)
#SVD Code Ends ---------------------------------------------------

