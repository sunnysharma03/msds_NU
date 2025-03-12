-- Create Database (Run separately if needed)
CREATE DATABASE songfox;

-- Connect to the database
\c songfox;

-- Create user table
CREATE TABLE user (
    user_id UUID PRIMARY KEY,
    since TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    country VARCHAR(100),
    locale VARCHAR(10),
    profile_image TEXT,
    first_name VARCHAR(100)
);

-- Create playlist table
CREATE TABLE playlist (
    playlist_id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    playlist_name VARCHAR(255) NOT NULL
);

-- Create playlist_song table
CREATE TABLE playlist_song (
    id SERIAL PRIMARY KEY,
    playlist_id INT REFERENCES playlist(playlist_id) ON DELETE CASCADE,
    track_id VARCHAR(255) NOT NULL,
    track_name VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL
);

-- Create recently_played_song table
CREATE TABLE recently_played_song (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user(user_id) ON DELETE CASCADE,
    acousticness FLOAT,
    instrumentalness FLOAT,
    liveness FLOAT,
    valence FLOAT,
    tempo FLOAT,
    duration_ms INT,
    time_signature INT,
    popularity INT,
    year INT,
    danceability FLOAT,
    energy FLOAT,
    key INT,
    loudness FLOAT,
    mode INT,
    speechiness FLOAT,
    artist_name VARCHAR(255),
    track_name VARCHAR(255),
    track_id VARCHAR(255),
    locale VARCHAR(10),
    image TEXT,
    genre VARCHAR(255),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create usersongs table
CREATE TABLE usersongs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user(user_id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    track_id VARCHAR(255) NOT NULL,
    status VARCHAR(50)
);

-- Insert a sample user
INSERT INTO user (user_id, first_name, last_name, email, password_hash, country, locale, profile_image) 
VALUES ('a2c47fd1-3989-4ac1-9544-6a14974a2d72', 'Sachin', 'Sharma', 'sachin@example.com', 'hashed_password', 'India', 'en-IN', NULL);
