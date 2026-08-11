import React, { useState, useEffect, useRef } from "react";
import { FaChevronRight, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import Logo from "../../assets/logo34-removebg-preview.png";
import { RiArrowDropDownLine, RiMenu3Line } from "react-icons/ri";
import Ring from "../../assets/ring.png";
import Shafts from "../../assets/shaft.png";
import Tools from "../../assets/tools.png";
import PressTools from "../../assets/power-tool.png";
import FixtureImg from "../../assets/fixture.png";
import Flanges from "../../assets/flanges.png";
import EdmImg from "../../assets/edm.png";
import socialResponsibilityImg from "../../assets/hands-with-planet-earth-earth.jpg";
import railwayImg from "../../assets/output-onlinetools.png";
import ManImg from "../../assets/man-safety-equipment-work.jpg";
import { CircleUserRound, LogIn, User } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeServiceImageIndex, setActiveServiceImageIndex] = useState(0);
  const [activeCompanyImageIndex, setActiveCompanyImageIndex] = useState(0);
  const [activeApplicationImageIndex, setActiveApplicationImageIndex] =
    useState(0);

  // Mobile dropdown states
  const [openMobileDropdown, setOpenMobileDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setOpenMobileDropdown(null);
  };

  const toggleMobileDropdown = (dropdownName) => {
    setOpenMobileDropdown(
      openMobileDropdown === dropdownName ? null : dropdownName,
    );
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (window.innerWidth < 1024) {
          setOpenMobileDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false);
        setOpenMobileDropdown(null);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Define segments data (Our Services)
  const segments = [
    {
      title: "Sheet metal fabrication",
      path: "/capabilities/sheet-metal",
      desc: "Heavy-duty infrastructure tools",
      img: "https://images.prismic.io/geomiqstaging/Zo1gSR5LeNNTw9A__sheetmetalshearing.jpg?auto=format,compress",
    },
    {
      title: "CNC",
      path: "/capabilities/advance-cnc",
      desc: "CNC precision parts",
      img: "https://5.imimg.com/data5/KE/IH/MY-983344/cnc-turning-machines.png",
      subparts: [
        {
          name: "CNC Milling",
          img: "https://mantool.com/wp-content/uploads/2020/01/3-Axis-CNC-machining3.jpg",
          path: "/capabilities/advance-cnc/cnc-miling",
        },
        {
          name: "CNC Turning",
          img: "https://5.imimg.com/data5/KE/IH/MY-983344/cnc-turning-machines.png",
          path: "/capabilities/advance-cnc/turning",
        },
        {
          name: "EDM Machining",
          img: EdmImg,
          path: "/capabilities/advance-cnc/edm-services",
        },
      ],
    },
    {
      title: "Rapid Prototype",
      path: "/capabilities/rapid-prototyping",
      desc: "High-precision flight components",
      img: "https://hlhrapid.com/wp-content/uploads/2023/11/rapid-prototyping-cost-breakdown.jpg",
    },
    {
      title: "Tools",
      path: "",
      desc: "Tools precision parts",
      img: "https://5.imimg.com/data5/KE/IH/MY-983344/cnc-turning-machines.png",
      subparts: [
        {
          name: "Press Tools",
          img: PressTools,
          path: "/tools/press-tools",
        },
        {
          name: "Jigs and Fixture",
          img: FixtureImg,
          path: "/tools/fixture",
        },
      ],
    },
  ];

  // Define company data (Our Company)
  const company = [
    {
      title: "About HGP",
      path: "/about-us",
      desc: "Advanced CNC machining, fabrication, and assembly solutions",
      img: "https://www.shutterstock.com/image-photo/cnc-lathe-machining-center-control-600nw-2669966711.jpg",
    },
    {
      title: "Manufacturing Capabilities",
      path: "/capabilities",
      desc: "Advanced CNC machining, fabrication, and assembly solutions",
      img: "https://precisionautomationinc.com/wp-content/uploads/2023/01/CNC-Machining-2-1.jpg",
    },
    {
      title: "Certifications",
      path: "/certifications",
      desc: "Commitment to excellence through ISO and industry-standard quality compliance",
      img: "https://hsfgroup.net/wp-content/uploads/2018/02/certified-800x600_63288526.jpg",
    },
    {
      title: "Media Gallery",
      path: "/media-gallery",
      desc: "Industrial Visual Portfolio of machinery in hgp tools",
      img: "https://www.shutterstock.com/image-photo/cnc-lathe-machining-center-control-600nw-2669966711.jpg",
    },
    {
      title: "Social Responsibility",
      path: "/social-responsibility",
      desc: "Driving sustainable growth and community engagement initiatives",
      img: socialResponsibilityImg,
    },
  ];

  // Define segments data (Our Application)
  const application = [
    {
      title: "Aerospace Industries",
      path: "/application-industries/aerospace",
      desc: "Precision-engineered components and CNC machining",
      img: "https://www.tstar.com/hubfs/blog/blog-hero-aerospace-industry-overview.jpg",
    },
    {
      title: "Railway Industries",
      path: "/application-industries/railway",
      desc: "Robust manufacturing solutions for rolling stock, infrastructure, and high-durability track components.",
      img: "https://cdn.shopify.com/s/files/1/0891/0461/3680/files/indian-rail-coach-manufacturing-scaled_500x.jpg?v=1727508704",
    },
    {
      title: "Electrical & Electronics Industries",
      path: "/application-industries/electronics",
      desc: "High-conductivity components and micro-machined parts for power distribution and consumer electronics.",
      img: "https://www.rapiddirect.com/wp-content/uploads/2022/07/image-2.png",
    },
    {
      title: "Medical Industries",
      path: "/application-industries/medical",
      desc: "Ultra-precise fabrication of surgical instruments, implants, and diagnostic equipment housing.",
      img: "https://images.sw.cdn.siemens.com/siemens-disw-assets/public/4dQbS9WCTFPT8g25MICE99/en-US/hero-opex-image11-2560x1440-72dpi.jpg?auto=format,compress&w=1920&q=60",
    },
    {
      title: "Automotive Industry",
      path: "/automotive",
      desc: "Engine and transmission components",
      img: "https://iqmanufacturing.com/wp-content/uploads/2022/04/Automotive-2.jpg",
      subparts: [
        {
          name: "Machined Ring",
          img: Ring,
          path: "/tools/machined-ring",
        },
        {
          name: "Flanges",
          img: Flanges,
          path: "/tools/flangs",
        },
        {
          name: "Bolts",
          img: Tools,
          path: "/tools/bolts",
        },
        {
          name: "Automative Shafts",
          img: Shafts,
          path: "/tools/shafts",
        },
      ],
    },
  ];

  // Mobile Dropdown Component for better organization
  const MobileDropdown = ({ title, items, type = "simple" }) => (
    <div className="mb-4">
      {items.map((item, index) => (
        <Link
          key={index}
          to={item.path}
          className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border-b border-gray-100 last:border-b-0"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="font-medium text-gray-900">{item.title}</div>
          <div className="text-sm text-gray-500 mt-1">{item.desc}</div>
        </Link>
      ))}
    </div>
  );

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className="w-full shadow-sm bg-white tracking-wide relative z-[100] border-b border-gray-100">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between gap-8 lg:gap-16 xl:gap-24 py-3">
            {/* Logo */}
            <Link
              to="/"
              className="hover:scale-105 transition-transform flex-shrink-0"
            >
              <img
                src={Logo}
                alt="Logo"
                className="h-16 sm:h-20 w-auto object-cover"
              />
            </Link>

            {/* Desktop Navigation - Fixed for all screen sizes */}
            <nav className="hidden lg:block">
              <ul className="flex items-center gap-x-4 xl:gap-x-6 2xl:gap-x-10">
                <li>
                  <Link
                    to="/"
                    className="text-slate-700 hover:text-blue-700 font-semibold py-6 block whitespace-nowrap text-sm xl:text-base"
                  >
                    Home
                  </Link>
                </li>

                {/* ===== COMPANY MEGA DROPDOWN - FIXED ===== */}
                <li className="group relative">
                  <button className="text-slate-700 font-semibold flex items-center gap-1 py-6 hover:text-blue-700 transition duration-700 whitespace-nowrap text-sm xl:text-base">
                    Our Company
                    <RiArrowDropDownLine className="text-xl xl:text-2xl" />
                  </button>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[85vw] md:w-[75vw] lg:w-[68vw] xl:w-[60vw] 2xl:w-[55vw] min-w-[320px] max-w-[1400px] bg-white border-t border-gray-100 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-b-2xl invisible opacity-0 translate-y-6 scale-[0.98] group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-500 ease-out pointer-events-none group-hover:pointer-events-auto z-[200]">
                    <div className="flex min-h-[440px]">
                      {/* LEFT SIDE */}
                      <div className="w-[45%] bg-gradient-to-br from-blue-50 to-white p-6 lg:p-8 xl:p-12 border-r border-gray-100">
                        <p className="text-blue-700 text-xs tracking-[3px] mb-8 font-bold uppercase">
                          Our Company
                        </p>
                        <ul className="space-y-3 lg:space-y-4">
                          {company.map((item, i) => (
                            <li
                              key={i}
                              onMouseEnter={() => setActiveCompanyImageIndex(i)}
                            >
                              <Link
                                to={item.path}
                                className={`group/link flex justify-between items-center p-3 lg:p-4 rounded-xl transition-all duration-300 ${
                                  activeCompanyImageIndex === i
                                    ? "bg-white shadow-md"
                                    : "hover:bg-white hover:shadow-md"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-base lg:text-lg xl:text-xl font-bold transition-all truncate ${
                                      activeCompanyImageIndex === i
                                        ? "text-blue-700 translate-x-1"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {item.title}
                                  </p>
                                  <p className="text-xs lg:text-sm text-gray-500 mt-1 line-clamp-2">
                                    {item.desc}
                                  </p>
                                </div>
                                <FaChevronRight
                                  className={`text-blue-700 transition-all duration-300 flex-shrink-0 ml-2 ${
                                    activeCompanyImageIndex === i
                                      ? "opacity-100 translate-x-0"
                                      : "opacity-0 -translate-x-3"
                                  }`}
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* RIGHT SIDE */}
                      <div className="w-[48%] p-6 lg:p-8 xl:p-12 items-center justify-center">
                        <div className="relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl">
                          <img
                            key={activeCompanyImageIndex}
                            src={company[activeCompanyImageIndex].img}
                            alt={company[activeCompanyImageIndex].title}
                            className="rounded-2xl shadow-2xl object-cover w-full h-full"
                          />
                          <div className="absolute inset-0 bg-black/20" />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>

                {/* ===== SERVICES MEGA DROPDOWN - FIXED ===== */}
                <li className="group relative">
                  <button className="text-slate-700 font-semibold flex items-center gap-1 py-6 hover:text-blue-700 transition whitespace-nowrap text-sm xl:text-base">
                    Our Services
                    <RiArrowDropDownLine className="text-xl xl:text-2xl" />
                  </button>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[85vw] md:w-[75vw] lg:w-[68vw] xl:w-[60vw] 2xl:w-[55vw] min-w-[320px] max-w-[1400px] bg-white border-t border-gray-100 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-b-2xl invisible opacity-0 translate-y-6 scale-[0.98] group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-500 ease-out pointer-events-none group-hover:pointer-events-auto z-[200]">
                    <div className="flex min-h-[440px]">
                      <div className="w-[45%] bg-gradient-to-br from-blue-50 to-white p-6 lg:p-8 xl:p-12 border-r border-gray-100">
                        <p className="text-blue-700 text-xs tracking-[3px] mb-8 font-bold uppercase">
                          What We Do
                        </p>
                        <ul className="space-y-3 lg:space-y-4">
                          {segments.map((s, i) => (
                            <li
                              key={i}
                              onMouseEnter={() => setActiveServiceImageIndex(i)}
                            >
                              <Link
                                to={s.path}
                                className={`group/link flex justify-between items-center p-3 lg:p-4 rounded-xl transition-all duration-300 ${
                                  activeServiceImageIndex === i
                                    ? "bg-white shadow-md"
                                    : "hover:bg-white hover:shadow-md"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-base lg:text-lg xl:text-xl font-bold transition-all truncate ${
                                      activeServiceImageIndex === i
                                        ? "text-blue-700 translate-x-1"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {s.title}
                                  </p>
                                  <p className="text-xs lg:text-sm text-gray-500 mt-1 line-clamp-2">
                                    {s.desc}
                                  </p>
                                </div>
                                <FaChevronRight
                                  className={`text-blue-700 transition-all duration-300 flex-shrink-0 ml-2 ${
                                    activeServiceImageIndex === i
                                      ? "opacity-100 translate-x-0"
                                      : "opacity-0 -translate-x-3"
                                  }`}
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="w-[48%] p-6 lg:p-8 xl:p-12 items-center justify-center">
                        {segments[activeServiceImageIndex]?.subparts ? (
                          <div className="w-full">
                            <div className="grid grid-cols-2 gap-4 lg:gap-6 xl:gap-10">
                              {segments[activeServiceImageIndex].subparts.map(
                                (sub, idx) => (
                                  <div key={idx} className="group">
                                    <Link to={sub.path} className="block">
                                      <div className="rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/30 transition-all duration-500 group-hover:from-blue-600/60 group-hover:to-purple-600/60">
                                        <div className="relative rounded-2xl bg-white overflow-hidden shadow-md transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-2xl">
                                          <div className="relative h-44 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                            <img
                                              src={sub.img}
                                              alt={sub.name}
                                              className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                                            />
                                          </div>
                                          <div className="p-4 lg:p-6">
                                            <p className="text-base lg:text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors duration-300">
                                              {sub.name}
                                            </p>
                                            <div className="mt-2 lg:mt-3 h-[2px] w-8 lg:w-10 bg-blue-600 rounded-full group-hover:w-full transition-all duration-500" />
                                          </div>
                                        </div>
                                      </div>
                                    </Link>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl">
                            <img
                              key={activeServiceImageIndex}
                              src={segments[activeServiceImageIndex].img}
                              alt={segments[activeServiceImageIndex].title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                {/* ===== APPLICATION MEGA DROPDOWN - FIXED ===== */}
                <li className="group relative">
                  <button className="text-slate-700 font-semibold flex items-center gap-1 py-6 hover:text-blue-700 transition whitespace-nowrap text-sm xl:text-base">
                    Application Industries
                    <RiArrowDropDownLine className="text-xl xl:text-2xl" />
                  </button>

                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[85vw] md:w-[75vw] lg:w-[68vw] xl:w-[60vw] 2xl:w-[55vw] min-w-[320px] max-w-[1400px] bg-white border-t border-gray-100 shadow-[0_25px_60px_rgba(0,0,0,0.15)] rounded-b-2xl invisible opacity-0 translate-y-6 scale-[0.98] group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-500 ease-out pointer-events-none group-hover:pointer-events-auto z-[200]">
                    <div className="flex min-h-[440px]">
                      <div className="w-[45%] bg-gradient-to-br from-blue-50 to-white p-6 lg:p-8 xl:p-12 border-r border-gray-100">
                        <p className="text-blue-700 text-xs tracking-[3px] mb-8 font-bold uppercase">
                          Application Industries
                        </p>
                        <ul className="space-y-3 lg:space-y-4">
                          {application.map((item, i) => (
                            <li
                              key={i}
                              onMouseEnter={() =>
                                setActiveApplicationImageIndex(i)
                              }
                            >
                              <Link
                                to={item.path}
                                className={`group/link flex justify-between items-center p-3 lg:p-4 rounded-xl transition-all duration-300 ${
                                  activeApplicationImageIndex === i
                                    ? "bg-white shadow-md"
                                    : "hover:bg-white hover:shadow-md"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-base lg:text-lg xl:text-xl font-bold transition-all truncate ${
                                      activeApplicationImageIndex === i
                                        ? "text-blue-700 translate-x-1"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {item.title}
                                  </p>
                                  <p className="text-xs lg:text-sm text-gray-500 mt-1 line-clamp-2">
                                    {item.desc}
                                  </p>
                                </div>
                                <FaChevronRight
                                  className={`text-blue-700 transition-all duration-300 flex-shrink-0 ml-2 ${
                                    activeApplicationImageIndex === i
                                      ? "opacity-100 translate-x-0"
                                      : "opacity-0 -translate-x-3"
                                  }`}
                                />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="w-[48%] p-6 lg:p-8 xl:p-12 items-center justify-center">
                        {application[activeApplicationImageIndex]?.subparts ? (
                          <div className="w-full">
                            <div className="grid grid-cols-2 gap-4 lg:gap-6 xl:gap-10">
                              {application[
                                activeApplicationImageIndex
                              ].subparts.map((sub, idx) => (
                                <div key={idx} className="group">
                                  <Link to={sub.path} className="block">
                                    <div className="rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-500/30 transition-all duration-500 group-hover:from-blue-600/60 group-hover:to-purple-600/60">
                                      <div className="relative rounded-2xl bg-white overflow-hidden shadow-md transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-2xl">
                                        <div className="relative h-44 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                                          <img
                                            src={sub.img}
                                            alt={sub.name}
                                            className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                                          />
                                        </div>
                                        <div className="p-4 lg:p-6">
                                          <p className="text-base lg:text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors duration-300">
                                            {sub.name}
                                          </p>
                                          <div className="mt-2 lg:mt-3 h-[2px] w-8 lg:w-10 bg-blue-600 rounded-full group-hover:w-full transition-all duration-500" />
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl">
                            <img
                              key={activeApplicationImageIndex}
                              src={application[activeApplicationImageIndex].img}
                              alt={
                                application[activeApplicationImageIndex].title
                              }
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>

                {/* Contact */}
                <li>
                  <Link
                    to="/contact-us"
                    className="text-slate-700 hover:text-blue-700 font-semibold py-6 block whitespace-nowrap text-sm xl:text-base"
                  >
                    Contact
                  </Link>
                </li>

                {/* Blogs */}
                <li>
                  <Link
                    to="/blogs"
                    className="text-slate-700 hover:text-blue-700 font-semibold py-6 block whitespace-nowrap text-sm xl:text-base"
                  >
                    Blogs
                  </Link>
                </li>

                {/* Tool Marketplace Button */}
                <li>
                  <Link
                    to="/marketplace"
                    className="bg-blue-800 hover:bg-blue-900 text-white px-4 lg:px-6 py-2 lg:py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-blue-200 whitespace-nowrap text-sm xl:text-base"
                  >
                    <svg
                      xmlns="http://www.w3.org"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lg:w-[18px] lg:h-[18px]"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span className="hidden sm:inline">Marketplace</span>
                  </Link>
                </li>

                <div className="relative" ref={dropdownRef}>
                  {/* Profile Button */}
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full
                     border border-blue-100 bg-white
                     hover:bg-blue-50 hover:border-blue-200
                     transition-all duration-200 shadow-sm"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#1e3a8a]" />
                  </button>

                  {/* Dropdown */}
                  <div
                    className={`absolute right-0 mt-3 w-56 sm:w-64 origin-top-right transition-all duration-200 z-[200] ${
                      isOpen
                        ? "opacity-100 scale-100 visible"
                        : "opacity-0 scale-95 invisible"
                    }`}
                  >
                    <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                      <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-[#1e3a8a] to-blue-600 text-white">
                        <p className="text-sm font-semibold">Welcome</p>
                        <p className="text-xs opacity-80">
                          Access your account
                        </p>
                      </div>

                      <ul className="py-2">
                        <Link to="/login">
                          <li
                            onClick={closeDropdown}
                            className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 text-sm text-gray-700
                           hover:bg-blue-50 hover:text-[#1e3a8a]
                           cursor-pointer transition"
                          >
                            <LogIn className="w-4 h-4" />
                            Login
                          </li>
                        </Link>
                      </ul>
                    </div>
                  </div>
                </div>
              </ul>
            </nav>

            {/* Mobile Toggle Button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 text-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <FaTimes className="text-2xl" />
              ) : (
                <RiMenu3Line className="text-2xl" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 lg:hidden z-[99]"
            onClick={toggleMenu}
          />
        )}

        {/* Mobile Navigation */}
        <div
          ref={dropdownRef}
          className={`${
            isMenuOpen ? "translate-x-0" : "-translate-x-full"
          } fixed top-0 left-0 w-full max-w-sm h-full bg-white
          transition-transform duration-300 lg:hidden z-[100]
          overflow-y-auto shadow-2xl`}
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <Link to="/" onClick={() => setIsMenuOpen(false)}>
              <img src={Logo} alt="Logo" className="h-14 w-auto" />
            </Link>
            <button
              onClick={toggleMenu}
              className="p-2 text-slate-800"
              aria-label="Close menu"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>

          {/* Mobile Menu Items */}
          <div className="p-6">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-semibold rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
              </li>

              {/* Mobile Company Dropdown */}
              <li className="border-b border-gray-100">
                <button
                  onClick={() => toggleMobileDropdown("company")}
                  className="w-full flex justify-between items-center py-3 px-4 text-gray-700 hover:text-blue-700 font-semibold rounded-lg transition-colors"
                >
                  <span>Our Company</span>
                  <RiArrowDropDownLine
                    className={`text-2xl transition-transform ${
                      openMobileDropdown === "company" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openMobileDropdown === "company" && (
                  <div className="pl-4 pr-2 pb-4">
                    <MobileDropdown items={company} />
                  </div>
                )}
              </li>

              {/* Mobile Services Dropdown */}
              <li className="border-b border-gray-100">
                <button
                  onClick={() => toggleMobileDropdown("services")}
                  className="w-full flex justify-between items-center py-3 px-4 text-gray-700 hover:text-blue-700 font-semibold rounded-lg transition-colors"
                >
                  <span>Our Services</span>
                  <RiArrowDropDownLine
                    className={`text-2xl transition-transform ${
                      openMobileDropdown === "services" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openMobileDropdown === "services" && (
                  <div className="pl-4 pr-2 pb-4">
                    {segments.map((segment, index) => (
                      <div key={index} className="mb-4">
                        {segment.subparts ? (
                          <>
                            <Link
                              to={segment.path}
                              className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <div className="font-medium text-gray-900">
                                {segment.title}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {segment.desc}
                              </div>
                            </Link>
                            <div className="ml-4 mt-2 space-y-2">
                              {segment.subparts.map((sub, idx) => (
                                <Link
                                  key={idx}
                                  to={sub.path}
                                  className="block py-2 px-4 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          </>
                        ) : (
                          <Link
                            to={segment.path}
                            className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="font-medium text-gray-900">
                              {segment.title}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {segment.desc}
                            </div>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>

              {/* Mobile Application Dropdown */}
              <li className="border-b border-gray-100">
                <button
                  onClick={() => toggleMobileDropdown("application")}
                  className="w-full flex justify-between items-center py-3 px-4 text-gray-700 hover:text-blue-700 font-semibold rounded-lg transition-colors"
                >
                  <span>Application Industries</span>
                  <RiArrowDropDownLine
                    className={`text-2xl transition-transform ${
                      openMobileDropdown === "application" ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openMobileDropdown === "application" && (
                  <div className="pl-4 pr-2 pb-4">
                    {application.map((item, index) => (
                      <div key={index} className="mb-4">
                        {item.subparts ? (
                          <>
                            <Link
                              to={item.path}
                              className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              <div className="font-medium text-gray-900">
                                {item.title}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {item.desc}
                              </div>
                            </Link>
                            <div className="ml-4 mt-2 space-y-2">
                              {item.subparts.map((sub, idx) => (
                                <Link
                                  key={idx}
                                  to={sub.path}
                                  className="block py-2 px-4 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          </>
                        ) : (
                          <Link
                            to={item.path}
                            className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="font-medium text-gray-900">
                              {item.title}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {item.desc}
                            </div>
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>

              <li className="border-b border-gray-100">
                <Link
                  to="/contact-us"
                  className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-semibold rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
              </li>

              <li className="border-b border-gray-100">
                <Link
                  to="/blogs"
                  className="block py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-semibold rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Blogs
                </Link>
              </li>

              {/* Mobile Tool Marketplace Button */}
              <li className="mt-8">
                <Link
                  to="/marketplace"
                  className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all shadow-md w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                  Marketplace
                </Link>
              </li>

              {/* Mobile Login Button */}
              <li className="mt-4">
                <Link
                  to="/login"
                  className="border-2 border-blue-800 text-blue-800 hover:bg-blue-50 px-6 py-3.5 rounded-full font-bold flex items-center justify-center gap-2 transition-all w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
