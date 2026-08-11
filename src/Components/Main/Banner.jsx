import React, { useState, useEffect, useCallback } from "react";
import video1 from "../../assets/Banner-1.mp4";
import video2 from "../../assets/banner2.mp4";
import video3 from "../../assets/rapid.mp4";

const slides = [
  {
    id: 1,
    src: video2, //video2
    title: "Engineering Excellence, One Machined Part at a Time",
    description:
      "From initial blueprint to final inspection, we deliver high-performance tools built to your exact specifications.",
  },
  {
    id: 2,
    src: video3,
    title: "Your Trusted Partner in Precision Engineering",
    description:
      "Decades of mastery in metalwork combined with state-of-the-art 5-axis machining",
  },
  {
    id: 3,
    src: video1,
    title: "Precision Perfected. CNC Crafted.",
    description:
      "Turn your complex designs into reality with our rapid prototyping and high-volume production services",
  },
];

const Banner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Auto-play logic (ride="carousel")
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative w-full overflow-hidden bg-black aspect-video md:aspect-auto md:h-[600px]">
      {/* Slides Container */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={slide.src} type="video/mp4" />
            </video>

            {/* Content Overlay */}
            <div className="absolute inset-x-[15%] bottom-10 py-5 text-center text-white hidden md:block  rounded-lg">
              <h5 className="text-2xl font-semibold mb-2">{slide.title}</h5>
              <p className="text-lg opacity-90">{slide.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Indicators */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1 w-8 transition-all duration-300 ${
              index === currentSlide ? "bg-white" : "bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-0 top-0 z-30 flex h-full w-[15%] items-center justify-center border-0 bg-none p-0 text-center text-white opacity-50 transition-opacity duration-150 hover:opacity-90 hover:no-underline focus:outline-none"
      >
        <span className="inline-block h-8 w-8">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
        </span>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-0 top-0 z-30 flex h-full w-[15%] items-center justify-center border-0 bg-none p-0 text-center text-white opacity-50 transition-opacity duration-150 hover:opacity-90 hover:no-underline focus:outline-none"
      >
        <span className="inline-block h-8 w-8">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default Banner;
