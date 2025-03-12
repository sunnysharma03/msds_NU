"use client";

import { useEffect, useState } from "react";
import React from "react";
import Slider from "react-slick";
import { getNewReleases } from "../api/api";
import "./styles.css";

// Define the Album interface
interface Album {
  id: number;
  albumImage: string;
  albumName: string;
  artistName: string;
  artistUrl: string;
  releaseDate: string;
  albumUrl: string;
  totalTracks: number;
  albumDurationMs: number;
  albumDurationMin: number;
  popularity: number;
  genre: string;
  artistFollowers: number;
  albumType: string;
}

// Initial fallback slides
const initialSlides: Album[] = [];

export default function HomeFlexSlider() {
  const [slides, setSlides] = useState<Album[]>(initialSlides);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    async function fetchSliderSongs() {
      try {
        const sliderSongs = await getNewReleases();
        if (sliderSongs.length > 0) {
          setSlides(sliderSongs);
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSliderSongs();
  }, []);

  // Slider settings
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    centerMode: true,
    centerPadding: "0",
  };

  function formatDate(dateString: any) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = date.toLocaleString("default", { month: "short" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }

  return (
    <section className="custom-slider">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      <div className="slider-container" style={{ display: loading ? "none" : "block" }}>
        <Slider {...settings}>
          {slides.map((slide) => (
            <section key={slide.id} className="album-header">
              <figure className="album-cover-wrap" style={{ left: "-0%", width: "100%", height: "350px" }}>
                <div className="album-cover_overlay"></div>
                <img className="album-cover" src={slide.albumImage} alt={slide.albumName} />
              </figure>

              <div className="container">
                <div className="cover-content">
                  <div className="text-uppercase album_overview">
                    <figure className="album-thumb">
                      <img src={slide.albumImage} alt={slide.albumName} />
                    </figure>
                    <h1 style={{ fontSize: "xx-large" }}>{slide.albumName}</h1>

                    <a className="btn btn-default text-uppercase text-bold pull-right" href={`/album?source=spotify&albumId=${slide.albumUrl.split("album/")[1]}`}>
                      <i className="fa fa-play"></i> Listen Now
                    </a>

                    <cite className="album-author mb-50" style={{ paddingTop: "20px", fontSize: "x-large" }}>
                      <a style={{ color: "floralwhite", textDecoration: "underline" }} href={`/album?source=spotify&artistId=${slide.artistUrl.split("artist/")[1]}`}>
                        {slide.artistName}
                      </a>
                    </cite>

                    <ul className="countdown clearfix mt-20">
                      <li>
                        <div className="text">
                          <span className="days">{slide.albumDurationMin} min</span>
                          <p className="days_ref">Duration</p>
                        </div>
                      </li>
                      <li>
                        <div className="text">
                          <span className="days">{slide.popularity}</span>
                          <p className="days_ref">Popularity</p>
                        </div>
                      </li>
                      <li>
                        <div className="text">
                          <span className="days">{slide.totalTracks}</span>
                          <p className="days_ref">Total Tracks</p>
                        </div>
                      </li>
                      <li>
                        <div className="text">
                          <span className="days">{formatDate(slide.releaseDate)}</span>
                          <p className="days_ref">Release Date</p>
                        </div>
                      </li>
                      <li>
                        <div className="text">
                          <span className="days">{slide.albumType}</span>
                          <p className="days_ref">Type</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </Slider>
      </div>

      {/* Loading Overlay CSS */}
      <style jsx>{`
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          z-index: 1000;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  );
}
