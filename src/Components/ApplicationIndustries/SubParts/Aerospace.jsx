import React, { useEffect } from "react";
import {
  FaPlane,
  FaShieldAlt,
  FaMicrochip,
  FaCheckCircle,
  FaRocket,
  FaTools,
} from "react-icons/fa";
import {
  FaCogs,
  FaIndustry,
  FaRulerCombined,
  FaArrowRight,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import AerospaceImg from "../../../assets/aerospace-parts-removebg-preview.png";
import { reveal, revealStagger } from "../../../animation/ScrollAnimation.js";

const Aerospace = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const aerospaceCapabilities = [
    {
      title: "Aerospace Program Support",
      desc: "Building on our established CNC and VMC machining expertise, we support aerospace programs with precision-manufactured components for development and production-support applications.",
      icon: <FaRocket />,
      specs: [
        "Prototype & Pre-Production Parts",
        "Low-to-Medium Volume Machining",
        "Process-Driven Manufacturing",
      ],
    },
    {
      title: "CNC Machined Structural Parts",
      desc: "We manufacture small structural and support components commonly used in aerospace assemblies, tooling, and test environments.",
      icon: <FaPlane />,
      specs: ["Brackets & Mounts", "Plates & Covers", "Spacers & Bushings"],
    },
    {
      title: "Precision Turned & Milled Components",
      desc: "Our turning and milling capabilities enable consistent production of precision components with controlled tolerances.",
      icon: <FaMicrochip />,
      specs: [
        "Pins, Shafts & Sleeves",
        "Adapter & Interface Parts",
        "Custom Machined Inserts",
      ],
    },
    {
      title: "Tooling & Ground Support Equipment",
      desc: "We support aerospace manufacturing operations with CNC-machined tooling and ground support components designed for accuracy and durability.",
      icon: <FaTools />,
      specs: [
        "Assembly Jigs & Fixtures",
        "Inspection & Datum Blocks",
        "Handling & Support Hardware",
      ],
    },
  ];

  const technicalCapabilities = [
    {
      title: "CNC Milling",
      icon: <FaCogs />,
      points: [
        "3-Axis  CNC Milling",
        "Precision Plates, Brackets & Housings",
        "Prototype & Low-Volume Production",
      ],
    },
    {
      title: "CNC Turning",
      icon: <FaIndustry />,
      points: [
        "Shafts, Pins, Bushings & Sleeves",
        "Consistent Dimensional Control",
        "Custom & Batch Production",
      ],
    },
    {
      title: "Tolerances & Finish",
      icon: <FaRulerCombined />,
      points: [
        "Typical Tolerance: ±0.01 – ±0.02 mm",
        "Surface Finish: Ra 0.8 – 3.2 µm",
        "Repeatable Machining Accuracy",
      ],
    },
    {
      title: "Tooling Support",
      icon: <FaTools />,
      points: [
        "Assembly & Inspection Fixtures",
        "Reference & Setup Components",
        "Custom Ground Support Hardware",
      ],
    },
  ];

  return (
    <section className="bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200 min-h-screen">
      {/* HERO - UNCHANGED BUT WITH BETTER BACKGROUND */}
      <section className="relative bg-slate-50  text-white py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top,white,transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block reveal mb-4 px-4 py-1 text-sm font-semibold rounded-full bg-blue-800">
              Aerospace Manufacturing
            </span>
            <h1 className="reveal text-4xl md:text-6xl font-extrabold leading-tight text-black">
              Extending Proven{" "}
              <span className="text-blue-800 ">Precision Manufacturing</span>{" "}
              into Aerospace
            </h1>
            <p className="reveal mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              Our aerospace manufacturing approach is grounded in precision,
              transparency, and process reliability — focusing on components we
              can deliver consistently and responsibly.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 reveal">
              <button className="px-8 py-4 rounded-xl bg-blue-800 text-white font-semibold hover:bg-blue-900 transition">
                <Link to="/quote">Request Quote</Link>
              </button>
            </div>
          </div>

          <div className="relative reveal">
            <div className="absolute -inset-6 rounded-3xl " />
            <img
              src={AerospaceImg}
              alt="Power Press Tool Manufacturing"
              className="relative rounded-3xl  object-cover"
            />
          </div>
        </div>
      </section>

      {/* TECHNICAL CAPABILITIES - WITH NEW THEME */}
      <div className="bg-gradient-to-b from-slate-900/50 to-slate-950 py-24 px-4 sm:px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex reveal items-center gap-2 mb-4 px-4 py-2 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700">
              <div className="w-2 h-2  bg-blue-800 rounded-full"></div>
              <span className="text-sm   font-semibold text-blue-300 uppercase tracking-wider">
                Technical Specifications
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl reveal font-bold text-white mb-6">
              Technical <span className="text-blue-400">Capabilities</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl reveal mx-auto leading-relaxed">
              Advanced machining capabilities tailored for aerospace precision
              and reliability requirements
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 stagger-card">
            {technicalCapabilities.map((cap, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/20">
                    <div className="text-2xl text-blue-400 reveal">
                      {cap.icon}
                    </div>
                  </div>
                  <h4 className="font-bold text-2xl text-white reveal">
                    {cap.title}
                  </h4>
                </div>

                <div className="space-y-4">
                  {cap.points.map((point, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 group-hover:translate-x-1 transition-transform duration-300"
                      style={{ transitionDelay: `${i * 100}ms` }}
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        </div>
                      </div>
                      <span className="reveal text-slate-300 leading-relaxed font-medium">
                        {point}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm reveal text-slate-500">
                      Precision grade:{" "}
                      <span className="font-semibold text-slate-300 reveal">
                        High
                      </span>
                    </span>
                    <div className="text-xs reveal font-semibold px-3 py-1 rounded-full  text-blue-400">
                      Aerospace Grade
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MATERIALS SECTION */}
      <div className="py-16 px-4 sm:px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-slate-900/50 to-blue-900/30 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-slate-800">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4 reveal">
                  Advanced Materials Expertise
                </h3>
                <p className="text-slate-400 max-w-2xl mb-6 reveal">
                  We work with aerospace-grade materials suitable for
                  development and non-flight-critical applications, ensuring
                  optimal performance and durability.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 reveal">
                  {[
                    "Aluminum 6061 / 7075",
                    "Mild Steel",
                    "Stainless Steel (SS304 / SS316)",
                    "Engineering Plastics",
                    "Titanium Alloys",
                    "High-Strength Alloys",
                  ].map((material, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-slate-300 font-medium">
                        {material}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:text-right reveal">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full backdrop-blur-sm border border-slate-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-slate-300">
                    Material Testing Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA - WITH NEW THEME */}
    </section>
  );
};

export default Aerospace;
