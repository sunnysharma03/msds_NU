"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from "react";
import { fetchMusicDetails, fetchSimilarSongs, updateTrackStatus, fetchTrackStatus, fetchCurrentUser } from "../api/api";

interface TrendingCitySong {
    id: number;
    city: string;
    songName: string;
    duration: string;
    imgUrl: string;
    songUrl: string;
    artistName: string;
}

export interface SimilarSong {
    track_id: string;
    name: string;
    album: string;
    artist: string;
    image: string;
    url: string;
    duration: string;
}

interface TrackDetails {
    name: string;
    albumName: string;
    releaseDate: string;
    artists: string;
    image: string;
    spotifyUrl: string;
    durationMs: string;
    type: string;
    totalTracks: string;
    popularity: number
}

interface AlbumDetails {
    name: string;
    releaseDate: string;
    totalTracks: string;
    image: string;
    spotifyUrl: string;
    artists: string;
    type: string;
    popularity: number;
    durationMs: string;
}

interface ArtistDetails {
    name: string;
    genres: string[];
    followers: number;
    image: string;
    spotifyUrl: string;
    popularity: number;
    type: string;
}

interface ArtistTopTracks {
    name: string;
    image: string;
    spotifyUrl: string;
    popularity: number;
    durationMs: string;
    albumName: string;
    releaseDate: string;
}

interface ArtistTopSingles {
    name: string;
    image: string;
    spotifyUrl: string;
    releaseDate: string;
}

