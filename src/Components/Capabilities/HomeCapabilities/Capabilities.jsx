import {
  Car,
  CarFront,
  Factory,
  Settings,
  Stethoscope,
  TramFront,
  Wrench,
  Zap,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import cncImg from "../../../assets/cnc-turning-machines.png";
import cncImg3 from "../../../assets/edm-2-removebg-preview.png";
import vmc3 from "../../../assets/WhatsApp Video 2026-03-23 at 6.46.28 PM (5).mp4";
import millingVideo from "../../../assets/milling-video.mp4";
import powerpress from "../../../assets/press.mp4";
import prototyping from "../../../assets/prototyping (online-video-cutter.com).mp4";
import surfaceGrinder from "../../../assets/surfacegrdinder (online-video-cutter.com) (1).mp4";
import vmc from "../../../assets/vmc.mp4";
import vmc2 from "../../../assets/WhatsApp Video 2026-03-23 at 6.49.48 PM.mp4";
import edm from "../../../assets/EDM.mp4";

const ManufacturingCapabilities = () => {
  const video = [
    millingVideo,
    vmc2,
    vmc3,
    powerpress,
    edm,
    vmc,
    prototyping,
    surfaceGrinder,
  ];

  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef();

  const goToSlide = useCallback((index) => {
    setCurrent(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % video.length);
  }, [video.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + video.length) % video.length);
  }, [video.length]);

  // Enhanced auto-play with pause on hover
  useEffect(() => {
    if (isAutoPlaying && !isHovering) {
      autoPlayRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % video.length);
      }, 4000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isHovering, video.length]);

  // Pause auto-play when user manually navigates
  const handleManualNavigation = (action) => {
    setIsAutoPlaying(false);
    action();
    // Resume auto-play after 8 seconds of inactivity
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 2000);
  };

  const capabilities = [
    {
      name: "CNC Milling and Precision Machining",
      link: "/capabilities/advance-cnc",
    },
    {
      name: "Custom Tool & Die Manufacturing",
      link: "/capabilities/custom-tools",
    },
    {
      name: "Sheet Metal Fabrication and Press Work",
      link: "/capabilities/sheet-metal",
    },
    {
      name: "Rapid Prototyping",
      link: "/capabilities/rapid-prototyping",
    },
  ];

  const materials = [
    "Copper",
    "Brass",
    "Mild Steel",
    "Stain Steel",
    "Aluminum",
    "Engineering Plastics",
  ];

  const industries = [
    {
      title: "Electrical & Electronics Industries",
      link: "/application-industries/electronics",
      icon: <Zap size={40} className="text-blue-800" />,
    },
    {
      title: "Railway Industries",
      link: "/application-industries/railway",
      icon: <TramFront size={40} className="text-blue-800" />,
    },
    {
      title: "Medical Industries",
      link: "/application-industries/medical",
      icon: <Stethoscope size={40} className="text-blue-800" />,
    },
    {
      title: "Automotive Industries",
      link: "/automotive",
      icon: <Car size={40} className="text-blue-800" />,
    },
  ];

  return (
    <>
      <section className="bg-gradient-to-b from-slate-50 to-white py-24 overflow-hidden">
        {/* TOP HEADER - Refined for better spacing */}
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center reveal">
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold uppercase tracking-wider mb-4">
            Excellence in Manufacturing
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
            Our{" "}
            <span className="text-blue-800 relative">
              Capabilities
              <div className="h-1.5 w-24 bg-blue-800 mx-auto mt-6 rounded-full"></div>
            </span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-gray-600 text-lg">
            Delivering precision engineering solutions with cutting-edge
            technology and unmatched expertise
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT CONTENT */}
          <div className="reveal space-y-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Precision Manufacturing Excellence
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                HGP Tools provides a range of precision manufacturing services
                designed to support both product development and production
                scale with uncompromising quality.
              </p>
            </div>

            {/* Capabilities List - Card Style with hover effects */}
            <div className="grid sm:grid-cols-2 gap-4">
              {capabilities.map((item, index) => (
                <Link
                  key={index}
                  to={item.link}
                  className="group relative flex items-center p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                  <div className="relative flex items-center z-10">
                    <div className="mr-4 bg-blue-50 p-2.5 rounded-lg group-hover:bg-white/20 transition-all duration-300">
                      <FaCheckCircle className="text-blue-800 group-hover:text-white text-base" />
                    </div>
                    <span className="font-semibold text-slate-700 group-hover:text-white transition-colors duration-300">
                      {item.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Materials Section - Enhanced with modern design */}
            <div className="bg-gradient-to-br from-white to-blue-50/30 p-8 rounded-2xl border border-blue-100 shadow-lg">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-800">⚙️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Material Expertise
                  </h3>
                  <p className="text-sm text-gray-600">
                    Wide range of industrial materials
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {materials.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
                  >
                    <span className="w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(30,64,175,0.4)] group-hover:scale-150 transition-transform"></span>
                    <span className="text-gray-700 text-sm font-medium group-hover:text-blue-800 transition-colors">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT Video - Enhanced Slider with Autoscroll */}
          <div
            className="relative group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            ref={sliderRef}
          >
            <div className="absolute -inset-4 bg-blue-100/50 rounded-3xl group-hover:rotate-0 transition-transform duration-500 reveal"></div>

            {/* Main Slider Container */}
            <div className="relative bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
              {/* Video Slider */}
              <div className="relative overflow-hidden rounded-xl">
                <div
                  className="flex transition-transform duration-1000 ease-out"
                  style={{ transform: `translateX(-${current * 100}%)` }}
                >
                  {video.map((videoSrc, index) => (
                    <div
                      key={index}
                      className="min-w-full flex justify-center items-center"
                    >
                      <div className="relative w-full aspect-[3/4]">
                        <video
                          src={videoSrc}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Auto-play Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  {isAutoPlaying && !isHovering && (
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Auto-scrolling</span>
                    </div>
                  )}
                </div>

                {/* Navigation Arrows - Visible on hover */}
                <button
                  onClick={() => handleManualNavigation(prevSlide)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-600 hover:text-white transform hover:scale-110"
                  aria-label="Previous slide"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => handleManualNavigation(nextSlide)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-600 hover:text-white transform hover:scale-110"
                  aria-label="Next slide"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-3">
                  {video.map((_, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        handleManualNavigation(() => goToSlide(index))
                      }
                      className={`transition-all duration-300 ${
                        current === index
                          ? "w-10 h-2.5 bg-blue-600 rounded-full shadow-lg shadow-blue-500/50"
                          : "w-2.5 h-2.5 bg-white/70 hover:bg-white rounded-full"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Stats Card */}
              {/* <div className="absolute -bottom-4 -right-4 bg-white p-5 rounded-xl shadow-2xl border border-blue-100 hidden md:block transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse">
                    <span className="text-white text-2xl font-bold">★</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">100%</p>
                    <p className="text-sm text-gray-600">Precision Grade</p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-b from-white to-slate-50/50">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 reveal">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold tracking-wider uppercase mb-4">
              Market Expertise
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Industries We Serve
            </h2>
            <div className="mt-6 max-w-2xl mx-auto">
              <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                Our precision components power critical operations across
                diverse industrial sectors, delivering reliability and
                excellence in every application.
              </p>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 reveal">
            {industries.map((item, index) => (
              <Link
                key={index}
                to={item.link}
                className="group relative flex flex-col items-center p-8 bg-white rounded-2xl border border-slate-200 transition-all duration-500 hover:border-blue-800 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>

                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-blue-100 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-purple-100 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:opacity-20"></div>

                {/* Icon Container */}
                <div className="relative mb-6 p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 z-10">
                  <div className="transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <div className="group-hover:text-white transition-colors duration-300">
                      {React.cloneElement(item.icon, {
                        className:
                          "text-blue-800 group-hover:text-blue-800 transition-colors duration-300",
                      })}
                    </div>
                  </div>
                </div>

                {/* Text Content */}
                <h3 className="relative text-lg font-bold text-slate-800 text-center group-hover:text-white transition-colors duration-300 z-10">
                  {item.title}
                </h3>

                <div className="relative mt-4 flex items-center text-sm font-medium text-blue-800 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                  <span className="text-white">Explore Solutions</span>
                  <svg
                    className="ml-2 w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ManufacturingCapabilities;
