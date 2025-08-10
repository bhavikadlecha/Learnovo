import React, { useState, useEffect } from 'react';
import slide1Image from './group.jpg';
import slide2Image from './learner.jpg';
import { Link } from 'react-router-dom';    

// <Link to="/signup" style={..}>Get Started</Link>

// Import Montserrat font from Google Fonts
const montserratFontLink = document.createElement('link');
montserratFontLink.href = 'https://fonts.googleapis.com/css?family=Montserrat:400,700&display=swap';
montserratFontLink.rel = 'stylesheet';
document.head.appendChild(montserratFontLink);

const slides = [
    {
        title: "Unlock Your Learning Superpower",
        description: "AI-driven paths tailored to your goals, pace & potential — because no two learners are the same.",
        image: slide1Image,
        bgColor: 'rgba(173, 216, 230, 0.4)',
    },
    {
        title: "Your Future, Your Path",
        description: "Let AI guide you through a personalized education experience — adaptive, intuitive, and built around you..",
        image: slide2Image,
        bgColor: 'rgba(203, 187, 47, 0.4)',
    }
];

function HeroSlider() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const slide = slides[current];

    return (
        <div id="Hero" style={{ position: 'relative', height: '100vh', overflow: 'hidden', fontFamily: "'Montserrat', sans-serif" }}>
            {/* Background Image */}
            <img
                src={slide.image}
                alt="Background"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    opacity: 0.3,
                    zIndex: 0,
                }}
            />

            {/* Overlay Color */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: '100%',
                    backgroundColor: slide.bgColor,
                    zIndex: 1,
                }}
            />

            {/* Content */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingTop: '5vh',
                    paddingLeft: '5%',
                    paddingRight: '5%',
                    fontFamily: "'Montserrat', sans-serif"
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5%' }}>
                    {/* Text Content */}
                    <div style={{ flex: 1, paddingTop: '4vh' }}>
  <h1
    style={{
      fontSize: '3.5rem',
      fontWeight: '700',
      color: '#003049',
      marginBottom: '1rem',
      fontFamily: "'Montserrat', sans-serif"
    }}
  >
    {slide.title}
  </h1>
  <p
    style={{
      fontSize: '1.3rem',
      color: '#003049',
      maxWidth: '90%',
      marginBottom: '1.5rem',
      fontFamily: "'Montserrat', sans-serif"
    }}
  >
    {slide.description}
  </p>

  {/* Get Started Button */}
  <Link to="/form"
  style={{
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#003049',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '6px',
    textDecoration: 'none',
    transition: 'background-color 0.3s ease',
  }}
>
  Get Started
</Link>

</div>


                    {/* Enlarged Image */}
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <img
                            src={slide.image}
                            alt="Slide visual"
                            style={{
                                maxWidth: '95%',
                                maxHeight: '85%',
                                borderRadius: '12px',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.9)',
                                transform: 'scale(1.05)', // Slight enlargement
                            }}
                        />
                    </div>
                </div>

                {/* Dots Navigation */}
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    {slides.map((_, index) => (
                        <span
                            key={index}
                            onClick={() => setCurrent(index)}
                            style={{
                                display: 'inline-block',
                                height: '12px',
                                width: '12px',
                                margin: '0 6px',
                                borderRadius: '50%',
                                backgroundColor: current === index ? '#003049' : '#ccc',
                                cursor: 'pointer',
                            }}
                        ></span>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HeroSlider;