export default function Album() {

    const searchParams = useSearchParams();
    const source = searchParams.get('source');
    const songId = searchParams.get('songId');
    const albumId = searchParams.get('albumId');
    const artistId = searchParams.get('artistId');

    // const [trendingCitySongs, setTrendingCitySongs] = useState<TrendingCitySong[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>(""); //current user
    const [trackDetails, setTrackDetails] = useState<TrackDetails | null>(null);
    const [albumDetails, setAlbumDetails] = useState<AlbumDetails | null>(null);
    const [albumTrackDetails, setAlbumTrackDetails] = useState<TrackDetails[]>([]);
    const [artistDetails, setArtistDetails] = useState<ArtistDetails | null>(null);
    const [artistTopTracks, setArtistTopTracks] = useState<ArtistTopTracks[]>([]);
    const [artistTopSingles, setArtistTopSingles] = useState<ArtistTopSingles[]>([]);
    const [similarTracks, setSimilarTrack] = useState<SimilarSong[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [songStatus, setSongStatus] = useState("");


    useEffect(() => {
        setLoading(true);
        const fetchTrackDetails = async () => {

            // Fetch current user
            const currentUser = await fetchCurrentUser();
            if (currentUser?.status && currentUser.user) {
                setSelectedUser(currentUser.user.id)

                if (currentUser.user.id != "newuser" && songId != ""){
                    const resp = await fetchTrackStatus(songId)
                    setSongStatus(resp.status)
                }

            }

            // if (!source || (!songId && !albumId)) return; // Ensure required params exist
            const data = await fetchMusicDetails(source, songId, albumId, artistId);
            
            // fetch track details
            if (data?.track_details && Object.keys(data.track_details).length > 0) {
                setTrackDetails({
                    name: data.track_details.name,
                    artists: data.track_details.artists.join(", "),
                    image: data.track_details.image || "",  // Ensure safety
                    spotifyUrl: data.track_details.spotify_url,
                    releaseDate: data.track_details.release_date,
                    albumName: data.track_details.albumName,
                    durationMs: `${Math.floor(data.track_details.duration_ms / 60000)}:${((data.track_details.duration_ms % 60000) / 1000).toFixed(0).padStart(2, "0")}`, // Convert ms to min:sec
                    totalTracks: data.track_details.total_tracks,
                    type: data.track_details.type,
                    popularity: data.track_details.popularity
                });
            }
            
            // Fetch album details 
            if (data?.album_details && Object.keys(data.album_details).length > 0) {
                setAlbumDetails({
                    name: data.album_details.name,
                    releaseDate: data.album_details.release_date,
                    totalTracks: data.album_details.total_tracks,
                    image: data.album_details.image,
                    spotifyUrl: data.album_details.spotify_url,
                    artists: data.album_details.artists.join(", "),
                    type: data.album_details.type,
                    popularity: data.album_details.popularity,
                    durationMs: `${Math.floor(data.album_details.duration_ms / 60000)}:${((data.album_details.duration_ms % 60000) / 1000).toFixed(0).padStart(2, "0")}`, // Convert ms to min:sec
                });
            }

            // fetch album tracks
            if (data?.album_tracks && Array.isArray(data.album_tracks) && data.album_tracks.length > 0) {
                const formattedTracks = data.album_tracks.map((track: any) => ({
                    name: track.name,
                    artists: track.artists.join(", "),
                    image: track.image || "",  // Ensure safety
                    spotifyUrl: track.spotify_url,
                    durationMs: `${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, "0")}`, 
                    popularity: track.popularity
                }));
            
                setAlbumTrackDetails(formattedTracks);
            }            

            // Fetch artist details
            if (data?.artist_details && Object.keys(data.artist_details).length > 0) {
                const artistData = data.artist_details; // Correct nested access
                setArtistDetails({
                    name: artistData.name,
                    genres: artistData.genres || [],  // Handle undefined genres
                    followers: artistData.followers || 0,
                    image: artistData.image || "",
                    spotifyUrl: artistData.spotify_url || "",
                    popularity: artistData.popularity || 0,
                    type: artistData.type || "artist"
                });
            }

            // Fetch artist top tracks
            if (data?.artist_top_tracks && Array.isArray(data.artist_top_tracks) && data.artist_top_tracks.length > 0) {
                const formattedTracks = data.artist_top_tracks.map((track: any) => ({
                    name: track.name,
                    image: track.image || "",  // Ensure safety
                    spotifyUrl: track.spotify_url,
                    durationMs: `${Math.floor(track.duration_ms / 60000)}:${((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, "0")}`, 
                    popularity: track.popularity,
                    albumName: track.album_name,
                    releaseDate: track.release_date,
                }));
                setArtistTopTracks(formattedTracks);
            }

            // Fetch artist top singles
            if (data?.artist_top_singles && Array.isArray(data.artist_top_singles) && data.artist_top_singles.length > 0) {
                const formattedTracks = data.artist_top_singles.map((track: any) => ({
                    name: track.name,
                    image: track.image || "",  // Ensure safety
                    spotifyUrl: track.spotify_url,
                    releaseDate: track.release_date,
                }));
            
                setArtistTopSingles(formattedTracks);
            }

            if (songId){
                // fetch similar songs
                const similarResp = await fetchSimilarSongs(songId);
                setSimilarTrack(similarResp.tracks)
            }
            
            setLoading(false);
        };
    
        fetchTrackDetails();
    }, [searchParams]); // Important: Add searchParams as a dependency

    // Function to generate avatar
    const generateAvatar = (albumName: any) => {
        const words = albumName.split(" ");
        let firstLetter = words[0]?.charAt(0).toUpperCase() || "";
        let lastLetter = words.length > 1 ? words[1]?.charAt(0).toUpperCase() : words[0]?.charAt(1)?.toUpperCase() || "";

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

    function formatDate(dateString: any) {
        if (!dateString) return ""; // Handle null or undefined date strings
      
        const date = new Date(dateString);
        const month = date.toLocaleString('default', { month: 'short' }); // Get short month name
        const year = date.getFullYear();
      
        return `${month} ${year}`;
    }

    const handleLike = async () => {
        let newStatus = "like"; // Default to liked
    
        if (songStatus === "like") {
            newStatus = "none"; // Toggle off if already liked
        }
    
        setSongStatus(newStatus); // Update UI instantly
        if (selectedUser != "newuser" && songId != ""){
            updateTrackStatus(songId, newStatus)
        }
        // await updateTrackStatus(songId, newStatus); // Update backend
    };
    
    const handleDislike = async () => {
        let newStatus = "dislike"; // Default to disliked
    
        if (songStatus === "dislike") {
            newStatus = "none"; // Toggle off if already disliked
        }
    
        setSongStatus(newStatus); // Update UI instantly
        if (selectedUser != "newuser" && songId != ""){
            updateTrackStatus(songId, newStatus)
        }
    };

    return (
        
       <div>
            {loading && (
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

       
            <div style={{ display: loading ? "none" : "block" }}> 
                
                {/* Top Page song details/album cover */}
                {(trackDetails || albumDetails) && (
                    <section className="album-header">
                        <figure className="album-cover-wrap" style={{background: "#78e2dc"}}>
                            <div className="album-cover_overlay"></div>
                            <img className="album-cover"  alt="" />
                        </figure>
                        <div className="container">
                            <div className="cover-content">
                                <a href="/" className="btn btn-default text-bold btn-lg text-uppercase backStore">
                                    <i className="icon-angle-circled-left"></i> Back to Home
                                </a>
                                <hr/>
                                <div className="clearfix text-uppercase album_overview">
                                    <figure className="album-thumb">
                                        <img src={trackDetails?.image || albumDetails?.image || generateAvatar(albumDetails?.name)}  alt="" />
                                    </figure>
                                    <h1>{trackDetails?.name || albumDetails?.name || "Loading..."}</h1>
                                    
                                        <a className="btn btn-default text-uppercase text-bold pull-right" href={trackDetails?.spotifyUrl || albumDetails?.spotifyUrl || "#"} target="_blank">
                                            <i className="fa fa-play"></i>  Listen Song
                                        </a>
                                        
                                    <cite className="album-author mb-20" style={{color: "gold", paddingTop: "20px"}}>{trackDetails?.artists || albumDetails?.artists || "Unknown Artist"}</cite>
                                    {/* Like & Dislike Buttons */}
                                    
                                    { selectedUser != "newuser" && songId != "" && 
                                        <div className="like-dislike-buttons pull-right" style={{ marginTop: "10px" }}>
                                        {/* Like (Heart) */}
                                        <i
                                            className={`fa ${songStatus === "like" ? "fa-heart" : "fa-heart-o"}`}
                                            style={{
                                                fontSize: "38px",
                                                color: songStatus === "like" ? "red" : "white",
                                                cursor: "pointer",
                                                transition: "0.3s",
                                            }}
                                            onClick={handleLike}
                                        ></i>

                                        {/* Dislike (Thumbs Down) */}
                                        <i
                                            className={`fa ${songStatus === "dislike" ? "fa-thumbs-down" : "fa-thumbs-o-down"}`}
                                            style={{
                                                fontSize: "38px",
                                                color: songStatus === "dislike" ? "royalblue" : "white",
                                                cursor: "pointer",
                                                marginLeft: "25px",
                                                marginRight: "20px",
                                                transition: "0.3s",
                                            }}
                                            onClick={handleDislike}
                                        ></i>
                                        </div>
                                    }
                                    <ul className="countdown clearfix mt-20">
                                        <li>
                                            <div className="text">
                                                <span className="days">{trackDetails?.durationMs || albumDetails?.durationMs}</span>
                                                <p className="days_ref">Duration</p>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="text">
                                                <span className="days">{trackDetails?.popularity || albumDetails?.popularity}</span>
                                                <p className="days_ref">popularity</p>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="text">
                                                <span className="days">{trackDetails?.totalTracks || albumDetails?.totalTracks}</span>
                                                <p className="days_ref">Total</p>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="text">
                                                <span className="days">{formatDate(trackDetails?.releaseDate || albumDetails?.releaseDate)}</span>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="text">
                                                <span className="days">{trackDetails?.type || albumDetails?.type}</span>
                                                <p className="days_ref">Type</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* track details of the album */}
                {albumTrackDetails && albumTrackDetails.length>0 && (
                    <div className="mt-50 mb-50">
                        <div className="container">
                            <ul className="song-list text-uppercase text-bold clearfix">
                                {albumTrackDetails.map((track, index) => (
                                    <li key={index} className="song-unit singleSongPlayer clearfix" data-before={index + 1}>
                                        <div id={`singleSong-jplayer-${index}`} className="singleSong-jplayer"
                                            data-title={track.name}
                                            data-mp3={track.spotifyUrl}
                                        >
                                        </div>

                                        <figure>
                                            <img src={track.image} alt={track.name} width="265" height="265"/>
                                        </figure>

                                        <span className="song-title jp-title" data-before="title" style={{ maxWidth: "40ch" }}>{track.name}</span>
                                        <span className="song-author" data-before="Artist">{track.artists}</span>
                                        <span className="song-time jp-duration" data-before="Duration">
                                            {track.durationMs}
                                        </span>
                                        <a className="song-btn" target='_blank' href={track.spotifyUrl}>Listen</a>

                                        <div className="audio-progress">
                                            <div className="jp-seek-bar">
                                                <div className="jp-play-bar" style={{width: "20%"}}></div>
                                            </div>
                                        </div> 
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Show Artist Details */}
                {artistDetails && (
                    <section className="events-countdown parallax parallax_overlay text-bold" data-stellar-background-ratio="0.5">
                        <div className="parallax_inner">
                            <div className="albumAction">
                                <div className="container">
                                    <a className="btn btn-default text-uppercase text-bold" href={artistDetails.spotifyUrl} target="_blank">
                                        <i className="fa fa-caret-square-o-right"></i> View Artist
                                    </a>
                                </div>
                            </div>
                            <div className="event">
                                <div className="container">
                                    <div className="row">
                                        {/* Artist Image */}
                                        <div className="col-xs-12 col-sm-6 col-md-4">
                                            <figure>
                                                <img src={artistDetails.image} alt={artistDetails.name} style={{width: "250px", height:"250px"}} />
                                            </figure>
                                        </div>
                                        {/* Artist Details */}
                                        <div className="col-xs-12 col-sm-6 col-md-8 about-album" style={{ paddingLeft: "30px" }}>
                                            <div className="event-details">
                                                <h2>{artistDetails.name}</h2>
                                                <h6>{artistDetails.genres.length > 0 ? artistDetails.genres.join(", ") : "No genres available"}</h6>
                                                <p style={{ color: "gold", paddingTop: "20px" }}>
                                                    <strong>Don't miss out on listening to {artistDetails.name}!</strong><br />
                                                    Discover their singles and popular tracks. Listen now and be part of the experience!
                                                </p>
                                                <ul className="countdown clearfix mt-20">
                                                    <li>
                                                        <div className="text">
                                                            <span className="days">{artistDetails.followers.toLocaleString()}</span>
                                                            <p className="days_ref">followers</p>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="text">
                                                            <span className="hours">{artistDetails.popularity}</span>
                                                            <p className="hours_ref">Popularity</p>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="text">
                                                            <span className="minutes">{artistDetails.type}</span>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* 5 singles of artist */}
                {artistTopSingles && artistTopSingles.length > 0 && (
                    <section className="mt-10 mb-10">
                        <header>
                        <div className="container">
                            <div className="row">
                            <div className="col-xs-12">
                                <h2 className="text-uppercase">More Single Albums from {artistDetails?.name}</h2>
                            </div>
                            </div>
                        </div>
                        </header>

                        <div className="container">
                        <div className="row">
                            <div className="col-xs-12">
                            <div className="store-grid text-uppercase text-bold">
                                {artistTopSingles.map((single, index) => (
                                <div className="store-product" key={index}>
                                    <figure>
                                    <img src={single.image} width="265" height="265" alt={single.name} />
                                    <figcaption>
                                        <a className="btn btn-grey" href={single.spotifyUrl} target="_blank" rel="noopener noreferrer">
                                        <i className="fa fa-play"></i> Listen
                                        </a>
                                    </figcaption>
                                    </figure>
                                    <div className="product-info">
                                    <h3>{single.name}</h3>
                                    <h6>Release Date: {single.releaseDate}</h6>
                                    <span className="price-tag">Stream Now</span>
                                    </div>
                                </div>
                                ))}
                            </div>
                            </div>
                        </div>
                        </div>
                    </section>
                )}

                {/* Top 5 Tracks of artist */}
                {artistTopTracks && artistTopTracks.length > 0 && (
                    <section className="mt-10 mb-50">
                        <header className="parallax parallax_two style3 text-center text-uppercase text-bold" 
                        style={{ backgroundColor: "currentcolor" }} 
                        data-stellar-background-ratio="0.5">
                        <div className="container">
                            <div className="row">
                            <div className="col-xs-12">
                                <h2>Top Songs of {artistDetails?.name}</h2>
                            </div>
                            </div>
                        </div>
                        </header>

                        <div className="container">
                        <div className="row">
                            <div className="col-xs-12">
                            {artistTopTracks.map((track, index) => (
                                <div className="event-unit-slide" key={index}>
                                <div className="event-unit text-uppercase text-bold">
                                    
                                    {/* Track Release Date (Dummy Date for UI) */}
                                    <div className="time-date">
                                    <span>{new Date().toLocaleString("default", { month: "short" })} {Math.floor(Math.random() * 30) + 1}</span>
                                    </div>

                                    {/* Track Info */}
                                    <div className="event-info">
                                    <figure>
                                        <img src={track.image} alt={track.name} width="265" height="265" />
                                    </figure>
                                    <span>
                                        <a className="eventTitle" href={track.spotifyUrl} target="_blank" rel="noopener noreferrer">
                                        {track.name}
                                        </a>
                                    </span>
                                    </div>

                                    {/* Popularity & Name */}
                                    <div className="event-venue">
                                    <i className="fa fa-music"></i>
                                    <div className="location">
                                        {track.albumName}
                                        <small>Popularity: {track.popularity}</small>
                                    </div>
                                    </div>

                                    {/* Listen Button */}
                                    <a href={track.spotifyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-yellow">
                                    Listen
                                    </a>
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                        </div>
                    </section>
                )}
    
                {/* Top 5 similar songs */}
                {similarTracks  && similarTracks.length > 0 && (
                    <><hr style={{ height: '2px', borderWidth: '0', backgroundColor: 'green' }} /><section>
                        <header>
                            <div className="container">
                                <div className="row">
                                    <div className="col-xs-12">
                                        <h2 className="text-uppercase">Similar Songs</h2>
                                    </div>
                                </div>
                            </div>
                        </header>

                        <div className="container">
                            <ul className="song-list text-uppercase text-bold clearfix">
                                {similarTracks.map((song, index) => (
                                    <li 
                                        key={index} 
                                        id={`singleSongPlayer-${index}`} 
                                        className="song-unit singleSongPlayer clearfix" 
                                        data-before={index + 1}
                                    >
                                        <div id={`singleSong-jplayer-${index}`} className="singleSong-jplayer" data-title={song.name} data-mp3={song.url}>
                                        </div>

                                        <figure>
                                            <img src={song.image} alt={song.name} width="265" height="265" />
                                        </figure>

                                        <span className="playit controls jp-controls-holder">
                                            <a href={song.url} target="_blank" rel="noopener noreferrer">
                                                <i className="jp-play pc-play"></i>
                                            </a>
                                        </span>

                                        <span className="song-title jp-title" data-before="Title" style={{ maxWidth: "40ch" }}>{song.name}</span>
                                        <span className="song-author" data-before="Artist">{song.artist}</span>
                                        <span className="song-time jp-duration" data-before="Duration">{song.duration}</span>
                                        
                                        <a className="song-btn" target='_blank' href={song.url}>Listen</a>

                                        <div className="audio-progress">
                                            <div className="jp-seek-bar">
                                                <div className="jp-play-bar" style={{ width: "20%" }}></div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section></> 
                )}
            </div>
    
        </div>
    );
}