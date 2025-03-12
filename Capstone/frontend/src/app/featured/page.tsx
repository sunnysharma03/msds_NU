"use client";

import { useEffect, useState } from "react";
import { getUniqueCountries, getAllFeaturedSongs } from "../api/api";
import FeaturedFlexSlider from "@/app/components/FeaturedFlexSlider";

// Define the interface for the country data
interface Country {
    id: number;
    countryName: string;
}

// Define the Song interfaces
interface DailyTopSong {
    id: number;
    songName: string;
    songUrl: string;
    imgUrl: string;
    artistName: string;
}

interface DailyViralSong {
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

interface WeeklyTopAlbum {
    id: number;
    albumName: string;
    albumUrl: string;
    imgUrl: string;
    artistName: string;
}

interface WeeklyTopArtist {
    id: number;
    artistUrl: string;
    imgUrl: string;
    artistName: string;
}

export default function Featured() {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>("Global");
    const [queryText, setQueryText] = useState<string>("");

    const [dailyTopSongs, setDailyTopSongs] = useState<DailyTopSong[]>([]);
    const [trendingCitySongs, setTrendingCitySongs] = useState<TrendingCitySong[]>([]);
    const [dailyViralSongs, setDailyViralSongs] = useState<DailyViralSong[]>([]);
    const [weeklyTopAlbums, setWeeklyTopAlbums] = useState<WeeklyTopAlbum[]>([]);
    const [weeklyTopArtists, setWeeklyTopArtists] = useState<WeeklyTopArtist[]>([]);

    // indexes
    const [dailyTopSongStartIndex, setDailyTopSongStartIndex] = useState(0);
    const [trendingCitySongStartIndex, setTrendingCitySongStartIndex] = useState(0);
    const [dailyViralSongStartIndex, setDailyViralSongStartIndex] = useState(0);
    const [weeklyTopAlbumStartIndex, setWeeklyTopAlbumStartIndex] = useState(0);
    const [weeklyTopArtistStartIndex, setWeeklyTopArtistStartIndex] = useState(0);

    // UseEffect to fetch countries and songs
    useEffect(() => {
        const fetchCountries = async () => {
            const fetchedCountries = await getUniqueCountries();
            setCountries(fetchedCountries); // Set countries in state
        };

        const fetchAllFeaturedSongs = async () => {
            const fetchedSongs = await getAllFeaturedSongs(selectedCountry, queryText);
            
            if (fetchedSongs) {
                setDailyTopSongs(fetchedSongs.dailyTopSongs);
                setDailyViralSongs(fetchedSongs.dailyViralSongs);
                setTrendingCitySongs(fetchedSongs.trendingCitySongs);
                setWeeklyTopAlbums(fetchedSongs.weeklyTopAlbums);
                setWeeklyTopArtists(fetchedSongs.weeklyTopArtists);
            }
        };

        fetchCountries();
        fetchAllFeaturedSongs();
    }, [selectedCountry, queryText]); // Re-fetch when country or query changes

    // Reset function to clear search and reset country selection
    const handleReset = () => {
        setSelectedCountry("Global");  // Reset to "Global"
        setQueryText("");  // Clear search input
    };

    // function for left and right sliders
    const slideLeftTopDaily = () => {
        setDailyTopSongStartIndex((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    };
    const slideRightTopDaily = () => {
        setDailyTopSongStartIndex((prev) => (prev + 1 + 10 >= dailyTopSongs.length ? prev : prev + 1));
    };

    const slideLeftTrendingCity = () => {
        setTrendingCitySongStartIndex((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    };
    const slideRightTrendingCity = () => {
        setTrendingCitySongStartIndex((prev) => (prev + 1 + 10 >= trendingCitySongs.length ? prev : prev + 1));
    };

    const slideLeftDailyViral = () => {
        setDailyViralSongStartIndex((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    };
    const slideRightDailyViral= () => {
        setDailyViralSongStartIndex((prev) => (prev + 1 + 10 >= dailyViralSongs.length ? prev : prev + 1));
    };

    const slideLeftWeeklyTopAlbum = () => {
        setWeeklyTopAlbumStartIndex((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    };
    const slideRightWeeklyTopAlbum = () => {
        setWeeklyTopAlbumStartIndex((prev) => (prev + 1 + 10 >= weeklyTopAlbums.length ? prev : prev + 1));
    };

    const slideLeftWeeklyTopArtist = () => {
        setWeeklyTopArtistStartIndex((prev) => (prev - 1 < 0 ? 0 : prev - 1));
    };
    const slideRightWeeklyTopArtist = () => {
        setWeeklyTopArtistStartIndex((prev) => (prev + 1 + 10 >= weeklyTopArtists.length ? prev : prev + 1));
    };

    return (
        <div>
            <FeaturedFlexSlider country={selectedCountry} /> {/* Ensures Flexslider initializes after mount */}
            <section>
                <header>
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12 col-md-4">
                                <h2 className="text-uppercase">Top Featured Songs</h2>
                            </div>
                            <div className="col-xs-12 col-md-8">
                                <div className="multiSearchWrapper">
                                    <div className="multiSearchWrapper-inner">
                                        <div className="custome-select clearfix">
                                            <label htmlFor="albumType">
                                                <span style={{marginTop: "37px"}}>{selectedCountry}</span>
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
            </section>
            
            {/* Top Daily Slider */}
            {dailyTopSongs.length>0 && (
                <section>
                    <header>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12">
                                    <h2 className="text-uppercase">Top Daily.</h2>
                                </div>
                            </div>
                        </div>
                    </header>
            
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="album-control btn top-left xv-prev" onClick={slideLeftTopDaily}>
                                    <i className="fa fa-angle-left"></i>
                                </button>
                                <button className="album-control btn bottom-right xv-next" onClick={slideRightTopDaily}>
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
                                                        <img src={song.imgUrl} style={{maxHeight: "220px", maxWidth: "220px"}} alt={song.songName} />
                                                        <figcaption>
                                                            <h2>{song.artistName}</h2>
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

                </section>
            )};

            
            {/* Trending City Slider */}
            {trendingCitySongs.length>0 && (
                <section>
                    <header>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12">
                                    <h2 className="text-uppercase">Trending Songs in Cities</h2>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="album-control btn top-left xv-prev" onClick={slideLeftTrendingCity}>
                                    <i className="fa fa-angle-left"></i>
                                </button>
                                <button className="album-control btn bottom-right xv-next" onClick={slideRightTrendingCity}>
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
                                        {trendingCitySongs.slice(trendingCitySongStartIndex, trendingCitySongStartIndex + 10).map((song, index) => {
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
                                                        <img src={song.imgUrl} style={{maxHeight: "220px", maxWidth: "220px"}} alt={song.songName} />
                                                            <figcaption>
                                                                <h2>{song.city}</h2>
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
                </section>
            )};


            {/* Daily Viral Slider */}
            {dailyViralSongs.length>0 && (
                <section>
                    <header>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12">
                                    <h2 className="text-uppercase">Daily Viral</h2>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="album-control btn top-left xv-prev" onClick={slideLeftDailyViral}>
                                    <i className="fa fa-angle-left"></i>
                                </button>
                                <button className="album-control btn bottom-right xv-next" onClick={slideRightDailyViral}>
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
                                        {dailyViralSongs.slice(dailyViralSongStartIndex, dailyViralSongStartIndex + 10).map((song, index) => {
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
                                                        <img src={song.imgUrl} style={{maxHeight: "220px", maxWidth: "220px"}} alt={song.songName} />
                                                        <figcaption>
                                                            <h2>{song.artistName}</h2>
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
                </section>
            )};


            {/* Weekly Top Albums Slider */}
            {weeklyTopAlbums.length>0 && (
                <section>
                    <header>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12">
                                    <h2 className="text-uppercase">Weekly Top Albums</h2>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="album-control btn top-left xv-prev" onClick={slideLeftWeeklyTopAlbum}>
                                    <i className="fa fa-angle-left"></i>
                                </button>
                                <button className="album-control btn bottom-right xv-next" onClick={slideRightWeeklyTopAlbum}>
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
                                        {weeklyTopAlbums.slice(weeklyTopAlbumStartIndex, weeklyTopAlbumStartIndex + 10).map((song, index) => {
                                            const albumId = song.albumUrl.split("album/")[1];
                                            return (
                                                <a 
                                                    key={song.id} 
                                                    href={`/album?source=spotify&albumId=${albumId}`} 
                                                    className="album-unit"
                                                    style={{ 
                                                        width: "calc(100% / 5 - 10px)",  // Ensures 5 columns
                                                        display: "flex", 
                                                        flexDirection: "column", 
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    <figure>
                                                        <img src={song.imgUrl} style={{maxHeight: "220px", maxWidth: "220px"}} alt={song.albumName} />
                                                        <figcaption>
                                                            <h2>{song.artistName}</h2>
                                                            <h3>{song.albumName}</h3>
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
                </section>
            )};


            {/* Weekly Top Artist Slider */}
            {weeklyTopArtists.length>0 && (
                <section>
                    <header>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-12">
                                    <h2 className="text-uppercase">Weekly Top Artist</h2>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12">
                                <button className="album-control btn top-left xv-prev" onClick={slideLeftWeeklyTopArtist}>
                                    <i className="fa fa-angle-left"></i>
                                </button>
                                <button className="album-control btn bottom-right xv-next" onClick={slideRightWeeklyTopArtist}>
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
                                        {weeklyTopArtists.slice(weeklyTopArtistStartIndex, weeklyTopArtistStartIndex + 10).map((song, index) => {
                                            const artistId = song.artistUrl.split("artist/")[1];
                                            return (
                                                <a 
                                                    key={song.id} 
                                                    
                                                    href={`/album?source=spotify&artistId=${artistId}`}
                                                    className="album-unit"
                                                    style={{ 
                                                        width: "calc(100% / 5 - 10px)",  // Ensures 5 columns
                                                        display: "flex", 
                                                        flexDirection: "column", 
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    <figure>
                                                        <img src={song.imgUrl} style={{maxHeight: "220px", maxWidth: "220px"}} alt={song.artistName} />
                                                        <figcaption>
                                                            <h2>{song.artistName}</h2>
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
                </section>
            )};

        </div>
    );
}