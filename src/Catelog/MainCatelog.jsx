import React, { useEffect, useRef, useState, Suspense } from "react";
import { PageFlip } from "page-flip";
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Volume2, VolumeX, Search, Filter, Calendar, BookOpen, Moon, Sun } from "lucide-react";
import pageFlipSound from "../assets/audio.mp3";
import cate1Img from "../assets/cate-1.png";
import cate2Img from "../assets/cate-2.png";
import cate3Img from "../assets/cate-3.png";
import cate44Img from "../assets/cate-44.png";
import { Link } from "react-router-dom";

// Sample catalog data
const catalogs = [
    {
        id: 1,
        title: "Automotive industry 2026",
        category: "Automotive",
        pages: [cate1Img, cate2Img],
        cover: cate1Img,
        description: "Engine and transmission components",
        date: "March 2024",
        pagesCount: 2,
        tags: ["New", "Trending"]
    },
    {
        id: 2,
        title: "Railway industries",
        category: "Railway",
        pages: [cate2Img, cate3Img],
        cover: cate2Img,
        description: "Solution for rolling stock infrastructure",
        date: "June 2024",
        pagesCount: 2,
        tags: ["Beach", "Essentials"]
    }
];

// FlipBook Component (Dark Theme)
const FlipBook = React.memo(({ images, onClose }) => {
    const bookRef = useRef(null);
    const pageFlipRef = useRef(null);
    const audioRef = useRef(null);
    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 600, height: 800 });

    useEffect(() => {
        const calculateDimensions = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let width = Math.min(600, viewportWidth * 0.8);
            let height = Math.min(800, viewportHeight * 0.8);

            const aspectRatio = 800 / 600;
            if (height > width * aspectRatio) {
                height = width * aspectRatio;
            } else {
                width = height / aspectRatio;
            }

            return { width, height };
        };

        setDimensions(calculateDimensions());

        const handleResize = () => {
            if (!isFullscreen) {
                setDimensions(calculateDimensions());
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isFullscreen]);

    useEffect(() => {
        if (!bookRef.current) return;

        audioRef.current = new Audio(pageFlipSound);
        audioRef.current.volume = 0.3;
        audioRef.current.preload = "auto";

        pageFlipRef.current = new PageFlip(bookRef.current, {
            width: dimensions.width,
            height: dimensions.height,
            size: "stretch",
            showCover: true,
            maxShadowOpacity: 0.5,
            swipeDistance: 30,
            useMouseEvents: true,
            mobileScrollSupport: false,
            flippingTime: 600,
        });

        pageFlipRef.current.loadFromHTML(bookRef.current.querySelectorAll(".page"));

        pageFlipRef.current.on("flip", () => {
            if (!isMuted && audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => { });
            }
            setCurrentPage(pageFlipRef.current.getCurrentPageIndex());
        });

        pageFlipRef.current.on("changeState", (state) => {
            if (state === "read") {
                setCurrentPage(pageFlipRef.current.getCurrentPageIndex());
            }
        });

        return () => {
            if (pageFlipRef.current) {
                pageFlipRef.current.destroy();
            }
        };
    }, [dimensions, isMuted]);

    useEffect(() => {
        if (pageFlipRef.current) {
            pageFlipRef.current.updateDimensions(dimensions.width, dimensions.height);
        }
    }, [dimensions]);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
            setDimensions({
                width: window.innerWidth * 0.9,
                height: window.innerHeight * 0.9,
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            setDimensions({
                width: Math.min(600, viewportWidth * 0.8),
                height: Math.min(800, viewportHeight * 0.8),
            });
        }
        setIsFullscreen(!isFullscreen);
    };

    const goToPage = (index) => {
        if (pageFlipRef.current) {
            pageFlipRef.current.flip(index);
            setCurrentPage(index);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div
                ref={containerRef}
                className={`relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700/50 transition-all duration-300 ${isFullscreen ? 'w-[95vw] h-[95vh]' : ''
                    }`}
                style={{
                    width: isFullscreen ? '95vw' : `${dimensions.width + 80}px`,
                    maxWidth: isFullscreen ? 'none' : '90vw',
                    height: isFullscreen ? '95vh' : 'auto',
                    maxHeight: isFullscreen ? 'none' : '90vh',
                }}
            >
                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-gray-900/90 to-transparent z-10 p-4 flex justify-between items-center backdrop-blur-sm">
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-800/70 hover:bg-red-500/30 rounded-lg border border-gray-700/50 transition-all group"
                    >
                        <X className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform" />
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 bg-gray-800/70 hover:bg-blue-500/30 rounded-lg border border-gray-700/50 transition-all group"
                        >
                            {isMuted ? (
                                <VolumeX className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform" />
                            ) : (
                                <Volume2 className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform" />
                            )}
                        </button>

                        <button
                            onClick={toggleFullscreen}
                            className="p-2 bg-gray-800/70 hover:bg-purple-500/30 rounded-lg border border-gray-700/50 transition-all group"
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform" />
                            ) : (
                                <Maximize2 className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Flipbook Container */}
                <div className="flex flex-col items-center justify-center min-h-screen p-8">
                    <div className="flex items-center gap-6 w-full max-w-6xl">
                        {/* Navigation - Previous */}
                        <button
                            onClick={() => goToPage(Math.max(0, currentPage - 1))}
                            disabled={currentPage === 0}
                            className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/70 border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform" />
                        </button>

                        {/* Flipbook */}
                        <div className="flex-1 flex flex-col items-center">
                            <div
                                ref={bookRef}
                                className="flipbook"
                                style={{
                                    width: dimensions.width,
                                    height: dimensions.height,
                                }}
                            >
                                {images.map((img, i) => (
                                    <div key={i} className="page bg-gray-900">
                                        <img
                                            src={img}
                                            className="w-full h-full object-contain"
                                            draggable={false}
                                            alt={`Page ${i + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Page Indicator */}
                            <div className="mt-6 flex items-center gap-4">
                                <div className="flex gap-2">
                                    {images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => goToPage(i)}
                                            className={`w-3 h-3 rounded-full transition-all ${i === currentPage
                                                ? 'bg-blue-500 scale-125'
                                                : 'bg-gray-600 hover:bg-gray-500'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-gray-300 text-sm font-medium">
                                    Page {currentPage + 1} of {images.length}
                                </span>
                            </div>
                        </div>

                        {/* Navigation - Next */}
                        <button
                            onClick={() => goToPage(Math.min(images.length - 1, currentPage + 1))}
                            disabled={currentPage === images.length - 1}
                            className="p-3 rounded-full bg-gray-800/50 hover:bg-gray-700/70 border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-white group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-transparent p-4 border-t border-gray-800/50">
                    <div className="flex justify-between items-center text-gray-400 text-sm">
                        <span>Drag page corners to flip</span>
                        <span>Click navigation buttons or page dots</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

FlipBook.displayName = 'FlipBook';

// Catalog Gallery Component (Dark Theme)
export default function CatalogGallery() {
    const [selectedCatalog, setSelectedCatalog] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [isDarkTheme, setIsDarkTheme] = useState(true);

    // Get unique categories
    const categories = ["all", ...new Set(catalogs.map(cat => cat.category))];

    // Filter and sort catalogs
    const filteredCatalogs = catalogs
        .filter(catalog => {
            const matchesSearch = catalog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                catalog.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || catalog.category === selectedCategory;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === "newest") {
                return new Date(b.date) - new Date(a.date);
            } else if (sortBy === "pages") {
                return b.pagesCount - a.pagesCount;
            }
            return 0;
        });

    return (
        <div className={`min-h-screen transition-all duration-300 ${isDarkTheme ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="flex justify-center items-center gap-4 mb-6">
                            <BookOpen className="w-12 h-12 text-blue-400" />
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Digital Catalog Collection
                            </h1>
                        </div>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Browse our interactive digital catalogs. Click any cover to explore the full experience.
                        </p>


                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className={`rounded-xl shadow-xl p-6 mb-8 border ${isDarkTheme ? 'bg-gray-800/50 border-gray-700/50' : 'bg-white border-gray-200'}`}>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        {/* Search */}
                        <div className="w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search catalogs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full md:w-80 pl-10 pr-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDarkTheme
                                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-gray-400" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className={`px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDarkTheme
                                        ? 'bg-gray-800 border-gray-700 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-400" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={`px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all ${isDarkTheme
                                        ? 'bg-gray-800 border-gray-700 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="pages">Most Pages</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCatalogs.map((catalog) => (
                        <div
                            key={catalog.id}
                            className={`group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-pointer border 
              onClick={() => setSelectedCatalog(catalog)}
            `}>
                            {/* Catalog Cover */}
                            <div className="relative overflow-hidden">
                                <img
                                    src={catalog.cover}
                                    alt={catalog.title}
                                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />





                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                    <span className={`font-semibold text-sm ${isDarkTheme ? 'text-blue-300' : 'text-blue-600'
                                        }`}>
                                        Click to explore →
                                    </span>
                                </div>
                            </div>

                            {/* Catalog Info */}
                            <div className="p-6">
                                <h3 className={`text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors   text-gray-900'
                                    }`}>
                                    {catalog.title}
                                </h3>
                                <p className={`text-sm mb-4 line-clamp-2  text-gray-600'
                                    }`}>
                                    {catalog.description}
                                </p>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-700/30">
                                    <div className={`flex items-center gap-1 text-sm  text-gray-500'
                                        }`}>
                                        <Calendar className="w-4 h-4" />
                                        <span>{catalog.date}</span>
                                    </div>
                                    <button className={`px-4 py-2 rounded-lg font-semibold transition-all
                                         bg-blue-800 text-white hover:shadow-lg hover:shadow-blue-500/25
                                       
                                        }`}>
                                        <Link to={`/catelog/${catalog.id}`}> View Catalog</Link>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredCatalogs.length === 0 && (
                    <div className={`text-center py-16 rounded-2xl border ${isDarkTheme
                        ? 'bg-gray-800/30 border-gray-700/50'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        <div className="text-gray-400 text-6xl mb-4">📚</div>
                        <h3 className={`text-xl font-semibold mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            No catalogs found
                        </h3>
                        <p className={`${isDarkTheme ? 'text-gray-500' : 'text-gray-600'}`}>
                            Try adjusting your search or filter criteria
                        </p>
                    </div>
                )}

                {/* Stats */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl p-6 shadow-xl border border-gray-700/50">
                        <div className="text-3xl font-bold mb-2">{catalogs.length}</div>
                        <div className="text-gray-400">Total Catalogs</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 text-white rounded-xl p-6 shadow-xl border border-blue-800/30">
                        <div className="text-3xl font-bold mb-2">{categories.length - 1}</div>
                        <div className="text-blue-300">Categories</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 text-white rounded-xl p-6 shadow-xl border border-purple-800/30">
                        <div className="text-3xl font-bold mb-2">
                            {catalogs.reduce((sum, cat) => sum + cat.pagesCount, 0)}
                        </div>
                        <div className="text-purple-300">Total Pages</div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 text-white rounded-xl p-6 shadow-xl border border-pink-800/30">
                        <div className="text-3xl font-bold mb-2">{new Date().getFullYear()}</div>
                        <div className="text-pink-300">Latest Collection</div>
                    </div>
                </div>


            </div>



            {/* FlipBook Modal */}
            {selectedCatalog && (
                <Suspense fallback={
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center">
                        <div className="text-white text-xl">Loading catalog...</div>
                    </div>
                }>
                    <FlipBook
                        images={selectedCatalog.pages}
                        onClose={() => setSelectedCatalog(null)}
                    />
                </Suspense>
            )}
        </div>
    );
}