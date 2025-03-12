"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchGlobalSearchResults, fetchPlaylistHeaderRecommendations } from "@/app/api/api";

const NAV_ITEMS = [
  { name: "Home", path: "/" },
  { name: "Playlist", path: "/playlist" },
  { name: "Chat", path: "/chat" },
  { name: "Events", path: "/events" },
  { name: "Featured", path: "/featured" },
  { name: "Profile", path: "/profile" },
];

export interface UserSong {
  track_id: string;
  name: string;
  album: string;
  artist: string;
  image: string;
  url: string;
  duration: string;
}

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("global");
  const [searchResults, setSearchResults] = useState<{ name: string; type: string; url: string }[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  

  const [generatedPlaylist, setGeneratedPlaylist] = useState<UserSong[]>([]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function getSearchResult() {
      if (searchQuery.trim().length > 1) {
        const results = await fetchGlobalSearchResults(searchQuery, searchType);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }
    getSearchResult();
  }, [searchQuery, searchType]);

  // Handle clicking a search result (clear dropdown + query)
  const handleResultClick = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  // Function to generate href dynamically
  const generateHref = (type: string, url: string) => {
    const id = url.split("/").pop(); // Extract ID from URL
    if (!id) return "#";

    switch (type) {
      case "album":
        return `/album?source=spotify&albumId=${id}`;
      case "artist":
        return `/album?source=spotify&artistId=${id}`;
      case "track":
        return `/album?source=spotify&songId=${id}`;
      default:
        return "#";
    }
  };

  // Click outside to close search results
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
        setIsInputFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const response = await fetchPlaylistHeaderRecommendations();   
  //     setGeneratedPlaylist(response.tracks);
  //   }
  //   fetchData();
  // }, []);
  
  return (
    <header id="sticktop" className="doc-header">
      {/* <section id="audio-player" className="the-xv-Jplayer">
            <div id="player-instance" className="jp-jplayer"></div>
            <div className="controls jp-controls-holder">
                <button className="playList-trigger pc-playlist2"></button>
                <div className="jp-prev pc-back"></div>
                <div className="play-pause jp-play pc-play"></div>
                <div className="play-pause jp-pause fa pc-pause" style={{display: "none"}}></div>
                <div className="jp-next pc-next"></div>
            </div>
            <div className="jp-volume-controls">
                <button className="sound-trigger pc-volume"></button>
                <div className="jp-volume-bar" style={{display: "none"}}>
                    <div className="jp-volume-bar-value" style={{width: "1.4737%"}}></div>
                </div>
            </div>
            <h5 className="audio-title">&ensp;</h5>
            <div className="player-status">
                <div className="audio-progress">
                    <div className="jp-seek-bar">
                        <div className="audio-play-bar jp-play-bar" style={{width:"20%"}}></div>
                    </div>
                </div>
            </div>
            
            <ul className="hidden playlist-files">
            
                <li data-title="The Box"
                  data-artist="Roddy Ricch"
                  data-mp3="https://open.spotify.com/track/0nbXyq5TXYPCO7pr3N8S4I">
                </li>
                <li data-title="Blinding Lights"
                  data-artist="The Weeknd"
                  data-mp3="https://open.spotify.com/track/0sf12qNH5qcw8qpgymFOqD">
                </li>
                <li data-title="Circles"
                  data-artist="Post Malone"
                  data-mp3="https://open.spotify.com/track/21jGcNKet2qwijlDFuPiPb">
                </li>
                <li data-title="Memories"
                  data-artist="Maroon 5"
                  data-mp3="https://open.spotify.com/track/2b8fOow8UzyDFAE27YhOZM">
                </li>
                <li data-title="Flowers"
                  data-artist="Miley Cyrus"
                  data-mp3="https://open.spotify.com/track/0yLdNVWF3Srea0uzk55zFn">
                </li>
                 
            </ul>
            
            <div className="jp-playlist">
                <ul>
                  <li></li>
                </ul>
              </div>

      </section> */}
      <nav className="navbar navbar-default">
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap", gap: "15px" }}>
          <div className="navbar-header">
            <Link className="navbar-brand" href="/">
              <img src="/assets/img/basic/logo.png" alt="Logo" style={{ width: "150px" }} />
            </Link>
          </div>

          {/* Multi Search Wrapper */}
          <div ref={searchRef} className="multiSearchWrapper" style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative", flex: "1", justifyContent: "right" }}>
            <div className="custome-select" style={{ position: "relative", maxWidth: "20px" }}>
              <label htmlFor="albumType" style={{ color: "white", marginTop: "15px" }}>
                <span style={{ color: "white", fontSize: "large" }}>{searchType === "global" ? "Global" : "Local"}</span>
                <select
                  id="albumType"
                  name="albumType"
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  style={{ padding: "5px", borderRadius: "4px", width: "100px", backgroundColor: "white", color: "white" }}
                >
                  <option value="local">Local</option>
                  <option value="global">Global</option>
                </select>
              </label>
              <b className="fa fa-angle-down"></b>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", width: "350px" }}>
              <input
                type="text"
                placeholder="Search Songs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  width: "100%",
                  color: "black",
                  fontSize: "large",
                  fontWeight: "bold",
                  border: isInputFocused ? "2px solid darkmagenta" : "1px solid #ccc", // Highlight input
                  outline: "none",
                }}
              />
              {searchResults.length > 0 && (
                <ul className="search-results" style={{ position: "absolute", top: "40px", left: 0, background: "white", border: "1px solid #ccc", width: "100%", listStyle: "none", padding: "5px", margin: 0, zIndex: 10, color: "grey" }}>
                  {searchResults.map((result, index) => (
                    <li
                      key={index}
                      style={{ padding: "5px", cursor: "pointer" }}
                      onClick={handleResultClick} // Clears search results
                    >
                      <Link href={generateHref(result.type, result.url)} style={{ textDecoration: "none", color: "black" }} onClick={handleResultClick}>
                        <strong>{result.name}</strong> ({result.type})
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Responsive Menu */}
          <div id="dl-menu" className={`xv-menuwrapper responsive-menu ${menuOpen ? "open" : ""}`} style={{ flexShrink: 0 }}>
            <button className="menuTrigger" onClick={() => setMenuOpen((prev) => !prev)}>
              <i className="fa fa-navicon"></i>
            </button>
            <ul className="dl-menu">
              {NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <Link href={item.path} className={pathname === item.path ? "active" : ""} onClick={() => setMenuOpen(false)}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
