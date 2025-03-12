"use client";

import { useState, useEffect, useRef } from "react";
import { sendMessageToAPI } from "../api/api";
import ReactMarkdown from "react-markdown";

interface Message {
    sender: "bot" | "user";
    text: string;
    time: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // Load chat history from localStorage on component mount
    useEffect(() => {
        const storedMessages = JSON.parse(localStorage.getItem("chatHistory") || "[]");
    
        if (Array.isArray(storedMessages) && storedMessages.length > 0) {
            setMessages(storedMessages as Message[]); // Explicitly cast to Message[]
        } else {
            const initialMessage: Message[] = [{
                sender: "bot",
                text: "🎵 Hey there! Welcome to **SongFox** – your personal music assistant! 🎶\n\nAsk me about your favorite **songs, artists, albums**, or get music **recommendations**. I can even fetch **Spotify links** for you! Let’s find the perfect tune! 🎧",
                time: new Date().toLocaleTimeString(),
            }];
            
            setMessages(initialMessage);
            localStorage.setItem("chatHistory", JSON.stringify(initialMessage)); // Save initial message
        }
    }, []);

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        localStorage.setItem("chatHistory", JSON.stringify(messages));

        // Scroll to the latest message when messages update
        if (messagesEndRef.current && messages.length > 1) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages]);

    useEffect(() => {
        // Check if we're on the chat page
        if (window.location.pathname.includes("/chat")) {
            document.body.style.overflow = "hidden";
        }

        // Cleanup function to reset overflow when leaving
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessage: Message = { sender: "user", text: input, time: new Date().toLocaleTimeString() };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        setInput("");

        const botResponse = await sendMessageToAPI(input, updatedMessages);
        setMessages([...updatedMessages, { sender: "bot", text: botResponse, time: new Date().toLocaleTimeString() }]);
    };

    const clearChat = () => {
        localStorage.removeItem("chatHistory");
        const initialMessage: Message[] = [{
            sender: "bot",
            text: "🎵 Hey there! Welcome to **SongFox** – your personal music assistant! 🎶\n\nAsk me about your favorite **songs, artists, albums**, or get music **recommendations**. I can even fetch **Spotify links** for you! Let’s find the perfect tune! 🎧",
            time: new Date().toLocaleTimeString(),
        }];

        setMessages(initialMessage);
    };

    return (
        <div> 
            <section className="mt-10 mb-100">
                <div className="container">
                    <div className="row">
                        <div className="col-xs-12 col-md-10 col-md-offset-1 col-lg-8 col-lg-offset-2">
                        <header style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                textTransform: 'uppercase',  // For text-uppercase
                                fontWeight: 'bold',         // For text-bold
                                paddingBottom: '0px',
                                paddingTop: "0px"
                            }} className="">
                            <h3 style={{ textAlign: 'left' }}>Chat</h3>
                            <button onClick={clearChat} className="btn btn-danger">Clear Chat</button>
                        </header>
                        <hr/>
                            <ol className="comment-list" style={{ height: "500px", overflowY: "auto" }} >
                            
                                {messages.map((msg, index) => (
                                    <li key={index} className={`comment media d-flex ${msg.sender === "bot" ? "align-self-start text-left" : "align-self-end text-left"}`} style={{ maxWidth: "90%", marginLeft: msg.sender === "bot" ? "0" : "auto" }}>
                                        <a className="author_avatar" href="#">
                                            <img
                                                className="avatar"
                                                src={msg.sender === "bot" ? "assets/img/basic/bot.png" : "assets/img/basic/user.png"}
                                                width="45"
                                                height="45"
                                                alt="avatar"
                                                style={{ marginTop: msg.sender === "user" ? 0 : '-5px' }} // Conditional inline style
                                            />
                                        </a>
                                        <div className="comment-inner p-2 rounded" style={{ background: msg.sender === "bot" ? "#f1f1f1" : "#d1ecf1" }}>
                                        <h4 className="media-heading comment-author vcard" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <cite className="fn">
                                                {msg.sender === "bot"? "Music Bot": "You"}
                                            </cite>
                                            <span style={{ color: 'grey', fontSize: "small" }}>
                                                {msg.time}
                                            </span>
                                        </h4>
                                            <div className="media-body">
                                                <ReactMarkdown>{msg.text}</ReactMarkdown> 
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                <div ref={messagesEndRef} />
                            </ol>
                            <div className="d-flex mt-3">
                            <textarea
                                className="form-control"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about music..."
                                style={{ flex: 1, resize: "none",height: "100px" }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault(); // Prevents a new line in textarea
                                        sendMessage();
                                    }
                                }}
                                rows={3}
                            />
                                {/* <button onClick={sendMessage} className="btn btn-primary ml-2">Send</button> */}
                            </div>
                        </div>
                    </div>   
                </div>
            </section>
        </div>
    );
}
