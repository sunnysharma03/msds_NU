"use client"

import HomeFlexSlider from "@/app/components/HomeFlexSlider";
import { useEffect, useState, useRef } from "react";
import {getDailyTop_ViralSongs, getUniqueCountries, getTrendingCitySongs, fetchEvents} from "./api/api";

// Define the interface for the country data
interface Country {
    id: number;
    countryName: string;
}

// Define the Song interface
interface DailyTopSong {
    id: number;
    songName: string;
    songUrl: string;
    imgUrl: string;
    artistName: string;
}

interface TrendingCitySong {
    id: number;
    city: string;
    songName: string;
    duration: string;
    imgUrl: string;
    songUrl: string;
    artistName: string;
}

interface TrendingEvents {
    id: number;
    name: string;
    date: string;
    venue: string;
    city: string;
    country: string;
    image: string;
    url: string;
    price: string;
}

export default function Home() {

    const [dailyTopSongs, setDailyTopSongs] = useState<DailyTopSong[]>([]);
    const [trendingCitySongs, setTrendingCitySongs] = useState<TrendingCitySong[]>([]);
    const [topEvents, setTopEvents] = useState<TrendingEvents[]>([]);

    const [dailyTopSongStartIndex, setDailyTopSongStartIndex] = useState(0);
    const [topSelection, setTopSelection] = useState<string>("latestTopSongs");
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>("Global");
    const [queryText, setQueryText] = useState<string>("");

    // Function to get today's date and next 30 days in YYYY-MM-DD format
    const getDateRange = () => {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 30);

        const formatDate = (date: Date) => date.toISOString().split("T")[0];

        return {
            today: formatDate(today),
            nextWeek: formatDate(nextWeek),
        };
    };

    // UseEffect to fetch countries once the component mounts
    useEffect(() => {
        const { today, nextWeek } = getDateRange();

        const fetchCountries = async () => {
            const fetchedCountries = await getUniqueCountries();
            setCountries(fetchedCountries);  // Set countries in state
        };
        const fetchTrendingSongsCity = async () => {
            const fetchedTrendingCitySongs = await getTrendingCitySongs();
            setTrendingCitySongs(fetchedTrendingCitySongs);  // Set countries in state
        };
        const fetchTrendingEvents = async () => {
            const fetchedEvents = await fetchEvents({
                size: 7,
                country: "CA",
                startDate: today,
                endDate: nextWeek,
                category: 'music'
            });
            console.log("fetchedEvents: ", fetchedEvents)
            setTopEvents(fetchedEvents);
        };

        fetchTrendingSongsCity();
        fetchCountries();
        fetchTrendingEvents();
    }, []);

    useEffect(() => {
        async function getDailyTop_ViralSongsFunc() {
            const data = await getDailyTop_ViralSongs(selectedCountry, queryText, topSelection);
            setDailyTopSongs(data);
        }
        getDailyTop_ViralSongsFunc();
    }, [topSelection, selectedCountry, queryText]);

    const slideLeft = () => {
        setDailyTopSongStartIndex((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    };

    const slideRight = () => {
        setDailyTopSongStartIndex((prev) => (prev + 1 + 10 >= dailyTopSongs.length ? prev : prev + 1));
    };

    // Reset function to clear search and reset country selection
    const handleReset = () => {
        setSelectedCountry("Global");  // Reset to "Global"
        setQueryText("");  // Clear search input
    };

    return (
    <div> 
        <HomeFlexSlider /> {/* Ensures Flexslider initializes after mount */}
        <section>
            <header>
                <div className="container">
                    <div className="row">
                        <div className="col-xs-12 col-md-6">
                            <h2 className="text-uppercase">Daily Top Songs</h2>
                        </div>
                        <div className="col-xs-12 col-md-6">
                            <div className="multiSearchWrapper">
                                <div className="multiSearchWrapper-inner">
                                    <div className="custome-select clearfix">
                                        <label htmlFor="albumType">
                                            <span style={{marginTop: "35px"}}>{selectedCountry}</span>
                                            <select id="albumType" name="albumType" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                                                <option value="">Select Country</option>
                                                {countries.map((country) => (
                                                <option key={country.id} value={country.countryName}>
                                                    {country.countryName}
                                                </option>
                                                ))}
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
            <div className="container">
                <div className="search-filters text-uppercase text-bold">
                    <div className="row">
                        <div className="col-xs-12 col-sm-6 col-md-5">
                            <div className="searched-for" data-before="Showing : ">
                                <span className="s-keyword">{selectedCountry} Songs</span>
                            </div>
                        </div>
                        <div className="col-xs-12 col-sm-6 col-md-7 text-right">
                            <div className="search-actions">
                                <ul>
                                    <li className={topSelection === "latestTopSongs" ? "active" : ""}>
                                        <a href="#" onClick={(event) => {
                                            event.preventDefault(); // Prevents the page from jumping to the top
                                            setTopSelection("latestTopSongs");
                                        }}>Top</a>
                                    </li>
                                    <li className={topSelection === "viralTopSongs" ? "active" : ""}>
                                        <a href="#" onClick={(event) => {
                                            event.preventDefault(); // Prevents the page from jumping to the top
                                            setTopSelection("viralTopSongs");
                                        }}>Viral</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container">
                <div className="row">
                    <div className="col-xs-12">
                        <button className="album-control btn top-left xv-prev" onClick={slideLeft}>
                            <i className="fa fa-angle-left"></i>
                        </button>
                        <button className="album-control btn bottom-right xv-next" onClick={slideRight}>
                            <i className="fa fa-angle-right"></i>
                        </button>
                            
                        <div className="album-grid-wrap" style={{ overflow: "hidden" }}>
                            <div 
                                className="album-grid text-uppercase clearfix"
                                style={{ 
                                    display: "flex", 
                                    flexWrap: "wrap",  // Ensures items wrap correctly
                                    width: "100%", 
                                    gap: "10px" 
                                }}
                            >
                                {dailyTopSongs.slice(dailyTopSongStartIndex, dailyTopSongStartIndex + 10).map((song, index) => {
                                    const songId = song.songUrl.split("track/")[1];
                                    return (
                                        <a 
                                            key={song.id} 
                                            href={`/album?source=spotify&songId=${songId}`} 
                                            className="album-unit"
                                            style={{ 
                                                width: "calc(100% / 5 - 10px)",  // Ensures 5 columns
                                                display: "flex", 
                                                flexDirection: "column", 
                                                alignItems: "center"
                                            }}
                                        >
                                            <figure>
                                                <img src={song.imgUrl} width="200" height="200" alt={song.songName} />
                                                <figcaption>
                                                    <span>{song.artistName}</span>
                                                    <h3>{song.songName}</h3>
                                                </figcaption>
                                            </figure>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>    
                </div>
            </div>
            <div className="container">
                <div className="row">
                    <div className="col-xs-12">
                         <a className="btn btn-wide btn-grey text-uppercase text-bold" href="/featured">Show all Albums</a>
                    </div>
                </div>
            </div>
        </section>
    {/* <!--=================================================
    TOP songs /Trendding This week / Featured Songs
    ==================================================--> */}
        <section>
            <header>
                <div className="container">
                    <div className="row">
                        <div className="col-xs-12">
                            <h2 className="text-uppercase">City Trending.</h2>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                <div className="search-filters text-uppercase text-bold">
                    <div className="row">
                        <div className="col-xs-12 col-sm-6 col-md-5">
                            <a className="link link-grey" href="/featured">show All City Trending</a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container">
                <ul className="song-list text-uppercase text-bold clearfix">
                {trendingCitySongs.map((song) => (
                    
                    <li key={song.id} id={`singleSongPlayer-${song.id}`} className="song-unit singleSongPlayer clearfix" data-before={song.id}>
                        <div id={`singleSong-jplayer-${song.id}`} className="singleSong-jplayer" data-title={song.songName} data-mp3={song.songUrl}>
                        </div>

                        <figure>
                            <img src={song.imgUrl} alt={song.songName} width="265" height="265" />
                        </figure>

                        <span className="playit controls jp-controls-holder">
                            <a href="/featured" rel="noopener noreferrer">
                                <i className="jp-play pc-play"></i>
                            </a>
                        </span>
                        
                        <span className="song-title jp-title" data-before="Title" style={{ maxWidth: "40ch" }}>{song.songName}</span>
                        <span className="song-author" data-before="Artist">{song.artistName}</span>
                        <span className="song-time jp-duration" data-before="Duration">{song.duration}</span>
                        <a className="song-btn" href={`/album?source=spotify&songId=${song.songUrl.split("track/")[1]}`}>{song.city} </a>

                        <div className="audio-progress">
                            <div className="jp-seek-bar">
                                <div className="jp-play-bar" style={{ width: "20%" }}></div>
                            </div>
                        </div>
                    </li>
                ))}
                </ul>
            </div>
        </section>    
    {/* <!--=================================
    Events/concerts
    =================================--> */}
        <section>
            <header className="parallax parallax_two style3 text-center text-uppercase text-bold" data-stellar-background-ratio="0.5">
                <div className="container">
                    <div className="row">
                        <div className="col-xs-12">
                            <h2>Top Events</h2>
                            <p>buy tickets for the latest events</p>
                        </div>
                    </div>
                </div>
            </header>
            <div className="container">
                <div className="row">
                    <div className="col-xs-12">
                    {topEvents.map((event) => (
                                <div className="event-unit-slide" key={event.id}>
                                    <div className="event-unit text-uppercase text-bold">
                                        {/* Event Date */}
                                        <div className="time-date">
                                            <span>{new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                        </div>
    
                                        {/* Event Info */}
                                        <div className="event-info">
                                            <figure>
                                                <img src={event.image || "assets/demo-data/a1.jpg"} alt={event.name} width="265" height="265"/>
                                            </figure>
                                            <span>
                                                <a className="eventTitle" href={event.url} target="_blank" rel="noopener noreferrer">
                                                    {event.name}
                                                </a>
                                            </span>
                                        </div>
    
                                        
                                        <div className="event-venue">
                                            <i className="fa fa-map-marker"></i>
                                            <div className="location">
                                                {event.venue || "Unknown Venue"}
                                                <small>{event.city}, {event.country}</small>
                                            </div>
                                        </div>
    
                                        
                                        <a href={event.url} target="_blank" rel="noopener noreferrer" className="btn btn-yellow">
                                            Buy
                                        </a>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                

            </div>
        </section>  
    </div>
    
    );
  }
  