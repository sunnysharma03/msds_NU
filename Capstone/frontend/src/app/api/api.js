// src/api/getHomepageSongs.js
  
const homeAdd = "http://127.0.0.1:5001"
// const homeAdd = ""

export async function getNewReleases() {
    try {
        const response = await fetch(`${homeAdd}/getNewReleases`);
        const data = await response.json();

        if (data.status) {
            return data.data.map((album, index) => ({
                id: index + 1,
                albumName: album.album_name,
                albumUrl: album.album_href,
                albumImage: album.album_image,
                artistName: album.artist_name,
                artistUrl: album.artist_href,
                releaseDate: album.release_date,
                totalTracks: album.total_tracks,
                albumDurationMs: album.album_duration_ms,  // Total duration in milliseconds
                albumDurationMin: album.album_duration_min, // Total duration in minutes
                popularity: album.popularity, // Popularity score (0-100)
                genre: album.genre, // First genre from Spotify
                artistFollowers: album.artist_followers, // Total followers count
                albumType: album.album_type, // Single, Album, or Compilation
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching new releases:", error);
        return [];
    }
}

export async function getDailyTop_ViralSongs(country, query = "", selectionCategory) {
    try {
        const response = await fetch(
            `${homeAdd}/getDailyTop_ViralSongs?country=${encodeURIComponent(country)}&query=${encodeURIComponent(query)}&selectionCategory=${encodeURIComponent(selectionCategory)}`
        );
        
        const data = await response.json();

        if (data.status) {
            return data.data.map((song, index) => ({
                id: index + 1,
                songName: song.song_name,
                songUrl: song.song_url,
                imgUrl: song.img_url,
                artistName: song.artist_name,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching top viral songs:", error);
        return [];
    }
}

export async function getUniqueCountries() {
    try {
        const response = await fetch(`${homeAdd}/get-countries`);
        const data = await response.json();

        // Check if the status is true
        if (data.status) {
            // Map the country data into a desired structure
            return data.data.map((country, index) => ({
                id: index + 1,  // Generate a unique ID for each country
                countryName: country,  // The country name from the response
            }));
        }
        return [];  // Return an empty array if status is false
    } catch (error) {
        console.error("Error fetching unique countries:", error);
        return [];  // Return an empty array if there's an error
    }
}

export async function getTrendingCitySongs() {
    try {
        const response = await fetch(`${homeAdd}/get-trending-city-songs`);
        const data = await response.json();

        // Check if the status is true
        if (data.status) {
            return data.data.map((song, index) => ({
                id: index + 1,  // Generate a unique ID for each song
                city: song.city,
                songName: song.song_name,
                duration: song.duration,
                imgUrl: song.img_url,
                songUrl: song.song_url,
                artistName: song.artist_name
            }));
        }
        return [];  // Return an empty array if status is false
    } catch (error) {
        console.error("Error fetching trending city songs:", error);
        return [];  // Return an empty array if there's an error
    }
}

export async function getAllFeaturedSongs(country, query = "") {
    try {
        const response = await fetch(
            `${homeAdd}/getAllFeaturedSongs?country=${encodeURIComponent(country)}&query=${encodeURIComponent(query)}`
        );
        
        const data = await response.json();

        if (data.status) {
            return {
                dailyTopSongs: data.data.dailyTopSongs?.map((song , index) => ({
                    id: index + 1,
                    songName: song.song_name,
                    songUrl: song.song_url,
                    imgUrl: song.img_url,
                    artistName: song.artist_name,
                })) || [],

                dailyViralSongs: data.data.dailyViralSongs?.map((song, index) => ({
                    id: index + 1,
                    songName: song.song_name,
                    songUrl: song.song_url,
                    imgUrl: song.img_url,
                    artistName: song.artist_name,
                })) || [],

                trendingCitySongs: data.data.trendingCitySongs?.map((song, index) => ({
                    id: index + 1,
                    city: song.city,
                    songName: song.song_name,
                    duration: song.duration,
                    imgUrl: song.img_url,
                    songUrl: song.song_url,
                    artistName: song.artist_name,
                })) || [],

                weeklyTopAlbums: data.data.weeklyTopAlbums?.map((album, index) => ({
                    id: index + 1,
                    albumName: album.album_name,
                    albumUrl: album.album_url,
                    imgUrl: album.img_url,
                    artistName: album.artist_name,
                })) || [],

                weeklyTopArtists: data.data.weeklyTopArtist?.map((artist, index) => ({
                    id: index + 1,
                    artistUrl: artist.artist_url,
                    imgUrl: artist.img_url,
                    artistName: artist.artist_name,
                })) || []
            };
        }
        return {
            dailyTopSongs: [],
            dailyViralSongs: [],
            trendingCitySongs: [],
            weeklyTopAlbums: [],
            weeklyTopArtists: [],
        };
    } catch (error) {
        console.error("Error fetching featured songs:", error);
        return {
            dailyTopSongs: [],
            dailyViralSongs: [],
            trendingCitySongs: [],
            weeklyTopAlbums: [],
            weeklyTopArtists: [],
        };
    }
}

export async function dailySongsFacts(country) {
    try {
        const response = await fetch(
            `${homeAdd}/dailySongsFacts?country=${encodeURIComponent(country)}`
        );

        const data = await response.json();

        if (data.status) {
            return data.data.map((fact, index) => ({
                id: index + 1,
                fact: fact.fact,
                dates: fact.dates,
                imgUrl: fact.img_url,
                bgImage: fact.bgImage,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching slider facts:", error);
        return [];
    }
}

export async function fetchEvents({ size = 10, country = "US", startDate, endDate, eventName = "", category }) {
    try {
        const queryParams = new URLSearchParams({
            size,
            country,
            eventName,
            category,
        });

        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);

        const response = await fetch(`${homeAdd}/events?${queryParams.toString()}`);
        const result = await response.json();

        // Check if status is true and data exists
        if (result.status && Array.isArray(result.data)) {
            return result.data.map((event, index) => ({
                id: index + 1,  // Assign a unique ID for React list rendering
                name: event.name,
                date: event.date ? new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A",
                venue: event.venue,
                city: event.city,
                country: event.country,
                image: event.imgUrl || "assets/demo-data/a1.jpg", // Default image if missing
                url: event.url,
                price: event.price || "Price not available",
            }));
        }

        return [];
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function fetchMusicDetails(source, songId, albumId, artistId) {
    try {
        const url = new URL(`${homeAdd}/fetchMusicData`);
        if (source) url.searchParams.append("source", source);
        if (songId) url.searchParams.append("songId", songId);
        if (albumId) url.searchParams.append("albumId", albumId);
        if (artistId) url.searchParams.append("artistId", artistId);

        const response = await fetch(url);
        const data = await response.json();
        console.log(data)

        
        return data || {};
    } catch (error) {
        console.error("Error fetching music details:", error);
        return {};
    }
}

export async function fetchGlobalSearchResults(query, searchType) {
    
    try {
        const response = await fetch(
            `${homeAdd}/getSearchResults?query=${encodeURIComponent(query)}&searchType=${encodeURIComponent(searchType)}`
        );

        const data = await response.json();
        return data.status ? data.data : [];
    } catch (error) {
        console.error("Error fetching global search results:", error);
        return [];
    }
}

export async function sendMessageToAPI(userMessage, history) {
    try {
        const response = await fetch(`${homeAdd}/llmChat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                history: history,
                message: userMessage,
            }),
        });

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Error fetching chat response:", error);
        return "Sorry, something went wrong. Please try again.";
    }
}

export async function updateCurrentUser(user_id, userName) {
    try {
        const response = await fetch(`${homeAdd}/updateCurrentUser`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: user_id, userName }), // ✅ Send correct keys
        });

        if (!response.ok) {
            throw new Error(`Failed to update current user. Status: ${response.status}`);
        }

        const data = await response.json();
        return data.status; // ✅ Return only status (true/false)
    } catch (error) {
        console.error("Error updating current user:", error);
        return false; // ✅ Return false on failure
    }
}

export async function fetchAllUsers() {
    try {
        const response = await fetch(`${homeAdd}/getAllUsers`);

        if (!response.ok) {
            throw new Error(`Failed to fetch users. Status: ${response.status}`);
        }

        const data = await response.json();
        return data.users; // Expected format: { users: [...] }
    } catch (error) {
        console.error("Error fetching users:", error);
        return [];
    }
}

export async function fetchUserProfile(userId) {
    try {
        const response = await fetch(`${homeAdd}/profile?userId=${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected profile response
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}

export async function fetchUserSongs(userId, trackType, searchQuery = "") {
    try {
        const response = await fetch(
            `${homeAdd}/userTracks?userId=${userId}&trackType=${trackType}&search=${encodeURIComponent(searchQuery)}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data.tracks; // Expected array of tracks
    } catch (error) {
        console.error("Error fetching user songs:", error);
        return [];
    }
}

export async function removeSong(userId, trackId) {
    try {
        const response = await fetch(`${homeAdd}/removeTrack`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, trackId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to remove song. Status: ${response.status}`);
        }

        const data = await response.json();
        return data.message; // "Song unliked successfully"
    } catch (error) {
        console.error("Error remove song:", error);
        return "Failed to remove song.";
    }
}

export async function fetchCurrentUser() {
    try {
        const response = await fetch(`${homeAdd}/getCurrentUser`);

        if (!response.ok) {
            throw new Error(`Failed to fetch current user. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { status: true, user: { userName, id } }
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}

export async function fetchPlaylistFilters() {
    try {
        const response = await fetch(`${homeAdd}/loadFilters`);

        if (!response.ok) {
            throw new Error(`Failed to fetch playlist filters. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { genres: [...], artists: [...], locales: [...], moods: [...] }
    } catch (error) {
        console.error("Error fetching playlist filters:", error);
        return { genres: [], artists: [], locales: [], moods: [] }; // Return empty lists on failure
    }
}

export async function fetchUserPlaylists() {
    try {
        const response = await fetch(`${homeAdd}/user/playlists`);

        if (!response.ok) {
            throw new Error(`Failed to fetch user playlists. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { userId: string, playlists: [...] }
    } catch (error) {
        console.error("Error fetching user playlists:", error);
        return { userId: "", playlists: [] }; // Return an empty structure on failure
    }
}

export async function fetchRecentlyPlayedSongs() {
    try {
        const response = await fetch(`${homeAdd}/user/recentlyPlayed`);

        if (!response.ok) {
            throw new Error(`Failed to fetch recently played songs. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { tracks: [...] }
    } catch (error) {
        console.error("Error fetching recently played songs:", error);
        return { tracks: [] }; // Return an empty structure on failure
    }
}

export async function fetchPlaylistRecommendations(artists, genres, moods, locales, num_songs) {
    try {
        const response = await fetch(`${homeAdd}/playlist/recommendations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                artists,
                genres,
                moods,
                locales,
                num_songs
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch playlist recommendations. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { playlists: [...] }
    } catch (error) {
        console.error("Error fetching playlist recommendations:", error);
        return { playlists: [] }; // Return an empty structure on failure
    }
}

export async function fetchPlaylistHeaderRecommendations() {
    try {
        const response = await fetch(`${homeAdd}/playlist/headerrecommendations`, {
            method: "GET"
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch playlist recommendations. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { playlists: [...] }
    } catch (error) {
        console.error("Error fetching playlist recommendations:", error);
        return { playlists: [] }; // Return an empty structure on failure
    }
}

export async function savePlaylistRecommendations(tracks, playlistName) {
    try {
        const response = await fetch(`${homeAdd}/playlist/save`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                tracks: tracks,
                playlistName: playlistName,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch playlist recommendations. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { playlists: [...] }
    } catch (error) {
        console.error("Error fetching playlist recommendations:", error);
        return { playlists: [] }; // Return an empty structure on failure
    }
}

export async function deletePlaylist(playlistId) {
    try {
        const response = await fetch(`${homeAdd}/playlist/delete`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                playlistId: playlistId,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to delete playlist. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { status: true, message: "Playlist deleted successfully" }
    } catch (error) {
        console.error("Error deleting playlist:", error);
        return { status: false, message: "Error deleting playlist" }; // Return error response
    }
}

export async function getPlaylistSongs(playlistId) {
    try {
        const response = await fetch(`${homeAdd}/playlist/songs?playlistId=${playlistId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch playlist songs. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { status: true, playlistName: "...", tracks: [...] }
    } catch (error) {
        console.error("Error fetching playlist songs:", error);
        return { status: false, message: "Error fetching playlist songs", tracks: [] }; // Return an error response
    }
}

export async function updatePlaylist(playlistId, playlistName, tracks) {
    try {
        const response = await fetch(`${homeAdd}/playlist/update`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                playlistId: playlistId,
                playlistName: playlistName,
                tracks: tracks,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to update playlist. Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response: { status: true, message: "Playlist updated successfully" }
    } catch (error) {
        console.error("Error updating playlist:", error);
        return { status: false, message: "Error updating playlist" }; // Return an error response
    }
}

export async function fetchSimilarSongs(trackName) {
    try {
        const response = await fetch(
            `${homeAdd}/findsimilarsongs?song_name=${trackName}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected array of tracks
    } catch (error) {
        console.error("Error fetching user songs:", error);
        return [];
    }
}

export async function fetchTrackStatus(trackId) {
    try {
        const response = await fetch(`${homeAdd}/track-status?track_id=${trackId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // "liked", "disliked", or "none"
    } catch (error) {
        console.error("Error fetching track status:", error);
        return "none";
    }
}

export async function updateTrackStatus(trackId, status) {
    try {
        const response = await fetch(`${homeAdd}/update-track-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ track_id: trackId, status }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected response from the API
    } catch (error) {
        console.error("Error updating track status:", error);
        return null;
    }
}