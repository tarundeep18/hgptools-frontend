import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaMicrochip,
  FaCogs,
  FaClock,
  FaTools,
} from "react-icons/fa";

import { reveal, revealStagger } from "../../animation/ScrollAnimation.js";

const CNCTurningDetail = () => {

    useEffect(() => {
        reveal(".reveal");
        revealStagger(".stagger-card")
      }, []);

  const specs = [
    { label: "Max Turning Diameter", value: "400mm" },
    { label: "Standard Tolerance", value: "±0.005mm" },
    { label: "Axis Configuration", value: "Multi-Axis (X, Z, C, Y)" },
    { label: "Spindle Speed", value: "Up to 6,000 RPM" },
    { label: "Bar Feed Capacity", value: "6,000mm length" },
    { label: "Material Support", value: "Titanium, Inconel, Superalloys" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Navigation Header */}
      {/* <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-blue-800 font-bold hover:text-indigo-600 transition-colors"
          >
            <FaArrowLeft /> Back to Capabilities
          </Link>
        </div>
      </nav> */}

      <main className="max-w-7xl mx-auto py-12 px-6 lg:px-20">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center gap-3 mb-4 text-blue-800 font-bold tracking-widest text-xs uppercase">
              <FaMicrochip /> Automation Grade A1
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              CNC Turning <br />
              <span className="text-blue-800">Multi-Axis Precision</span>
            </h1>
            <p className="text-slate-600 text-xl leading-relaxed mb-8">
              Our facility leverages live-tooling turning for complex cylindrical
              geometries. We combine rotating tools with traditional turning to
              complete parts in a single setup, drastically reducing error and
              lead times.
            </p>
            <div className="flex gap-4">
              <button className="bg-blue-800 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-900 transition-all">
                <Link to="/contact-us">Request Quote</Link>
              </button>
              {/* <button className="border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-white transition-all">
                Technical Specs
              </button> */}
            </div>
          </div>

          <div className="relative group">
            {/* <div className="absolute -inset-4 rounded-[3rem]"></div> */}
            <img
              src="https://5.imimg.com/data5/KE/IH/MY-983344/cnc-turning-machines.png"
              alt="CNC Turning Machine"
               loading="lazy"
              className="relative rounded-[2.5rem]  w-full h-[500px] object-cover"
            />
          </div>
        </div>

        {/* Visual Gallery Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Process Visuals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src="https://www.sciaky.com/images/content/thumbs/titanium-parts.jpg"
                alt="Titanium Aerospace Parts"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src="https://at-machining.com/wp-content/uploads/2024/02/CNC-Tools.jpeg"
                alt="Live Tooling"
                className="w-full h-full object-fit"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src="https://static.canadianmetalworking.com/a/choosing-the-right-bar-feeder-1532359643.jpg?size=1000x"
                alt="Automated Bar Feeder"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaTools className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Live-Tooling</h3>
            <p className="text-slate-500">
              Driven tools on the turret allow for radial/axial drilling and
              milling without removing the part.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaCogs className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Robotic Feeders</h3>
            <p className="text-slate-500">
              Integrated bar feeders allow for 24/7 "lights-out" manufacturing
              with zero operator intervention.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaClock className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Rapid Setup</h3>
            <p className="text-slate-500">
              AI-optimized toolpaths and quick-change collets reduce transition
              times by 40%.
            </p>
          </div>
        </div>

        {/* Technical Specs Table */}
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white">
          <h2 className="text-4xl font-black mb-12 text-center">
            Technical Specifications
          </h2>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
            {specs.map((spec, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b border-slate-700 pb-4"
              >
                <span className="text-slate-400 font-medium uppercase tracking-wider text-sm">
                  {spec.label}
                </span>
                <span className="text-xl font-bold text-blue-400">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Industrial Advantages */}
        <div className="mt-20">
          <h2 className="text-4xl font-black mb-10">
            Why Choose Our Turning Services?
          </h2>
          <div className="space-y-6">
            {[
              "Done-in-One: Eliminate secondary milling operations for complex parts.",
              "Sub-Micron Repeatability: Automated metrology checks every 10th part.",
              "Sustainability: 30% less coolant waste via high-pressure micro-lubrication.",
              "Material Range: Specialized in Aerospace Grade 5 Titanium and Inconel.",
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
              >
                <FaCheckCircle className="text-blue-800 text-2xl mt-1" />
                <p className="text-slate-700 text-lg font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CNCTurningDetail;
