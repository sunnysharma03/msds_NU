"use client";

import { useEffect, useState } from "react";
import React from "react";
import Slider from "react-slick";
import { dailySongsFacts } from "../api/api";
import "./styles.css";

// Define the Song interface
interface Fact {
  id: number;
  bgImage: string;
  imgUrl: string;
  country: string;
  fact: string;
  dates: string;
}

// Component Props
interface FeaturedFlexSliderProps {
  country: string;  // Accepts country as a prop
}

// Initial slide object (fallback until API data loads)
const initialSlides: Fact[] = [
];

export default function FeaturedFlexSlider({ country }: FeaturedFlexSliderProps) {
  const [slides, setSlides] = useState<Fact[]>(initialSlides);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSliderSongs() {
      try {
        const sliderSongs = await dailySongsFacts(country);
        if (sliderSongs.length > 0) {
          setSlides(sliderSongs); // Update only if API returns data
        }
      } catch (error) {
        console.error("Error fetching songs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSliderSongs();
  }, [country]);

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
  };

  return (
    <section className="custom-slider">
      <Slider {...settings}>
        {slides.map((slide) => (
          <div key={slide.id} className="slide-container">
            {/* Background */}
            <div
              className="slide-item"
              style={{
                // backgroundImage: `url(${slide.bgImage})`
                background: "brown"
              }}
            >

            {/* Content */}
            <div className="slide-content">
              <img src={slide.imgUrl} className="album-img" style={{width: "300px", height: "300px"}}/>
              <div className="slide-details">
                
                <h6>
                  <a rel="noopener noreferrer" style={{lineHeight: "normal"}}>
                    {slide.fact}
                  </a>
                </h6>
                
                <div style={{paddingTop: "20px"}}>
                  <h3>Date: {slide.dates}</h3>
                </div>
                
                
              </div>
            </div>
          </div>
          </div>
        ))}
      </Slider>
    </section>
  );
}
