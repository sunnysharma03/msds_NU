"use client";

import { useEffect, useState, useRef } from "react";
import {fetchEvents} from "../api/api";
import "./styles.css";

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

interface EventData {
   id: number;
   name: string;
   artist: string;
   dateTime: string;
   image: string;
   ticketUrl: string;
}


export default function Events() {

   const [topEvents, setTopEvents] = useState<TrendingEvents[]>([]);
   const [selectedCategory, setSelectedCategory] = useState<string>("music");
   const [selectedCountry, setSelectedCountry] = useState<string>("CA");
   const [queryText, setQueryText] = useState<string>("");
   const [event, setEvent] = useState<EventData | null>(null);
   const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
   const today = new Date();
   const defaultDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split("T")[0];
   // State to store selected date
   const [selectedDate, setSelectedDate] = useState(defaultDate);
   const [loading, setLoading] = useState<boolean>(true);

   // Function to handle date change
   const handleDateChange = (event: any) => {
       setSelectedDate(event.target.value);
   };

   // UseEffect to fetch countries once the component mounts
   useEffect(() => {
      
      const today = new Date();
      const fetchTrendingEvents = async () => {
         setLoading(true);
         const fetchedEvents = await fetchEvents({
            size: 20,
            country: selectedCountry,
            startDate: today.toISOString().split("T")[0],
            endDate: selectedDate,
            category: selectedCategory,
            eventName: queryText
         });
         setTopEvents(fetchedEvents);
         setLoading(false);
      };
      fetchTrendingEvents();
      
   }, [queryText, selectedCategory, selectedDate, selectedCountry]);
   
   const getRandomEvent = () => {
      const dummyEvents = [
          {
              id: 1,
              name: "Beyoncé: COWBOY CARTER TOUR",
              artist: "Atlanta, GA • Mercedes-Benz Stadium",
              dateTime: "2025-03-20T12:00:00",
              image: "https://s1.ticketm.net/dam/a/f46/c29d3524-6082-43b2-a450-25dc599b6f46_TABLET_LANDSCAPE_LARGE_16_9.jpg?width=720&height=405&fit=cover&optimize=high&auto=webp",
              ticketUrl: "https://www.ticketmaster.com/beyonce-cowboy-carter-tour-atlanta-georgia-07-14-2025/event/0E006248D58938F4",
          },
          {
              id: 2,
              name: "Post Malone Presents: The BIG ASS Stadium Tour",
              artist: "Allegiant Stadium Tickets,  Las Vegas, NV",
              dateTime: "2025-05-03T19:30:00",
              image: "https://s1.ticketm.net/dam/a/b84/cc552e7a-f3f5-422f-b266-aab35054cb84_SOURCE?width=720&height=405&fit=cover&optimize=high&auto=webp",
              ticketUrl: "https://www.ticketmaster.com/post-malone-tickets/artist/2119390?ac_link=iccp_hp_t5_fallback_K8vZ917KjPf",
          },
          {
              id: 3,
              name: "Backstreet Boys: Into The Millennium",
              artist: "Sphere • Las Vegas, NV",
              dateTime: "2025-07-12T20:00:00",
              image: "https://s1.ticketm.net/dam/a/63c/cbf1f8fb-6505-41e5-9f61-11a6642e963c_RETINA_PORTRAIT_3_2.jpg",
              ticketUrl: "https://www.ticketmaster.com/backstreet-boys-into-the-millennium-las-vegas-nevada-07-27-2025/event/17006246B4031F6C&ved=2ahUKEwiBotz3-dOLAxUPdfUHHfn5LwsQFnoECBgQAQ&usg=AOvVaw1pqhRKrmpI_bYst0ouIgjt",
          },
      ];
   
      return dummyEvents[Math.floor(Math.random() * dummyEvents.length)];
   };

   useEffect(() => {
      const randomEvent = getRandomEvent();
      setEvent(randomEvent); // ✅ No TypeScript error now
   
      setCountdown(calculateTimeLeft(randomEvent.dateTime));
   
      const interval = setInterval(() => {
         setCountdown(calculateTimeLeft(randomEvent.dateTime));
      }, 1000);
   
      return () => clearInterval(interval);
   }, []);  

   const calculateTimeLeft = (eventDateTime: string) => {
      const now = new Date();
      const eventTime = new Date(eventDateTime);
      const diff = eventTime.getTime() - now.getTime();

      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

      return {
         days: Math.floor(diff / (1000 * 60 * 60 * 24)),
         hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
         minutes: Math.floor((diff / (1000 * 60)) % 60),
         seconds: Math.floor((diff / 1000) % 60),
      };
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

        <section style={{ display: loading ? "none" : "block" }} className="events-countdown parallax parallax_overlay text-bold" data-stellar-background-ratio="0.5">
            <div className="parallax_inner">
                <div className="albumAction">
                    <div className="container">
                        <a className="btn btn-default text-uppercase text-bold" href={event?.ticketUrl} target="_blank">
                            <i className="fa fa-cloud-download"></i> Buy Tickets
                        </a>
                    </div>
                </div>
                <div className="event">
                    <div className="container">
                        <div className="row">
                            <div className="col-xs-12 col-sm-6 col-md-4">
                                <figure>
                                    <img src={event?.image} alt={event?.name} />
                                </figure>
                            </div>
                            <div className="col-xs-12 col-sm-6 col-md-8 about-album" style={{paddingLeft: "30px"}}>
                                <div className="event-details">
                                    <h2>{event?.name}</h2>
                                    <h6>by {event?.artist}</h6>
                                    <p style={{color: "gold", paddingTop: "20px"}}>
                                        <strong>Don't miss out on {event?.name} featuring {event?.artist}!</strong><br />
                                        Grab your tickets now and experience an amazing night!
                                    </p>
                                    <ul className="countdown clearfix mt-20">
                                        <li>
                                            <div className="text">
                                                <span className="days">{countdown.days}</span>
                                                <p className="days_ref">days</p>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="text">
                                                <span className="hours">{countdown.hours}</span>
                                                <p className="hours_ref">hours</p>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="text">
                                                <span className="minutes">{countdown.minutes}</span>
                                                <p className="minutes_ref">minutes</p>
                                            </div>
                                        </li>
                                        <li>
                                            <div className="text">
                                                <span className="seconds">{countdown.seconds}</span>
                                                <p className="seconds_ref">seconds</p>
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
        <section style={{ display: loading ? "none" : "block" }} className="events-finder">
           <div className="container">
              <header>
                 <div className="row">
                    <div className="col-xs-12 col-md-2">
                       <h2 className="text-uppercase">Find Events.</h2>
                    </div>
                    <div className="col-xs-12 col-md-10">
                       <div className="event-form text-right">
                          <form>
                             <div className="form-input search-keyword">
                                <input type="text" placeholder="Search Keyword"  value={queryText} 
                                        onChange={(e) => setQueryText(e.target.value)} />
                                <i className="icon fa fa-search"></i>
                             </div>
                             <div className="form-input select-location">
                                <div className="custome-select">
                                   <b className="fa fa-bars"></b>
                                   <span>
                                       {selectedCategory ? selectedCategory : "Select aCategory"}
                                    </span>
                                   <select id="search-dropdown-box" className="select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                      <option value="music">Music</option>
                                      <option value="arts & theatre">Arts & Theatre</option>
                                      <option value="sports">Sports</option>
                                      <option value="attraction">Attractions</option>
                                      <option value="comedy">Comedy</option>
                                      <option value="concerts">Concerts</option>
                                      <option value="gaming">Gaming</option>
                                      <option value="circus">Circus</option>
                                      <option value="film">Film</option>
                                   </select>
                                </div>
                             </div>
                             <div className="form-input" style={{color: "grey", fontSize: "large"}}>
                                <input 
                                    type="date"  
                                    className="" 
                                    value={selectedDate}
                                    min={new Date().toISOString().split("T")[0]} 
                                    max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} 
                                    onChange={handleDateChange}
                                 />
                                <i className="icon fa fa-calendar"></i>
                             </div>
                             
                             <div className="form-input select-location">
                                <div className="custome-select">
                                   <b className="fa fa-bars"></b>
                                   <span>
                                       {selectedCountry ? selectedCountry : "Select Country"}
                                    </span>
                                   <select id="search-dropdown-box" className="select" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                                       <option value="US">United States Of America</option>
                                       <option value="AD">Andorra</option>
                                       <option value="AI">Anguilla</option>
                                       <option value="AR">Argentina</option>
                                       <option value="AU">Australia</option>
                                       <option value="AT">Austria</option>
                                       <option value="AZ">Azerbaijan</option>
                                       <option value="BS">Bahamas</option>
                                       <option value="BH">Bahrain</option>
                                       <option value="BB">Barbados</option>
                                       <option value="BE">Belgium</option>
                                       <option value="BM">Bermuda</option>
                                       <option value="BR">Brazil</option>
                                       <option value="BG">Bulgaria</option>
                                       <option value="CA">Canada</option>
                                       <option value="CL">Chile</option>
                                       <option value="CN">China</option>
                                       <option value="CO">Colombia</option>
                                       <option value="CR">Costa Rica</option>
                                       <option value="HR">Croatia</option>
                                       <option value="CY">Cyprus</option>
                                       <option value="CZ">Czech Republic</option>
                                       <option value="DK">Denmark</option>
                                       <option value="DO">Dominican Republic</option>
                                       <option value="EC">Ecuador</option>
                                       <option value="EE">Estonia</option>
                                       <option value="FO">Faroe Islands</option>
                                       <option value="FI">Finland</option>
                                       <option value="FR">France</option>
                                       <option value="GE">Georgia</option>
                                       <option value="DE">Germany</option>
                                       <option value="GH">Ghana</option>
                                       <option value="GI">Gibraltar</option>
                                       <option value="GB">Great Britain</option>
                                       <option value="GR">Greece</option>
                                       <option value="HK">Hong Kong</option>
                                       <option value="HU">Hungary</option>
                                       <option value="IS">Iceland</option>
                                       <option value="IN">India</option>
                                       <option value="IE">Ireland</option>
                                       <option value="IL">Israel</option>
                                       <option value="IT">Italy</option>
                                       <option value="JM">Jamaica</option>
                                       <option value="JP">Japan</option>
                                       <option value="KR">Korea, Republic of</option>
                                       <option value="LV">Latvia</option>
                                       <option value="LB">Lebanon</option>
                                       <option value="LT">Lithuania</option>
                                       <option value="LU">Luxembourg</option>
                                       <option value="MY">Malaysia</option>
                                       <option value="MT">Malta</option>
                                       <option value="MX">Mexico</option>
                                       <option value="MC">Monaco</option>
                                       <option value="ME">Montenegro</option>
                                       <option value="MA">Morocco</option>
                                       <option value="NL">Netherlands</option>
                                       <option value="AN">Netherlands Antilles</option>
                                       <option value="NZ">New Zealand</option>
                                       <option value="ND">Northern Ireland</option>
                                       <option value="NO">Norway</option>
                                       <option value="PE">Peru</option>
                                       <option value="PL">Poland</option>
                                       <option value="PT">Portugal</option>
                                       <option value="RO">Romania</option>
                                       <option value="RU">Russian Federation</option>
                                       <option value="LC">Saint Lucia</option>
                                       <option value="SA">Saudi Arabia</option>
                                       <option value="RS">Serbia</option>
                                       <option value="SG">Singapore</option>
                                       <option value="SK">Slovakia</option>
                                       <option value="SI">Slovenia</option>
                                       <option value="ZA">South Africa</option>
                                       <option value="ES">Spain</option>
                                       <option value="SE">Sweden</option>
                                       <option value="CH">Switzerland</option>
                                       <option value="TW">Taiwan</option>
                                       <option value="TH">Thailand</option>
                                       <option value="TT">Trinidad and Tobago</option>
                                       <option value="TR">Turkey</option>
                                       <option value="UA">Ukraine</option>
                                       <option value="AE">United Arab Emirates</option>
                                       <option value="UY">Uruguay</option>
                                       <option value="VE">Venezuela</option>
                                   </select>
                                </div>
                             </div>
                             
                          </form>
                       </div>
                    </div>
                 </div>
              </header>
              <div className="featured-events">
                 <div className="row">
                    <div className="col-xs-12">
                       <div className="store-grid text-uppercase text-bold">
                           <div className="store-product-container">
                              {topEvents.length > 0 ? (
                                 topEvents.map((event) => (
                                       <div className="store-product" key={event.id}>
                                          {/* Event Image */}
                                          <figure>
                                             <img className="event-image"
                                                   src={event.image} 
                                                   alt={event.name} 
                                             />
                                             <figcaption>
                                                   <a href={event.url} target="_blank" rel="noopener noreferrer" className="btn btn-grey">
                                                      <i className="fa fa-ticket"></i> Buy Ticket
                                                   </a>
                                             </figcaption>
                                          </figure>

                                          {/* Event Details */}
                                          <div className="product-info">
                                             <h3>{event.name}</h3>
                                             <h6>
                                                   <i className="fa fa-clock-o"></i> 
                                                   {event.date ? new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "TBA"}, @{event.venue}
                                             </h6>
                                             <span className="price-tag">
                                                   {event.price !== "Price not available" ? `${event.price}` : "NA"}
                                             </span>
                                          </div>
                                       </div>
                                 ))
                              ): (
                                 <div>
                                    <h3>No Events Found, Please change the filters !</h3>
                                 </div>
                              )}
                           </div>

                          
                       </div>
                        {topEvents.length > 0 && (
                           <a className="btn btn-wide btn-grey text-uppercase text-bold" target="_blank" href="https://www.ticketmaster.com">View All</a>
                        )}
                     </div>
                 </div>
              </div>
           </div>
        </section>
     </div>
    );
  }
  