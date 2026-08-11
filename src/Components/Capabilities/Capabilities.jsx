import React, { useEffect } from "react";
import {
  FaIndustry,
  FaCogs,
  FaMicrochip,
  FaTools,
  FaDollyFlatbed,
  FaMicroscope,
  FaArrowRight,
  FaDraftingCompass,
  FaLayerGroup,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";

const ManufacturingCapabilities = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const facilityStats = [
    { label: "CNC Centers", value: "12+", icon: <FaIndustry /> },
    { label: "Precision Range", value: "Micron Level", icon: <FaCogs /> },
    { label: "Annual Output", value: "1M Units", icon: <FaDollyFlatbed /> },
    { label: "Quality Check", value: "3-Stage", icon: <FaMicroscope /> },
  ];

  const capabilityDetails = [
    {
      title: "Advanced CNC Machining",
      path: "/capabilities/advance-cnc", // Matching Route
      desc: "Specialized in high-precision machined rings and automotive shafts using standard automated lathes.",
      tech: ["±0.005mm Accuracy", "Auto-Feeding", "Multi-Axis"],
      icon: <FaTools />,
    },
    {
      title: "Custom Tooling & Die",
      path: "/capabilities/custom-tools", // Matching Route
      desc: "Bespoke HGP tool design and fabrication for specialized industrial machining requirements.",
      tech: ["HSS Material", "Carbide Tipped", "Custom CAD"],
      icon: <FaMicrochip />,
    },
    // {
    //   title: "Hardware Support",
    //   path: "/capabilities/hardware-support", // Matching Route
    //   desc: "Specialized maintenance and technical support for industrial machine tools, ensuring zero downtime.",
    //   tech: ["Spindle Repair", "Preventive Maintenance", "System Calibration"],
    //   icon: <FaTools />,
    // },
    {
      title: "Rapid Prototyping",
      path: "/capabilities/rapid-prototyping", // Matching Route
      desc: "Accelerated development of complex industrial components from CAD designs to functional metal prototypes.",
      tech: ["3D CAD/CAM", "Precision Machining", "Functional Testing"],
      icon: <FaDraftingCompass />,
    },
    {
      title: "Sheet Metal Parts",
      path: "/capabilities/sheet-metal", // Added Route
      desc: "High-precision fabrication of durable sheet metal components using advanced laser cutting and bending.",
      tech: ["Laser Cutting", "CNC Bending", "Stainless & Alloy Steel"],
      icon: <FaLayerGroup />,
    },
  ];

  return (
    <section className="bg-white py-20 px-6 lg:px-20 font-sans max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
        <div className="max-w-2xl">
          <span className="text-blue-800 reveal font-bold tracking-widest uppercase text-sm">
            Industrial Powerhouse
          </span>
          <h2 className="text-4xl md:text-5xl reveal font-extrabold text-slate-900 mt-4 mb-6">
            Faridabad Facility & <br />
            <span className="text-blue-800">Manufacturing Prowess</span>
          </h2>
          <p className="text-slate-600 reveal text-lg leading-relaxed">
            HGP Tools integrates automated manufacturing with traditional
            engineering craftsmanship to deliver zero-defect industrial
            components in the market.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full lg:w-auto stagger-card">
          {facilityStats.map((stat, i) => (
            <div
              key={i}
              className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-w-[160px]"
            >
              <div className="text-blue-800 mb-2">{stat.icon}</div>
              <div className="text-2xl font-black text-slate-900">
                {stat.value}
              </div>
              <div className="text-slate-500 text-xs font-bold uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Capabilities Grid */}
      <div className="grid md:grid-cols-2 gap-8 stagger-card">
        {capabilityDetails.map((cap, index) => (
          <Link
            to={cap.path}
            key={index}
            className="group relative overflow-hidden bg-slate-900 rounded-3xl p-10 text-white hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 cursor-pointer block"
          >
            {/* Background Icon Decoration */}
            <div className="reveal absolute -right-8 -bottom-8 text-white opacity-5 text-9xl group-hover:scale-110 transition-transform duration-700">
              {cap.icon}
            </div>

            <div className="relative z-10">
              <div className="reveal w-16 h-16 bg-blue-800 rounded-2xl flex items-center justify-center text-3xl mb-8">
                {cap.icon}
              </div>
              <h3 className="reveal text-3xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                {cap.title}
              </h3>
              <p className="reveal text-slate-400 text-lg mb-8 leading-relaxed">
                {cap.desc}
              </p>

              <div className="flex flex-wrap gap-3 mb-8 reveal">
                {cap.tech.map((tag, i) => (
                  <span
                    key={i}
                    className="px-4 py-1.5 rounded-full bg-slate-800 text-blue-400 text-xs font-bold border border-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex reveal items-center gap-3 text-blue-400 font-bold group-hover:gap-5 transition-all">
                View Machine Specs{" "}
                <FaArrowRight className="transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 bg-blue-50 border border-blue-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 reveal h-12 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
            <FaIndustry />
          </div>
          <p className="text-slate-700 font-medium reveal">
            Our facility follows{" "}
            <span className="font-bold text-blue-700">ISO-certified</span>{" "}
            workflows for all machining processes.
          </p>
        </div>
        <Link
          to="/contact-us"
          className="w-full reveal md:w-auto bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all text-center"
        >
          Schedule Facility Visit
        </Link>
      </div>
    </section>
  );
};

export default ManufacturingCapabilities;
