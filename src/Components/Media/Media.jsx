import React, { useEffect, useState } from "react";
import {
  FaExpand,
  FaFilm,
  FaMicrochip,
  FaIndustry,
  FaArrowRight,
  FaVectorSquare,
  FaSearch,
  FaFilter,
  FaTools,
  FaCog,
  FaIndustry as FaIndustryIcon,
  FaHardHat,
} from "react-icons/fa";
import PowerPress from "../../assets/power-press-machine-1.png";
import PowerPress2 from "../../assets/power-press-2...png";
import CncMachine from "../../assets/cnc-machine.png";
import LatheImg from "../../assets/Lathe-Machines.png";
import EdmImg from "../../assets/edm.png";
import PressToolsImg from "../../assets/power-tool.png";
import FixtureImg from "../../assets/fixture.png";
import SurrfaceGrinderImg from "../../assets/surface-grinder.png";
import PressImg from "../../assets/hydrolic-machine.png";
import PressImg2 from "../../assets/presss-20ton.png";
import MillingImg from "../../assets/MITR-MACHINE.png";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";
import { GiCircularSaw } from "react-icons/gi";
import { Link } from "react-router-dom";

const Media = () => {
  const [filter, setFilter] = useState("all");
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const mediaItems = [
    {
      id: 1,
      category: "cnc",
      title: "CNC Machine",
      description: "High-precision computer numerical control machining",
      tag: "ISO 9001",
      icon: <FaCog />,
      image: CncMachine,
      specs: ["3-Axis", "±0.005mm", "Automated"],
    },
    {
      id: 2,
      category: "lathe",
      title: "Lathe Machine",
      description: "Precision turning and facing operations",
      tag: "ISO 9001",
      icon: <FaIndustryIcon />,
      image: LatheImg,
      specs: ["1500 RPM", "Dual Turret", "Live Tooling"],
    },
    {
      id: 3,
      category: "power-press",
      title: "Power Press",
      description: "Heavy-duty metal forming and stamping",
      tag: "24/7 Operations",
      icon: <FaHardHat />,
      image: PowerPress2,
      specs: ["50 Ton", "Auto Feed", "Safety Rated"],
    },
    {
      id: 4,
      category: "cnc",
      title: "EDM Machine",
      description: "Electrical discharge machining for complex shapes",
      tag: "High Precision",
      icon: <FaMicrochip />,
      image: EdmImg,
      specs: ["Wire EDM", "±0.005mm", "Titanium Ready"],
    },
    {
      id: 5,
      category: "cnc",
      title: "CNC Turning",
      description: "Automated precision turning centers",
      tag: "Automated",
      icon: <FaCog />,
      image:
        "https://5.imimg.com/data5/KE/IH/MY-983344/cnc-turning-machines.png",
      specs: ["Multi-Axis", "Bar Feed", "Chip Conveyor"],
    },
    {
      id: 6,
      category: "power-press",
      title: "Heavy Duty Press",
      description: "Large-scale industrial pressing operations",
      tag: "Large Scale",
      icon: <FaHardHat />,
      image: PowerPress,
      specs: ["30 Ton", "Deep Drawing", "Progressive"],
    },
    {
      id: 7,
      category: "press-tools",
      title: "Power Tools",
      description: "Industrial grade tooling solutions",
      tag: "Industrial Grade",
      icon: <FaTools />,
      image: PressToolsImg,
      specs: ["HSS Material", "Custom Dies", "Quick Change"],
    },
    {
      id: 8,
      category: "jigs & fixtures",
      title: "Jigs & Fixtures",
      description: "Custom built precision workholding",
      tag: "Custom Built",
      icon: <FaVectorSquare />,
      image: FixtureImg,
      specs: ["Modular", "Zero Point", "Quick Setup"],
    },
    {
      id: 9,
      category: "jigs & fixtures",
      title: "Precision Fixture",
      description: "Quality assured positioning systems",
      tag: "Quality Assured",
      icon: <FaVectorSquare />,
      image:
        "https://resources.cadimensions.com/hs-fs/hubfs/Imported_Blog_Media/Fixture-2-2.jpg",
      specs: ["Aluminum", "Vacuum Chuck", "Repeatable"],
    },
    {
      id: 10,
      category: "drill-machine",
      title: "Drill Machine",
      description: "Quality assured positioning systems",
      tag: "Quality Assured",
      icon: <FaVectorSquare />,
      image:
        "https://dyimg77.exportersindia.com/product_images/bc-full/2025/12/1532996/smtr-iiig-a-f-all-gear-radial-drilling-machine-1766839223-1004807.jpeg",
      specs: ["Aluminum", "Vacuum Chuck", "Repeatable"],
    },
    {
      id: 11,
      category: "grinder",
      title: "Surface Grinder",
      description: "Quality assured positioning systems",
      tag: "Quality Assured",
      icon: <FaVectorSquare />,
      image: SurrfaceGrinderImg,
      specs: ["Aluminum", "Vacuum Chuck", "Repeatable"],
    },
    {
      id: 12,
      category: "power-press",
      title: "Heavy Duty Press",
      description: "Large-scale industrial pressing operations",
      tag: "Large Scale",
      icon: <FaHardHat />,
      image: PressImg,
      specs: ["75 Ton", "Deep Drawing", "Progressive"],
    },
    {
      id: 13,
      category: "power-press",
      title: "Heavy Duty Press",
      description: "Large-scale industrial pressing operations",
      tag: "Large Scale",
      icon: <FaHardHat />,
      image: PressImg2,
      specs: ["20 Ton", "Deep Drawing", "Progressive"],
    },
    {
      id: 14,
      category: "milling",
      title: "Industrial Milling Machine",
      description:
        "Versatile material removal process creating various shape-based features by cutting away unwanted material with rotating multi-point cutters.",
      tag: "Precision Machining",
      icon: <GiCircularSaw />, // Updated to reflect a rotating cutter
      image: MillingImg,
      specs: [
        "3-Axis Simultaneous Control", // standard for modern CNC/VMC
      ],
    },
      {
      id: 15,
      category: "grinder",
      title: "Hydrolic Surface Grinder",
      description: "Quality assured positioning systems",
      tag: "Quality Assured",
      icon: <FaVectorSquare />,
      image: "https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcTq34OYqyFQT9JKwKacHAhsxXmGf480kFF4uX35YERW69Ktol5_RB0LOjySvNVyJ60ESS6H810mcahkbMqgAZoKj4w24NyR",
      specs: ["Aluminum", "Vacuum Chuck", "Repeatable"],
    },
  ];

  const categories = [
    { id: "all", label: "All Equipment", count: mediaItems.length },
    {
      id: "cnc",
      label: "CNC Machines",
      count: mediaItems.filter((item) => item.category === "cnc").length,
    },
    {
      id: "lathe",
      label: "Lathe Machines",
      count: mediaItems.filter((item) => item.category === "lathe").length,
    },
    {
      id: "power-press",
      label: "Power Press",
      count: mediaItems.filter((item) => item.category === "power-press")
        .length,
    },
    {
      id: "press-tools",
      label: "Press Tools",
      count: mediaItems.filter((item) => item.category === "press-tools")
        .length,
    },
    {
      id: "jigs & fixtures",
      label: "Jigs & Fixtures",
      count: mediaItems.filter((item) => item.category === "jigs & fixtures")
        .length,
    },
    {
      id: "drill-machine",
      label: "Drill Machines",
      count: mediaItems.filter((item) => item.category === "jigs & fixtures")
        .length,
    },
    {
      id: "milling",
      label: "Milling Machines",
      count: mediaItems.filter((item) => item.category === "jigs & fixtures")
        .length,
    },

    {
      id: "grinder",
      label: "Grinder Machines",
      count: mediaItems.filter((item) => item.category === "grinder").length,
    },
  ];

  const filteredItems =
    filter === "all"
      ? mediaItems
      : mediaItems.filter(
          (item) => item.category.toLowerCase() === filter.toLowerCase(),
        );

  return (
    <>
      <section className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 md:px-8 lg:px-16 xl:px-24 font-sans">
        <div className="max-w-8xl mx-auto">
          {/* Header Section */}
          <div className="relative mb-16">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-50 rounded-full opacity-30 blur-xl"></div>

            <div className="relative reveal">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex  items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg">
                  <FaTools className="text-xl text-white" />
                </div>
                <span className="text-blue-700 font-bold tracking-widest text-sm uppercase">
                  Technical Excellence
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
                <div className="max-w-2xl">
                  <h1 className="text-4xl reveal md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                    Industrial{" "}
                    <span className="relative">
                      <span className="relative z-10 text-blue-800">
                        Visual Portfolio
                      </span>
                      <span className="absolute bottom-1 left-0 w-full h-3 bg-blue-100 opacity-50 -z-0"></span>
                    </span>
                  </h1>
                  <p className="text-gray-600 reveal text-lg md:text-xl leading-relaxed max-w-3xl">
                    Showcasing our state-of-the-art manufacturing infrastructure
                    and precision machinery designed for excellence and
                    reliability in every operation.
                  </p>
                </div>

                <div className="flex-shrink-0 reveal">
                  <div className="inline-flex items-center gap-4 px-6 py-4 bg-white rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center justify-center w-14 h-14 bg-blue-50 rounded-lg">
                      <FaFilter className="text-blue-600 text-xl" />
                    </div>
                    <div className="reveal">
                      <div className="text-2xl font-bold text-gray-900">
                        {mediaItems.length}
                      </div>
                      <div className="text-sm text-gray-500">
                        Active Machines
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Navigation */}
          <div className="mb-16 stagger-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-700 reveal">
                Filter by Category
              </h3>
              <div className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-bold text-blue-600">
                  {filteredItems.length}
                </span>{" "}
                of {mediaItems.length} machines
              </div>
            </div>

            <div className="flex flex-wrap gap-3 stagger-card">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter(cat.id)}
                  className={`group relative px-6 py-4 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                    filter === cat.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg shadow-blue-100 transform -translate-y-0.5"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-blue-200 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`transition-colors ${filter === cat.id ? "text-white" : "text-blue-500"}`}
                  >
                    {cat.id === "all" && <FaIndustry className="text-lg" />}
                    {cat.id === "cnc" && <FaCog className="text-lg" />}
                    {cat.id === "lathe" && (
                      <FaIndustryIcon className="text-lg" />
                    )}
                    {cat.id === "power-press" && (
                      <FaHardHat className="text-lg" />
                    )}
                    {cat.id === "press-tools" && (
                      <FaTools className="text-lg" />
                    )}
                    {cat.id === "jigs & fixtures" && (
                      <FaVectorSquare className="text-lg" />
                    )}
                    {cat.id === "drill-machine" && (
                      <FaVectorSquare className="text-lg" />
                    )}
                    {cat.id === "grinder" && (
                      <FaVectorSquare className="text-lg" />
                    )}
                  </div>
                  <div className="text-left reveal">
                    <div className="font-semibold whitespace-nowrap">
                      {cat.label}
                    </div>
                    <div
                      className={`text-xs ${filter === cat.id ? "text-blue-100" : "text-gray-400"}`}
                    >
                      {cat.count} machines
                    </div>
                  </div>
                  {filter === cat.id && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-card">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-100"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Image Container */}
                <div className="relative h-64  overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full reveal object-contain transition-transform duration-700 group-hover:scale-110 opacity-90"
                  />

                  {/* Floating Tag */}
                  <div className="absolute top-4 left-4 z-20 reveal">
                    <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold uppercase  px-2 py-1 rounded-full shadow-lg">
                      {item.icon}
                      {item.tag}
                    </span>
                  </div>

                  {/* ID Badge */}
                  <div className="absolute top-4 right-4 z-20 reveal">
                    <div className="bg-black/70 text-white text-xs font-mono px-3 py-2 rounded-lg backdrop-blur-sm">
                      ID: #{item.id.toString().padStart(3, "0")}
                    </div>
                  </div>

                  {/* Quick View Button */}
                  <button className="absolute bottom-4 right-4 z-20 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30 hover:scale-110">
                    <FaExpand size={18} />
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold reveal text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 reveal text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Specifications */}
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2 reveal">
                      {item.specs.map((spec, index) => (
                        <span
                          key={index}
                          className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t reveal border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            item.category === "cnc"
                              ? "bg-green-500"
                              : item.category === "lathe"
                                ? "bg-blue-500"
                                : item.category === "power-press"
                                  ? "bg-orange-500"
                                  : item.category === "press-tools"
                                    ? "bg-purple-500"
                                    : "bg-cyan-500"
                          }`}
                        ></div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {item.category}
                        </span>
                      </div>
                      <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors group">
                        View Details
                        <FaArrowRight
                          className="transform group-hover:translate-x-1 transition-transform"
                          size={12}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div
                  className={`absolute inset-0 border-2 border-transparent rounded-2xl transition-all duration-300 pointer-events-none ${
                    hoveredId === item.id ? "border-blue-400/30" : ""
                  }`}
                ></div>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          {filteredItems.length > 0 && (
            <div className="mt-20">
              <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                ></div>

                <div className="relative p-12 text-center reveal">
                  <div className="inline-flex items-center reveal justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-8 shadow-xl">
                    <FaIndustry className="text-white text-2xl" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">
                    Ready to see our facility in action?
                  </h3>
                  <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-8">
                    Schedule a physical or virtual tour of our production floor
                    and witness our manufacturing excellence firsthand.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-8 py-4 rounded-xl transition-all transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl">
                      <Link to="/contact-us">Schedule On-Site Visit</Link>
                      <FaArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Media;
