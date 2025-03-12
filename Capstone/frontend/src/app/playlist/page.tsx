"use client";

import { useEffect, useState, CSSProperties } from "react";
import { fetchPlaylistFilters, fetchCurrentUser, fetchUserPlaylists, fetchRecentlyPlayedSongs, fetchPlaylistRecommendations, savePlaylistRecommendations, deletePlaylist, updatePlaylist, getPlaylistSongs } from "../api/api";
import { MultiSelect } from "react-multi-select-component";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MoonLoader from "react-spinners/MoonLoader";

interface Option {
    label: string;
    value: string;
}

interface Playlist {
    albumName: string;
    totalTracks: number;
    playlistId: string;
}

export interface UserSong {
    track_id: string;
    name: string;
    album: string;
    artist: string;
    image: string;
    url: string;
    duration: string;
}

export default function Playlist() {

    const [selectedUser, setSelectedUser] = useState<string>("");
    const [genreOptions, setGenreOptions] = useState<Option[]>([]);
    const [genreSelected, setGenreSelected] = useState<Option[]>([]);
    const [artistOptions, setArtistOptions] = useState<Option[]>([]);
    const [artistSelected, setArtistSelected] = useState<Option[]>([]);
    const [localeOptions, setLocaleOptions] = useState<Option[]>([]);
    const [localeSelected, setLocaleSelected] = useState<Option[]>([]);
    const [moodOptions, setMoodOptions] = useState<Option[]>([]);
    const [moodSelected, setMoodSelected] = useState<Option[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [userSongs, setUserSongs] = useState<UserSong[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [playlistLoading, setPlaylistLoading] = useState<boolean>(false);
    const [playlistLoadingButtonClicked, setPlaylistButtonClicked] = useState<boolean>(false);
    const [generatedPlaylist, setGeneratedPlaylist] = useState<UserSong[]>([]);
    const [playListName, setPlayListName] = useState("");
    const [disableInput, setDisableInput] = useState<boolean>(false);
    const [editPlaylist, setEditPlaylist] = useState<boolean>(false);
    const [editGeneratedPlaylist, setEditGeneratedPlaylist] = useState<UserSong[]>([]);
    const [editPlayListID, setEditPlaylistID] = useState<string>("");

    const loadOptions = async () => {
        setLoading(true);
        try {
            const resp = await fetchPlaylistFilters();
            if (resp) {
                setGenreOptions(resp.genres.map((value: string) => ({ label: value, value })));
                setArtistOptions(resp.artists.map((value: string) => ({ label: value, value })));
                setLocaleOptions(resp.locales.map((value: string) => ({ label: value, value })));
                setMoodOptions(resp.moods.map((value: string) => ({ label: value, value })));
            } else {
                console.error("Failed to load filters");
            }
        } catch (error) {
            console.error("Error fetching filter options:", error);
        }

        // Fetch current user
        const currentUser = await fetchCurrentUser();
        if (currentUser?.status && currentUser.user) {
            setSelectedUser(currentUser.user.userName)
        }

        //Fetch User playlists
        try {
            const response = await fetchUserPlaylists();
            if (response && Array.isArray(response.playlists)) {
                setPlaylists(response.playlists); // Ensure it's an array
            } else {
                console.error("Invalid playlist data:", response);
                setPlaylists([]); // Prevent .map() error
            }
        } catch (error) {
            console.error("Error fetching user playlists:", error);
            setPlaylists([]); // Prevent errors if request fails
        }

        // fetch user last played songs:
        try {
            const songs = await fetchRecentlyPlayedSongs();
            if (songs && Array.isArray(songs.tracks)) {
                setUserSongs(songs.tracks); // Ensure it's an array
            } else {
                console.error("Invalid User Last Played songs data:", songs);
                setUserSongs([]); // Prevent .map() error
            }
        } catch (error) {
            console.error("Error fetching user last played songs:", error);
            setUserSongs([]); // Prevent errors if request fails
        }

        setLoading(false);
    };

    useEffect(() => {
        loadOptions();
    }, []);

    const showToastError = (msg: string) => {
        toast.error(msg, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          });
    };

    // Function to generate avatar
    const generateAvatar = (albumName: string) => {
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

    const generatePlaylist = async () => {
        setPlaylistButtonClicked(true);
        setPlayListName("");
        setEditPlaylistID("");
        setEditPlaylist(false);
        setEditGeneratedPlaylist([]);
        setDisableInput(false);
        if (
            genreSelected.length === 0 &&
            artistSelected.length === 0 &&
            moodSelected.length === 0 &&
            localeSelected.length === 0
        ) {
            showToastError("Please select at least one Artist, Genre, Mood, or Locale.");
            return;
        }
    
        if (genreSelected.length > 5) {
            showToastError("Please select a maximum of 5 Genres.");
            return;
        }
        if (artistSelected.length > 5) {
            showToastError("Please select a maximum of 5 Artists.");
            return;
        }
        if (moodSelected.length > 5) {
            showToastError("Please select a maximum of 5 Moods.");
            return;
        }
        if (localeSelected.length > 5) {
            showToastError("Please select a maximum of 5 Locales.");
            return;
        }
        
        setPlaylistLoading(true);
        setPlaylistButtonClicked(true)

        try {
            const response = await fetchPlaylistRecommendations(
                artistSelected.map((artist) => artist.value), 
                genreSelected.map((genre) => genre.value), 
                moodSelected.map((mood) => mood.value), 
                localeSelected.map((locale) => locale.value),
                20
            );   
            setGeneratedPlaylist(response.tracks)
        } catch (error) {
            console.error("Error generating playlist:", error);
            showToastError("Failed to generate playlist. Please try again.");
        }
        finally {
            setPlaylistLoading(false);
        }
    };

    const savePlaylist = async () => {
        setDisableInput(true);
        if (playListName == ""){
            showToastError("Please provide a Playlist Name");
            setDisableInput(false);
            return;
        }
        if (generatedPlaylist.length == 0){
            showToastError("The playlist is empty");
            setDisableInput(false);
            return;
        }

        // saving playlist
        const response = await savePlaylistRecommendations(generatedPlaylist, playListName);
        if (response.status == false){
            showToastError(response.message)
            setDisableInput(false);
            return;
        }
        else{
            toast.success(response.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            setDisableInput(true);

            //Fetch User playlists
            try {
                const response = await fetchUserPlaylists();
                if (response && Array.isArray(response.playlists)) {
                    setPlaylists(response.playlists); // Ensure it's an array
                } else {
                    console.error("Invalid playlist data:", response);
                    setPlaylists([]); // Prevent .map() error
                }
            } catch (error) {
                console.error("Error fetching user playlists:", error);
                setPlaylists([]); // Prevent errors if request fails
            }
        }

    }

    const removeSong = (trackId: any) => {
        setGeneratedPlaylist(prevPlaylist => 
            prevPlaylist.filter(song => song.track_id !== trackId)
        );
    };

    const removeSongEdit = (trackId: any) => {
        setEditGeneratedPlaylist(prevPlaylist => 
            prevPlaylist.filter(song => song.track_id !== trackId)
        );
    };

    async function handleDelete(playlistId: string) {
        const response = await deletePlaylist(playlistId);
        if (response.status == false){
            showToastError(response.message)
            return;
        }
        else{
            toast.success(response.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            
            //Fetch User playlists again
            try {
                const response = await fetchUserPlaylists();
                if (response && Array.isArray(response.playlists)) {
                    setPlaylists(response.playlists); // Ensure it's an array
                } else {
                    console.error("Invalid playlist data:", response);
                    setPlaylists([]); // Prevent .map() error
                }
            } catch (error) {
                console.error("Error fetching user playlists:", error);
                setPlaylists([]); // Prevent errors if request fails
            }
        }
    }
    
    async function handleEdit(playlistId: string){
        setEditPlaylistID("")
        setPlaylistButtonClicked(false);
        setEditPlaylist(true);
        setDisableInput(false);

        const response = await getPlaylistSongs(playlistId)
        if (response.status == true){
            toast.success(`Playlist ${response.playlistName} fetched successfully`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            setPlayListName(response.playlistName);
            setEditGeneratedPlaylist(response.tracks);
            setEditPlaylistID(playlistId);
        }else{
            showToastError(response.message)
            return;
        }
    }

    const editPlaylistFunc = async (playlistId: string) => {
        setDisableInput(true);
        if (playListName == ""){
            showToastError("Please provide a Playlist Name");
            setDisableInput(false);
            return;
        }
        if (editGeneratedPlaylist.length == 0){
            showToastError("The playlist is empty");
            setDisableInput(false);
            return;
        }

        // saving playlist
        const response = await updatePlaylist(playlistId, playListName, editGeneratedPlaylist);
        if (response.status == false){
            showToastError(response.message)
            setDisableInput(false);
            return;
        }
        else{
            toast.success(response.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
            setDisableInput(true);

            //Fetch User playlists
            try {
                const response = await fetchUserPlaylists();
                if (response && Array.isArray(response.playlists)) {
                    setPlaylists(response.playlists); // Ensure it's an array
                } else {
                    console.error("Invalid playlist data:", response);
                    setPlaylists([]); // Prevent .map() error
                }
            } catch (error) {
                console.error("Error fetching user playlists:", error);
                setPlaylists([]); // Prevent errors if request fails
            }
        }

    }
    
    const override: CSSProperties = {
        display: "block",
        margin: "0 auto"
    };

    return (
        <div>
            <ToastContainer />
            {(loading) && (
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
            <section style={{ display: loading ? "none" : "block", background:"cadetblue", overflow: "visible"}}     className="events-countdown parallax parallax_overlay text-bold" data-stellar-background-ratio="0.5">
                <div className="parallax_inner">
                    <div className="container hidden-xs">
                        <div className="row">
                            <div className="col-xs-12">
                            <h2 className="text-uppercase">Generate Playlist</h2>
                                <div className="multiSearchWrapper" style={{ maxWidth: "100%" }}>
                                    <div className="flex" style={{ fontSize: "large", paddingTop: "30px"}}>
                                        {/* Genre MultiSelect */}
                                        <div style={{ width: "23%", color:"grey" }}>
                                            <span style={{color: "white"}}>Select Genre</span>
                                            <MultiSelect
                                                options={genreOptions}
                                                value={genreSelected}
                                                onChange={setGenreSelected}
                                                labelledBy="Select Genre"
                                                isLoading={loading}
                                            />
                                        </div>

                                        {/* Artist MultiSelect */}
                                        <div style={{ width: "23%", color:"grey" }}>
                                            <span style={{color: "white"}}>Select Artist</span>
                                            <MultiSelect
                                                options={artistOptions}
                                                value={artistSelected}
                                                onChange={setArtistSelected}
                                                labelledBy="Select Artist"
                                                isLoading={loading}
                                            />
                                        </div>

                                        {/* Locale MultiSelect */}
                                        <div style={{ width: "23%", color:"grey" }}>
                                            <span style={{color: "white"}}>Select Locale</span>
                                            <MultiSelect
                                                options={localeOptions}
                                                value={localeSelected}
                                                onChange={setLocaleSelected}
                                                labelledBy="Select Locale"
                                                isLoading={loading}
                                            />
                                        </div>

                                        {/* Mood MultiSelect */}
                                        <div style={{ width: "23%", color:"grey" }}>
                                            <span style={{color: "white"}}>Select Mood</span>
                                            <MultiSelect
                                                options={moodOptions}
                                                value={moodSelected}
                                                onChange={setMoodSelected}
                                                labelledBy="Select Mood"
                                                isLoading={loading}
                                            />
                                        </div>
                                        
                                    </div>
                                    <button className="btn btn-default flex" style={{width: "7%", marginTop: "98px", marginLeft: "5px"}} onClick={() => generatePlaylist()}><i className="fa fa-search"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                    <div className="container">
                        <div className="search-filters text-uppercase text-bold">
                            <div className="row">
                                <div className="col-xs-12 col-sm-6 col-md-5">
                                    <div className="searched-for" data-before="Showing Results For : " style={{fontSize: "large"}}>
                                            <span className="s-keyword" style={{color: "gold"}}>{selectedUser}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </section>

            {/* generate playlist */}
            <section style={{display: !playlistLoadingButtonClicked ? "none": "block"}}>
                <div style={{ paddingTop: "20px" }}>
                    <header>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12" style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                                    <h2 className="text-uppercase" style={{ margin: 0 }}>
                                        {playlistLoading ? "Generating Playlist..." : "Generated Playlists"}
                                    </h2>
                                
                                    {/* ✅ Keep input and button together in a flexbox container */}
                                    {playlistLoadingButtonClicked && !playlistLoading && generatedPlaylist.length > 0 && selectedUser!="New User" && (
                                        <div 
                                            className="multiSearchWrapper" 
                                            style={{ display: "flex", gap: "10px", alignItems: "center" }}
                                        >
                                            <input 
                                                type="text" 
                                                placeholder="Save Playlist" 
                                                value={playListName} 
                                                style={{ marginRight: "60px", width: "300px"}}
                                                disabled={disableInput}
                                                onChange={(e) => setPlayListName(e.target.value)} 
                                            />
                                           <button 
                                                className="btn btn-default" 
                                                style={disableInput ? { pointerEvents: "none", opacity: 0.5 } : {}} 
                                                onClick={() => savePlaylist()}
                                            >
                                                {disableInput ? (
                                                    <i className="fa fa-spinner fa-spin"></i> // Show spinner when disableInput is true
                                                ) : (
                                                    <i className="fa fa-star fa-lg"></i> // Show star icon otherwise
                                                )}
                                            </button>

                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </header>
                </div>

                {/* ✅ Show Spinner while loading */}
                {playlistLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                            <MoonLoader
                                color={"navy"}
                                loading={true}
                                size={60}
                                aria-label="Loading Spinner"
                                cssOverride={override}
                            />
                    </div>
                ) : generatedPlaylist.length > 0 ? (
                    // ✅ Show track list if tracks are found
                    <div className="container">
                        <ul className="song-list text-uppercase text-bold clearfix">
                            {generatedPlaylist.map((song, index) => (
                                <li 
                                    key={index} 
                                    id={`singleSongPlayer-${index}`} 
                                    className="song-unit singleSongPlayer clearfix" 
                                    data-before={index + 1}
                                >
                                    <div 
                                        id={`singleSong-jplayer-${index}`} 
                                        className="singleSong-jplayer" 
                                        data-title={song.name} 
                                        data-mp3={song.url}
                                    ></div>
                
                                    <figure>
                                        <img src={song.image} alt={song.name} width="265" height="265" />
                                    </figure>
                
                                    <span className="playit controls jp-controls-holder">
                                        <a href={`/album?source=local&songId=${song.track_id}`}  rel="noopener noreferrer">
                                            <i className="jp-play pc-play"></i>
                                        </a>
                                    </span>
                
                                    <span className="song-title jp-title" data-before="title" style={{ maxWidth: "40ch" }}>
                                        {index + 1}. {song.name}
                                    </span>
                
                                    <span className="song-author" data-before="Artist">{song.artist}</span>
                                    <span className="song-time jp-duration" data-before="Duration">{song.duration}</span>
                
                                    {/* ✅ Replace Album Name Link with a Remove Link */}
                                    <a 
                                        className="song-btn" 
                                        href="#" 
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent default link action
                                            removeSong(song.track_id);
                                        }}
                                    >
                                        Remove Song
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
                 : generatedPlaylist.length === 0 && !playlistLoading ? (
                    // ✅ Show fallback message only if loading is complete and no playlist is found
                    <div style={{ display: "grid", placeItems: "center", paddingTop: "30px" }}>
                        <h3>Not able to generate any playlist, Please change the selection</h3>
                    </div>
                ) : null}
            </section>

            {/* Edit Playlist */}
            <section style={{display: !editPlaylist ? "none": "block"}}>
                <div style={{ paddingTop: "20px" }}>
                    <header>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12" style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                                    <h2 className="text-uppercase" style={{ margin: 0 }}>
                                        Edit {playListName} Playlist
                                    </h2>
                                
                                    {/* ✅ Keep input and button together in a flexbox container */}
                                    {editGeneratedPlaylist.length > 0 && selectedUser!="newuser" && (
                                        <div 
                                            className="multiSearchWrapper" 
                                            style={{ display: "flex", gap: "10px", alignItems: "center" }}
                                        >
                                            <input 
                                                type="text" 
                                                placeholder="Save Playlist" 
                                                value={playListName} 
                                                style={{ marginRight: "60px", width: "300px"}}
                                                disabled={disableInput}
                                                onChange={(e) => setPlayListName(e.target.value)} 
                                            />
                                           <button 
                                                className="btn btn-default" 
                                                style={disableInput ? { pointerEvents: "none", opacity: 0.5 } : {}} 
                                                onClick={() => editPlaylistFunc(editPlayListID)}
                                            >
                                                {disableInput ? (
                                                    <i className="fa fa-spinner fa-spin"></i> // Show spinner when disableInput is true
                                                ) : (
                                                    <i className="fa fa-star fa-lg"></i> // Show star icon otherwise
                                                )}
                                            </button>

                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </header>
                </div>

                {/* ✅ Show Spinner while loading */}
                {editGeneratedPlaylist.length == 0 ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                            <MoonLoader
                                color={"navy"}
                                loading={true}
                                size={60}
                                aria-label="Loading Spinner"
                                cssOverride={override}
                            />
                    </div>
                ) : editGeneratedPlaylist.length > 0 ? (
                    // ✅ Show track list if tracks are found
                    <div className="container">
                        <ul className="song-list text-uppercase text-bold clearfix">
                            {editGeneratedPlaylist.map((song, index) => (
                                <li 
                                    key={index} 
                                    id={`singleSongPlayer-${index}`} 
                                    className="song-unit singleSongPlayer clearfix" 
                                    data-before={index + 1}
                                >
                                    <div 
                                        id={`singleSong-jplayer-${index}`} 
                                        className="singleSong-jplayer" 
                                        data-title={song.name} 
                                        data-mp3={song.url}
                                    ></div>
                
                                    <figure>
                                        <img src={song.image} alt={song.name} width="265" height="265" />
                                    </figure>
                
                                    <span className="playit controls jp-controls-holder">
                                        <a href={`/album?source=local&songId=${song.track_id}`} rel="noopener noreferrer">
                                            <i className="jp-play pc-play"></i>
                                        </a>
                                    </span>
                
                                    <span className="song-title jp-title" data-before="title" style={{ maxWidth: "40ch" }}>
                                        {index + 1}. {song.name}
                                    </span>
                
                                    <span className="song-author" data-before="Artist">{song.artist}</span>
                                    <span className="song-time jp-duration" data-before="Duration">{song.duration}</span>
                
                                    {/* ✅ Replace Album Name Link with a Remove Link */}
                                    <a 
                                        className="song-btn" 
                                        href="#" 
                                        onClick={(e) => {
                                            e.preventDefault(); // Prevent default link action
                                            removeSongEdit(song.track_id);
                                        }}
                                    >
                                        Remove Song
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ): null}
            </section>

            <section style={{ display: loading ? "none" : "block", paddingBottom: "30px", paddingTop: "30px"}}>
                <div className="container">
                    <div className="row">
                        <div className="col-xs-12">
                            <h2 className="text-uppercase">Saved Playlists.</h2>
                            <div className="album-grid-wrap style2">
                                <div className="album-grid text-uppercase clearfix">
                                    {playlists.length === 0 ? (
                                        <p>No playlists found</p>
                                    ) : (
                                        
                                    <div className="playlist-grid">
                                        {playlists.map((playlist) => (
                                            <div key={playlist.playlistId} className="album-unit">
                                                <a href={`/album?source=local&albumId=${playlist.playlistId}`}>
                                                    <figure>
                                                        <img 
                                                            src={generateAvatar(playlist.albumName)} 
                                                            width="265" 
                                                            height="265" 
                                                            alt={playlist.albumName} 
                                                        />
                                                        <figcaption>
                                                            <span>{playlist.albumName}</span>
                                                            <h3>{playlist.totalTracks} Tracks</h3>
                                                        </figcaption>
                                                    </figure>
                                                </a>

                                                {/* ✅ Delete Button Below the Tile */}
                                                <div className="button-container">
                                                    <button 
                                                        className="btn btn-danger action-btn"
                                                        onClick={(e) => {
                                                            e.preventDefault(); // Prevent navigation when clicking delete
                                                            handleDelete(playlist.playlistId);
                                                        }}
                                                    >
                                                        <i className="fa fa-trash"></i> Delete
                                                    </button>

                                                    <button 
                                                        className="btn btn-info action-btn"
                                                        onClick={(e) => {
                                                            e.preventDefault(); // Prevent navigation when clicking edit
                                                            handleEdit(playlist.playlistId);
                                                        }}
                                                    >
                                                        <i className="fa fa-edit"></i> Edit
                                                    </button>
                                                </div>

                                            </div>
                                        ))}
                                    </div>

                                        
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style={{paddingTop: "20px"}}>
                    <header>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12">
                                    <h2 className="text-uppercase">User Recently Played Tracks</h2>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    {userSongs.length > 0 ? (
                            // Show track list if tracks are found
                        <div className="container">
                            <ul className="song-list text-uppercase text-bold clearfix">
                                {userSongs.map((song, index) => (
                                    <li 
                                        key={index} 
                                        id={`singleSongPlayer-${index}`} 
                                        className="song-unit singleSongPlayer clearfix" 
                                        data-before={index + 1} // Ensure this is a visible number
                                    >
                                        <div 
                                            id={`singleSong-jplayer-${index}`} 
                                            className="singleSong-jplayer" 
                                            data-title={song.name} 
                                            data-mp3={song.url}
                                        ></div>

                                        <figure>
                                            <img src={song.image} alt={song.name} width="265" height="265" />
                                        </figure>

                                        <span className="playit controls jp-controls-holder">
                                            <a href={`/album?source=local&songId=${song.track_id}`} rel="noopener noreferrer">
                                                <i className="jp-play pc-play"></i>
                                            </a>
                                        </span>

                                        {/* ✅ Display the number explicitly before the song title */}
                                        <span className="song-title jp-title" data-before="title" style={{maxWidth: "40ch"}}>
                                            {index + 1}. {song.name}
                                        </span>

                                        <span className="song-author" data-before="Artist">{song.artist}</span>
                                        <span className="song-time jp-duration" data-before="Duration">{song.duration}</span>
                                        <a className="song-btn" href={`/album?source=local&songId=${song.url.split("track/")[1]}`}>
                                            {song.album}
                                        </a>

                                    
                                    </li>
                                ))}
                            </ul>

                        </div>
                    ) : (
                        // Show no result message if no tracks found
                        <div style={{display: "grid", placeItems: "center", paddingTop: "30px"}}>
                            <h3>No Recently Played Tracks Found, Please change the user in profile!</h3>
                        </div>
                    )}

                </div>

            </section>
        </div>
    );
}