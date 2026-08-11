import React, { useState, useEffect, useRef } from "react";
import { FaChevronLeft, FaChevronRight, FaStar } from "react-icons/fa";

const Testimonials = () => {
  const originalData = [
    {
      id: 1,
      name: "Rajesh Mathur",
      designation: "Senior Procurement Manager",
      company: "JCB India Ltd.",
      image:
        "https://thumbs.dreamstime.com/b/young-indian-man-happy-outdoors-looking-camera-39595562.jpg",
      content:
        "HGP Tools has been a reliable partner for our heavy machinery components. Their precision in machined rings has consistently met JCB's global quality benchmarks. The technical support is exceptional.",
      rating: 5,
    },
    {
      id: 2,
      name: "Gaurav Singh",
      designation: "Puchase Department",
      company: "Escorts Kubota Limited",
      image:
        "https://www.shutterstock.com/image-photo/business-portrait-confident-businessman-entrepreneur-600nw-2480068229.jpg",
      content:
        "For our tractor division, we required high-tensile custom tools with zero-defect tolerance. HGP Tools delivered ahead of schedule, ensuring our production line in Faridabad remained uninterrupted.",
      rating: 5,
    },
    // {
    //   id: 3,
    //   name: "Anjali Verma",
    //   designation: "Quality Assurance Lead",
    //   company: "River Engineering Pvt. Ltd.",
    //   image:
    //     "https://st2.depositphotos.com/4153545/8121/i/450/depositphotos_81211808-stock-photo-young-woman-at-outdoors.jpg",
    //   content:
    //     "In the aerospace sector, AS9100D compliance is non-negotiable. HGP Tools' commitment to quality documentation and micron-level accuracy makes them our go-to supplier.",
    //   rating: 5,
    // },
    {
      id: 4,
      name: "Vikramjit Singh",
      designation: "Procurement Manager",
      company: "Action Construction Equipment (ACE)",
      image:
        "https://media.istockphoto.com/id/819856780/photo/studio-shot-of-young-handsome-indian-man-wearing-turban-against-gray-background.jpg?s=612x612&w=0&k=20&c=vjePg3Q2YkQ1DOa2GE0nDr3m-2IOU94eW0lE7DP100A=",
      content:
        "The custom tooling solutions provided by HGP have significantly reduced our downtime. Their deep understanding of alloy steel and CNC processes sets them apart in the Delhi-NCR belt.",
      rating: 5,
    },
  ];

  const testimonialData = [...originalData, ...originalData, ...originalData];
  const [currentIndex, setCurrentIndex] = useState(originalData.length);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleSlides, setVisibleSlides] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setVisibleSlides(1);
      else if (window.innerWidth < 1024) setVisibleSlides(2);
      else setVisibleSlides(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => prev + 1);
    setIsTransitioning(true);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => prev - 1);
    setIsTransitioning(true);
  };

  const handleTransitionEnd = () => {
    if (currentIndex >= originalData.length * 2) {
      setIsTransitioning(false);
      setCurrentIndex(originalData.length);
    } else if (currentIndex <= originalData.length - 1) {
      setIsTransitioning(false);
      setCurrentIndex(originalData.length * 2 - 1);
    }
  };

  return (
    <section className="py-12 bg-slate-50 sm:py-16 lg:py-24 overflow-hidden">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-blue-800 font-bold uppercase tracking-widest text-sm mb-3">
            Industrial Excellence
          </p>
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl xl:text-5xl">
            Trusted by Industrial Leaders
          </h2>
        </div>

        <div className="relative w-full mt-10 px-4 md:px-12">
          {/* RESTORED: Background Blur Gradient Effect */}
          <div className="absolute -inset-x-1 inset-y-16 md:-inset-x-2 md:-inset-y-6">
            <div
              className="w-full h-full max-w-5xl mx-auto rounded-3xl opacity-20 blur-3xl filter"
              style={{
                background:
                  "linear-gradient(90deg, #4f46e5 -0.55%, #06b6d4 22.86%, #8b5cf6 48.36%, #ef4444 73.33%, #eab308 99.34%)",
              }}
            ></div>
          </div>

          {/* Nav Buttons */}
          <button
            onClick={handlePrev}
            className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 p-4 bg-white rounded-full shadow-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
          >
            <FaChevronLeft size={20} />
          </button>
          <button
            onClick={handleNext}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-30 p-4 bg-white rounded-full shadow-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
          >
            <FaChevronRight size={20} />
          </button>

          {/* Slider Content */}
          <div className="relative overflow-hidden rounded-3xl">
            <div
              onTransitionEnd={handleTransitionEnd}
              className={`flex gap-6 py-6 ${isTransitioning ? "transition-transform duration-500 ease-in-out" : ""}`}
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleSlides)}%)`,
              }}
            >
              {testimonialData.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex flex-col bg-white/90 backdrop-blur-sm border border-white rounded-3xl shadow-lg p-8"
                >
                  <div className="flex gap-1 mb-6 text-orange-400">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} />
                    ))}
                  </div>

                  <blockquote className="flex-1">
                    <p className="text-lg leading-relaxed text-slate-800 italic font-medium">
                      "{testimonial.content}"
                    </p>
                  </blockquote>

                  <div className="flex items-center mt-8 pt-6 border-t border-slate-100">
                    <img
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                      src={testimonial.image}
                      alt={testimonial.name}
                    />
                    <div className="ml-4 text-left">
                      <p className="text-base font-bold text-slate-900 leading-none">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-blue-800 font-bold mt-1">
                        {testimonial.company}
                      </p>
                      <p className="text-[11px] text-slate-400 uppercase tracking-tighter mt-0.5">
                        {testimonial.designation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
