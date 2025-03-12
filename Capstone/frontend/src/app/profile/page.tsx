"use client";

import { useEffect, useState } from "react";
import { fetchUserProfile, fetchAllUsers, fetchUserSongs, removeSong, fetchCurrentUser, updateCurrentUser } from "../api/api";

export interface UserProfile {
    first_name: string;
    last_name: string;
    email: string;
    country: string;
    locale: string;
    totalPlaylist: string;
    likedSongs: string;
    dislikedSongs: string;
    userSince: string;
}

export interface AllUsers {
    name: string;
    user_id: string;
}

export interface UserSong {
    track_id: string;
    name: string;
    album: string;
    artist: string;
    image: string | null;
    url: string;
    duration: string;
}

export default function Profile() {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<AllUsers[]>([]);

  const [songType, setSongType] = useState<string>("like");
  const [queryText, setQueryText] = useState<string>("");
  const [userSongs, setUserSongs] = useState<UserSong[]>([]);
  const [loadingTracks, setLoadingTracks] = useState<boolean>(false);

    useEffect(() => {
        const initializeUser = async () => {
            setLoading(true);

            // Fetch current user
            const currentUser = await fetchCurrentUser();
            let userId = "";
            if (currentUser?.status && currentUser.user) {
                userId = currentUser.user.id;
            }

            // Fetch all users
            const fetchedUsers = await fetchAllUsers();
            setUsers(fetchedUsers || []);

            // Ensure selected user exists in the list
            const validUser = fetchedUsers.find((u: any) => u.user_id === userId);
            setSelectedUser(validUser ? validUser.user_id : fetchedUsers[0]?.user_id || "");

            setLoading(false);
        };

        initializeUser();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchUserProfileDetails();
            fetchSongs();

        }
    }, [selectedUser]);

    useEffect(() => {
        if (!loading){
            if (songType || queryText) {
                setUserSongs([]);
                fetchSongs();
            }
        }
    }, [songType, queryText]);

    const fetchUserProfileDetails = async () => {
        setLoading(true);
            const fetchedUser = await fetchUserProfile(selectedUser);
            setUser(fetchedUser);
        setLoading(false);
    };

    const fetchSongs = async () => {
        setLoadingTracks(true);
            const songs: UserSong[] = await fetchUserSongs(selectedUser, songType, queryText);
            setUserSongs(songs);
        setLoadingTracks(false);
    };

    const handleRemoveSong = async (trackId: string) => {
      const message = await removeSong(selectedUser, trackId);
      console.log(message);

      if (message === "Song unliked successfully") {
          setUserSongs(prevSongs => prevSongs.filter(song => song.track_id !== trackId));
      }
    };

    const generateAvatar = (firstLetter: string, lastLetter: string) => {
        const svg = `
          <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#F9E5C0" rx="10" />
            <text x="50%" y="65%" font-size="80" font-family="Arial" fill="white" text-anchor="middle">
              ${firstLetter}${lastLetter}
            </text>
          </svg>
        `;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
      };
      
    // Reset function to clear search and reset country selection
    const handleReset = () => {
        setSongType("like");  // Reset to "Global"
        setQueryText("");  // Clear search input
    };

  return (
    <div>
        
        {(loading || !user) && (
            <div className="loading-overlay" style={{
               position: 'fixed',
               top: 0,
               left: 0,
               width: '100%',
               height: '100%',
               backgroundColor: 'rgba(0, 0, 0, 0.5)',
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 9999,
            }}>
               <div className="loading-spinner"></div> {/* 👈 Now the CSS controls animation */}
               <p style={{ color: 'white', marginTop: '10px' }}>Loading...</p>
            </div>
        )}

        <section style={{ display: loading || !user ? "none" : "block", paddingBottom: "30px" }} className="events-countdown parallax parallax_overlay text-bold" data-stellar-background-ratio="0.5">
                <div className="parallax_inner">
                    <div className="event">
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12 col-sm-6 col-md-3" style={{paddingTop: "20px"}}>
                                    
                                    <img src={
                                        generateAvatar(user?.first_name?.charAt(0)?.toUpperCase() || "", 
                                        user?.last_name?.charAt(0)?.toUpperCase() || "")} alt="#" />
                                    
                                    </div>
                                <div className="col-xs-12 col-sm-6 col-md-9 about-album" style={{paddingLeft: "30px"}}>
                                    <div className="event-details">
                                        <h2>{user?.first_name}, {user?.last_name}</h2>
                                        <h6>{user?.email}</h6>

                                        <ul className="countdown clearfix mt-20">
                                            <li>
                                                <div className="text">
                                                    <span className="days">{user?.locale}</span>
                                                    <p className="days_ref">Locale</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="text">
                                                    <span className="hours">{user?.country}</span>
                                                    <p className="hours_ref">Country</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="text">
                                                    <span className="minutes">{user?.totalPlaylist}</span>
                                                    <p className="minutes_ref">Playlist</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="text">
                                                    <span className="seconds">{user?.likedSongs}</span>
                                                    <p className="seconds_ref">❤️ Songs</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="text">
                                                    <span className="seconds">{user?.dislikedSongs}</span>
                                                    <p className="seconds_ref">👎 Songs</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div className="text">
                                                    <span className="seconds">{user?.userSince}</span>
                                                    <p className="seconds_ref">Since</p>
                                                </div>
                                            </li>
                                            <div style={{paddingTop: "20px"}}>
                                                <div className="form-input select-location pull-right">
                                                    <div className="custome-select">
                                                        <b className="fa fa-bars"></b>
                                                        <span>
                                                            {loading
                                                                ? "Loading..."
                                                                : users.find((u) => u.user_id === selectedUser)?.name || "Select User"}
                                                        </span>

                                                        <select
                                                            id="search-dropdown-box"
                                                            className="select"
                                                            value={selectedUser}
                                                            onChange={async (e) => {
                                                                    const newUserId = e.target.value;

                                                                    // Get the selected user's name
                                                                    const selectedUserObj = users.find((user) => user.user_id === newUserId);
                                                                    const newUserName = selectedUserObj ? selectedUserObj.name : "";

                                                                    if (!newUserName) {
                                                                        console.error("User name not found!");
                                                                        return;
                                                                    }

                                                                    // Update current user in backend
                                                                    const response = await updateCurrentUser(newUserId, newUserName);
                                                                    if (response === true) {
                                                                        setSelectedUser(newUserId); // ✅ Update state only if API call succeeds
                                                                    } else {
                                                                        console.error("Failed to update current user.");
                                                                    }
                                                                }}
                                                            disabled={loading}
                                                        >
                                                            <option value="" disabled>Select User</option>
                                                            {users.length > 0 ? (
                                                                users.map((user) => (
                                                                    <option key={user.user_id} value={user.user_id}>
                                                                        {user.name}
                                                                    </option>
                                                                ))
                                                            ) : (
                                                                <option disabled>Loading users...</option>
                                                            )}
                                                        </select>
                                                    </div>
                                                </div>

                                            </div>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        </section>
        
        <section style={{ display: loading || !user || selectedUser=="newuser" ? "none" : "block"}}>
            <header>
                <div className="container">
                    <div className="row">
                        <div className="col-xs-12 col-md-4">
                            <h2 className="text-uppercase">Showing {songType} Songs.</h2>
                        </div>
                        <div className="col-xs-12 col-md-8">
                            <div className="multiSearchWrapper">
                                <div className="multiSearchWrapper-inner">
                                    <div className="custome-select clearfix">
                                        <label htmlFor="albumType">
                                            <span style={{marginTop: "37px", textTransform: "capitalize"}}>{songType} Songs</span>
                                            <select id="albumType" name="albumType" value={songType} onChange={(e) => setSongType(e.target.value)}>
                                                <option value="" disabled>Select Song Type</option>
                                                    <option value="like">
                                                        Liked Songs
                                                    </option>
                                                    <option value="dislike">
                                                        Disliked Songs
                                                    </option>
                                            </select>
                                        </label>
                                        <b className="fa fa-angle-down"></b>
                                    </div>
                                    {/* Search Input */}
                                    <input 
                                        type="text" 
                                        placeholder="Search Songs" 
                                        value={queryText} 
                                        onChange={(e) => setQueryText(e.target.value)} 
                                    />
                                </div>
                                <button className="btn btn-default" onClick={handleReset}><i className="fa fa-times-circle-o fa-lg"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </section>

        <section style={{ display: loading || !user || selectedUser=="newuser" ? "none" : "block" }}>
        
            {loadingTracks ? (  
            // Show loading message when tracks are being fetched
                <div style={{display: "grid", placeItems: "center"}}>
                    <h3>Loading tracks...</h3>
                </div>
            ) : userSongs.length > 0 ? (
                // Show track list if tracks are found
                <div className="container">
                    <ul className="song-list text-uppercase text-bold clearfix">
                        {userSongs.map((song, index) => (
                            <li key={index} 
                                id={`singleSongPlayer-${index}`}
                                data-before={index + 1}
                                className="song-unit singleSongPlayer clearfix">
                                {/* Album Cover */}
                                <figure>
                                    <img src={song.image || "/default-cover.jpg"} alt={song.name} width="265" height="265" />
                                </figure>

                                {/* Play Button (Now Links to Album Page) */}
                                <span className="playit controls jp-controls-holder">
                                    <a href={`/album?source=spotify&songId=${song.track_id}`} rel="noopener noreferrer">
                                        <i className="jp-play pc-play"></i>
                                    </a>
                                </span>

                                {/* Song Details */}
                                <span className="song-title jp-title" data-before="Title" style={{ maxWidth: "40ch" }} >{song.name}</span>
                                <span className="song-author" data-before="Artist">{song.artist}</span>
                                <span className="song-time jp-duration" data-before="Duration">{song.duration}</span>

                                {/* Remove Button */}
                                <button className="song-btn remove-btn" onClick={() => handleRemoveSong(song.track_id)}>
                                    Remove
                                </button>

                                {/* Audio Progress Bar (Static for now) */}
                                <div className="audio-progress">
                                    <div className="jp-seek-bar">
                                        <div className="jp-play-bar" style={{ width: "20%" }}></div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                // Show no result message if no tracks found
                <div style={{display: "grid", placeItems: "center", paddingTop: "30px"}}>
                    <h3>No Tracks Found, Please change the filters or query!</h3>
                </div>
            )}
                                              
        </section>                                                  
    </div>
  );
} 