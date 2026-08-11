import React, { useState, useEffect } from "react";
import custumerImg from "../../assets/client.jpg";
import contractImg from "../../assets/contract-img.jpg";
import capabilityImg from "../../assets/capability-img.png";

const Category = () => {
  const data = [
    {
      id: 1,
      src: "https://www.qualtrics.com/sites/default/files/styles/max_650x650/public/migrations/articles_main_image/handshake-sq.jpeg?itok=vYscN0Xk",
      title: "Top global OEMs across sectors",
      desc: "Customers",
    },
    {
      id: 2,
      src: contractImg,
      title: "Contracts",
      desc: "Long-term revenue visibility",
    },
    {
      id: 3,
      src: capabilityImg,
      title: "Capability",
      desc: "Mission and life critical components",
    },
    {
      id: 4,

      src: " https://pts-india.com/wp-content/uploads/2025/02/Lab-Physical-sec2-1.jpg",
      title: "Quality Inspection",
      desc: "10x expansion, 360 degree eco-system",
    },
    {
      id: 5,
      src: "https://media.licdn.com/dms/image/v2/D4D22AQFd1Ch0ignQ1Q/feedshare-shrink_800/feedshare-shrink_800/0/1723929972386?e=2147483647&v=beta&t=38HZrx4QbA8VQcoSc-eDDUyBQRh3GuIu3fIiGYo8oMY",
      title: "Consistency",
      desc: "Repeatability and zero-defect culture",
    },
  ];

  // Clone items for infinite loop (4 items for the buffer)
  const extendedData = [...data.slice(-4), ...data, ...data.slice(0, 4)];

  const [currentIndex, setCurrentIndex] = useState(4);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);

  const handleTransitionEnd = () => {
    setIsMoving(false);
    if (currentIndex <= 0) {
      setIsTransitioning(false);
      setCurrentIndex(data.length);
    } else if (currentIndex >= data.length + 4) {
      setIsTransitioning(false);
      setCurrentIndex(4);
    }
  };

  useEffect(() => {
    if (!isTransitioning) {
      setTimeout(() => setIsTransitioning(true), 50);
    }
  }, [isTransitioning]);

  const moveNext = () => {
    if (isMoving) return;
    setIsMoving(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const movePrev = () => {
    if (isMoving) return;
    setIsMoving(true);
    setCurrentIndex((prev) => prev - 1);
  };

  return (
    <div className="w-full py-12 px-4 overflow-hidden bg-gray-50">
  <div>
    <div className="text-center mb-16">
      <h2 className="reveal text-blue-800 font-bold uppercase tracking-widest text-sm mb-3">
        HGP Tools Strategic Growth Pillars
      </h2>
      <p className="reveal text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
        OUR <span className="text-blue-800"> IMPACT</span>
      </p>
      <div className="h-1.5 w-24 bg-blue-800 mx-auto mt-6 rounded-full"></div>
    </div>
  </div>

  <div className="relative max-w-[1600px] mx-auto mt-10">
    {/* Navigation Buttons */}
    <div className="absolute top-1/2 -left-2 -right-2 flex justify-between z-40 -translate-y-1/2 pointer-events-none">
      <button
        onClick={movePrev}
        className="p-3 md:p-4 rounded-full bg-white shadow-xl hover:bg-gray-100 transition pointer-events-auto border border-gray-200"
      >
        <svg width="12" height="20" viewBox="0 0 10 16" fill="none" className="rotate-180">
          <path d="M1 1L9 8L1 15" stroke="black" strokeWidth="2.5" />
        </svg>
      </button>
      <button
        onClick={moveNext}
        className="p-3 md:p-4 rounded-full bg-white shadow-xl hover:bg-gray-100 transition pointer-events-auto border border-gray-200"
      >
        <svg width="12" height="20" viewBox="0 0 10 16" fill="none">
          <path d="M1 1L9 8L1 15" stroke="black" strokeWidth="2.5" />
        </svg>
      </button>
    </div>

    {/* Slider Container */}
    <div className="overflow-hidden">
      <div
        className={`flex gap-6 ${isTransitioning ? "transition-transform duration-500 ease-in-out" : ""}`}
        style={{
          /* DESKTOP DEFAULT: Shift by 25% + half the gap to keep items centered */
          transform: `translateX(calc(-${currentIndex} * (100% / 4)))`,
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedData.map((item, idx) => (
          <div
            key={idx}
            /* 
               Width Logic: 
               Mobile: 100%
               Tablet: 50% minus partial gap
               Desktop: 25% minus partial gap
            */
            className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] relative group"
          >
            {/* Uniform height applied here: h-[600px] across all cards */}
            <div className="relative h-[550px] md:h-[600px] w-full overflow-hidden rounded-2xl shadow-lg bg-gray-200">
              <img
                src={item.src}
                alt={item.desc}
                className="absolute inset-0 object-cover w-full h-full transform group-hover:scale-105 transition duration-700 ease-in-out"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-8">
                <p className="text-white/80 text-sm font-medium tracking-widest uppercase mb-2">
                  {item.title}
                </p>
                <h3 className="text-white text-2xl md:text-3xl font-bold leading-tight">
                  {item.desc}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  <style jsx>{`
    /* Force exact card alignment on different screens */
    
    @media (max-width: 1024px) {
      div[style*="translateX"] {
        /* Tablet: Shift by 50% */
        transform: translateX(calc(-${currentIndex} * 50%)) !important;
      }
    }

    @media (max-width: 640px) {
      div[style*="translateX"] {
        /* Mobile: Shift by 100% + the 24px gap */
        transform: translateX(calc(-${currentIndex} * (100% + 24px))) !important;
      }
      /* Ensure the card takes full width minus the gap logic */
      div.flex-shrink-0 {
        width: 100% !important;
      }
    }
  `}</style>
</div>


  );
};

export default Category;
