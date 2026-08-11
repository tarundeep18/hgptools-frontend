import React, { useEffect, useRef, useState, useCallback } from "react";
import { PageFlip } from "page-flip";

import pageFlipSound from "../assets/audio.mp3";
import cate1Img from "../assets/catelog-img-1.jpg";
import cate2Img from "../assets/catelog-im-2.jpg";
import cate3Img from "../assets/catelog-img-3.jpg";
import cate44Img from "../assets/catelog-img-4.jpg";
import cate5Img from "../assets/catelog-img-5.jpg";
import cate6Img from "../assets/catelog-img-6.jpg";
import cate7Img from "../assets/catelog-img-7.jpg";
import cate8Img from "../assets/catelog-img-8.jpg";
import cate9Img from "../assets/catelog-img-9.jpg";
import cate10Img from "../assets/catelog-img-10.jpg";
import cate11Img from "../assets/catelog-img-11.jpg";
import cate12Img from "../assets/catelog-img-12.jpg";
import cate13Img from "../assets/catelog-img-13.jpg";
import cate14Img from "../assets/catelog-img-14.jpg";
import cate15Img from "../assets/catelog-img-15.jpg";
import cate16Img from "../assets/catelog-img-16.jpg";
import cate17Img from "../assets/catelog-img-17.jpg";
import cate18Img from "../assets/catelog-img-18.jpg";
import cate19Img from "../assets/catelog-img-19.jpg";
import cate20Img from "../assets/catelog-img-20.jpg";

// ✅ IMPORT YOUR PDF FILE FROM ASSETS
import catalogPDF from "../assets/Hgp-tools-Catelog.pdf"; // Change this to your actual PDF file name

const images = [
  cate1Img,
  cate2Img,
  cate3Img,
  cate44Img,
  cate5Img,
  cate6Img,
  cate7Img,
  cate8Img,
  cate9Img,
  cate10Img,
  cate11Img,
  cate12Img,
  cate13Img,
  cate14Img,
  cate15Img,
  cate16Img,
  cate17Img,
  cate18Img,
  cate19Img,
  cate20Img,
];

export default function FlipBook() {
  const bookRef = useRef(null);
  const pageFlipRef = useRef(null);
  const audioRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
  const isInitializedRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // ✅ Preload images and handle window resize (SAME SIZE LOGIC)
  useEffect(() => {
    let isMounted = true;
    let count = 0;

    const preloadImages = () => {
      images.forEach((src) => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
          if (isMounted) {
            count++;
            if (count === images.length) {
              setLoaded(true);
            }
          }
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${src}`);
          if (isMounted) {
            count++;
            if (count === images.length) {
              setLoaded(true);
            }
          }
        };
      });
    };

    const calculateDimensions = () => {
      // EXACT SAME calculation - NO CHANGES
      const maxWidth = 300;
      const maxHeight = 300;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let width = Math.min(maxWidth, viewportWidth - 40);
      let height = Math.min(maxHeight, viewportHeight - 40);

      const aspectRatio = maxHeight / maxWidth;
      if (height / width > aspectRatio) {
        height = width * aspectRatio;
      } else {
        width = height / aspectRatio;
      }

      return { width: Math.floor(width), height: Math.floor(height) };
    };

    const handleResize = () => {
      if (isMounted) {
        const newDimensions = calculateDimensions();
        setDimensions(newDimensions);

        if (pageFlipRef.current && isInitializedRef.current) {
          pageFlipRef.current.updateDimensions(
            newDimensions.width,
            newDimensions.height,
          );
        }
      }
    };

    preloadImages();
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ✅ Init PageFlip (ADDED error handling & page tracking - NO SIZE CHANGES)
  useEffect(() => {
    if (!loaded || !bookRef.current || isInitializedRef.current) return;

    // Initialize audio with manufacturing-grade error handling
    try {
      audioRef.current = new Audio(pageFlipSound);
      audioRef.current.volume = 0.4;
      audioRef.current.preload = "auto";
    } catch (error) {
      console.warn("Audio not supported, continuing without sound");
      setIsAudioEnabled(false);
    }

    const bookElement = bookRef.current;
    const cloneContainer = document.createElement("div");
    cloneContainer.className = bookElement.className;
    cloneContainer.style.cssText = window.getComputedStyle(bookElement).cssText;

    const pages = bookElement.querySelectorAll(".page");
    pages.forEach((page) => {
      const clone = page.cloneNode(true);
      clone.style.cssText = window.getComputedStyle(page).cssText;
      cloneContainer.appendChild(clone);
    });

    bookElement.style.display = "none";
    bookElement.parentNode.insertBefore(
      cloneContainer,
      bookElement.nextSibling,
    );

    // EXACT SAME PageFlip configuration - NO SIZE CHANGES
    pageFlipRef.current = new PageFlip(cloneContainer, {
      width: dimensions.width,
      height: dimensions.height,
      size: "stretch",
      showCover: true,
      maxShadowOpacity: 0.6,
      swipeDistance: 30,
      useMouseEvents: true,
      mobileScrollSupport: false,
      drawShadow: true,
      flippingTime: 600,
      disableFlipByClick: false,
    });

    pageFlipRef.current.loadFromHTML(cloneContainer.querySelectorAll(".page"));

    // IMPROVED: Better flip handler with page tracking
    let flipTimeout;
    const handleFlip = () => {
      clearTimeout(flipTimeout);
      flipTimeout = setTimeout(() => {
        // Update current page number
        if (pageFlipRef.current) {
          const page = pageFlipRef.current.getCurrentPageIndex();
          setCurrentPage(page + 1);
        }

        // Play sound only if enabled
        if (isAudioEnabled && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch((e) => {
            console.log("Audio play failed:", e);
            setIsAudioEnabled(false);
          });
        }
      }, 50);
    };

    pageFlipRef.current.on("flip", handleFlip);
    isInitializedRef.current = true;

    return () => {
      clearTimeout(flipTimeout);
      if (pageFlipRef.current) {
        pageFlipRef.current.off("flip", handleFlip);
        pageFlipRef.current.destroy();
        isInitializedRef.current = false;
      }

      if (cloneContainer && cloneContainer.parentNode) {
        cloneContainer.parentNode.removeChild(cloneContainer);
      }

      if (bookElement) {
        bookElement.style.display = "";
      }
    };
  }, [loaded, dimensions, isAudioEnabled]);

  // NEW: Manufacturing-friendly keyboard navigation (optional feature)
  useEffect(() => {
    if (!loaded) return;

    const handleKeyPress = (e) => {
      if (e.key === "ArrowLeft" && pageFlipRef.current) {
        pageFlipRef.current.flipPrev();
      } else if (e.key === "ArrowRight" && pageFlipRef.current) {
        pageFlipRef.current.flipNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [loaded]);

  // NEW: Touch swipe optimization for industrial tablets (NO SIZE CHANGE)
  useEffect(() => {
    if (!loaded || !bookRef.current) return;

    let touchStartX = 0;
    let touchEndX = 0;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchEndX - touchStartX;

      if (Math.abs(swipeDistance) > 50 && pageFlipRef.current) {
        if (swipeDistance > 0) {
          pageFlipRef.current.flipPrev();
        } else {
          pageFlipRef.current.flipNext();
        }
      }
    };

    const bookElement = bookRef.current;
    bookElement.addEventListener("touchstart", handleTouchStart);
    bookElement.addEventListener("touchend", handleTouchEnd);

    return () => {
      bookElement.removeEventListener("touchstart", handleTouchStart);
      bookElement.removeEventListener("touchend", handleTouchEnd);
    };
  }, [loaded]);

  // ✅ PDF Download function using your existing PDF file
  const downloadPDF = () => {
    if (!catalogPDF) {
      console.error("PDF file not found");
      alert("Catalog PDF not available");
      return;
    }

    setIsDownloading(true);

    try {
      // Create a link element to trigger download
      const link = document.createElement("a");
      link.href = catalogPDF;
      link.download = `HGP-TOOLS-CATELOG-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Success message
      setTimeout(() => {
        setIsDownloading(false);
      }, 500);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download PDF. Please try again.");
      setIsDownloading(false);
    }
  };

  // ✅ Render with IMPROVED accessibility & professional features - SAME SIZE
  return (
    <div className="w-full bg-white flex items-center justify-center p-4">
      {/* Professional loading indicator (NO SIZE AFFECT) */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600">Loading catalog...</p>
          </div>
        </div>
      )}

      {/* Page counter for manufacturing environment (EXTERNAL - NO SIZE AFFECT) */}
      {loaded && (
        <div className="absolute top-2 right-4 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          Page {currentPage} of {images.length}
        </div>
      )}

      {/* Audio toggle for professional settings (EXTERNAL - NO SIZE AFFECT) */}
      {loaded && (
        <button
          onClick={() => {
            setIsAudioEnabled(!isAudioEnabled);
            if (audioRef.current) {
              audioRef.current.muted = !isAudioEnabled;
            }
          }}
          className="absolute top-2 left-4 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded hover:bg-opacity-80"
          aria-label={isAudioEnabled ? "Disable sound" : "Enable sound"}
        >
          {isAudioEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
        </button>
      )}

      {/* ✅ PDF DOWNLOAD BUTTON - NEW */}
      {loaded && (
        <button
          onClick={downloadPDF}
          disabled={isDownloading}
          className="absolute top-21 right-20 bg-blue-800 hover:bg-blue-700 font-semibold text-white text-xs px-3 py-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed z-50"
          style={{ right: "100px" }}
          aria-label="Download catalog PDF"
        >
          {isDownloading ? (
            <>
              <span className="inline-block animate-spin mr-1">⏳</span>
              Downloading...
            </>
          ) : (
            <>📄 Download PDF</>
          )}
        </button>
      )}

      {/* Navigation buttons for industrial use (EXTERNAL - NO SIZE AFFECT) */}
      {loaded && (
        <>
          <button
            onClick={() => pageFlipRef.current?.flipPrev()}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full hover:bg-opacity-75 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Previous page"
          >
            ←
          </button>
          <button
            onClick={() => pageFlipRef.current?.flipNext()}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full hover:bg-opacity-75 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Next page"
          >
            →
          </button>
        </>
      )}

      {/* EXACT SAME flipbook structure - NO SIZE CHANGES */}
      <div
        ref={bookRef}
        className="flipbook"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className="page bg-white"
            style={{
              width: "100%",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <img
              src={img}
              className="w-full h-full object-contain"
              draggable={false}
              alt={`Catalog page ${i + 1}`}
              style={{
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserDrag: "none",
              }}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
