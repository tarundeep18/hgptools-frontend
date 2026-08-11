import React, { useEffect } from "react";
import {
  FaCog,
  FaSync,
  FaCube,
  FaBolt,
  FaWaveSquare,
  FaLayerGroup,
  FaShoppingCart,
  FaMicrochip,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { reveal, revealStagger } from "../../../animation/ScrollAnimation";

const AdvanceCNC = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const capabilities = [
    {
      title: "CNC Turning",
      subtitle: "Multi-Axis Precision",
      desc: "Live-tooling lathes for complex cylindrical geometries. Our systems integrate robotic bar feeders for 24/7 lights-out manufacturing.",
      icon: <FaSync />,
      path: "/capabilities/advance-cnc/turning",
      accent: "border-blue-800 text-blue-800",
    },
    {
      title: "CNC Milling",
      subtitle: "Multi-Axis Contouring",
      desc: "High-speed multi-axis machining centers capable of achieving sub-micron tolerances on aerospace-grade titanium and superalloys.",
      icon: <FaCube />,
      path: "/capabilities/advance-cnc/cnc-miling",
      accent: "border-blue-800 text-blue-800",
    },
    // {
    //   title: "Lathe Services",
    //   subtitle: "High-Torque Performance",
    //   desc: "Heavy-duty CNC lathes designed for large-scale industrial shafts and components with ultra-fine surface finishes (Ra 0.4).",
    //   icon: <FaCog />,
    //   path: "/capabilities/advance-cnc/lathe",
    //   accent: "border-blue-800 text-blue-800",
    // },
    {
      title: "EDM Machining",
      subtitle: "Wire & Sinker EDM",
      desc: "Electrical Discharge Machining for conductive materials that are too hard for traditional tools. Perfect for deep cavities and micro-holes.",
      icon: <FaBolt />,
      path: "/capabilities/advance-cnc/edm-services",
      accent: "border-blue-800 text-blue-800",
    },
    // {
    //   title: "Laser Processing",
    //   subtitle: "Fiber Laser Precision",
    //   desc: "Utilizing  ultra-short pulse fiber technology for micron-level accuracy. Optimized for high-reflectivity alloys with cold-ablation to ensure zero heat-affected zones.",
    //   icon: <FaWaveSquare />,
    //   accent: "border-blue-800 text-blue-800",
    // },
    {
      title: "CNC Bending",
      subtitle: "Automated Press Brake",
      desc: "Precision sheet metal bending with automated angle measurement systems to ensure 100% repeatability across large production runs.",
      icon: <FaLayerGroup />,
      path: "/capabilities/advance-cnc/bending",
      accent: "border-blue-800 text-blue-800",
    },
  ];

  return (
    <section className="bg-white py-24 px-6 lg:px-20  font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <div className="reveal flex items-center gap-3 mb-4 text-blue-800 font-bold tracking-[0.3em] text-xs uppercase">
              <FaMicrochip /> Industry 4.0 Standard
            </div>
            <h2 className="reveal text-4xl md:text-6xl font-black mb-6">
              Advanced{" "}
              <span className="reveal  bg-clip-text  text-blue-800 ">CNC</span>{" "}
              Solutions
            </h2>
            <p className="reveal text-slate-400 text-lg leading-relaxed">
              Our facility leverages toolpaths and real-time metrology to
              deliver aerospace-grade components with 40% faster lead times than
              traditional machining.
            </p>
          </div>
          <div className="hidden lg:block pb-4">
            <div className="text-right border-r-4 border-blue-800 pr-6">
              <span className="block reveal text-3xl font-bold">±0.005mm</span>
              <span className="reveal text-slate-500 uppercase text-xs font-bold tracking-widest">
                Standard Tolerance
              </span>
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid  md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-card">
          {capabilities.map((item, idx) => (
            <div
              key={idx}
              className="group stagger-card flex flex-col p-8 border border-slate-100 rounded-[2rem] bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-300"
            >
              <Link to={item.path} key={idx}>
                <div
                  className={`w-12 h-12 reveal rounded-xl border-2 flex items-center justify-center text-xl mb-6 transition-all duration-500 group-hover:scale-110 ${item.accent}`}
                >
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-1 reveal">{item.title}</h3>
                <p className="text-blue-800 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                  {item.subtitle}
                </p>
                <p className="text-slate-600 reveal text-sm leading-relaxed">
                  {item.desc}
                </p>
              </Link>
            </div>
          ))}
        </div>

        {/* Custom Engineering / RFQ Section */}
        {/* Technical RFQ / Machining Consultation Section */}
        <div className="mt-16 bg-slate-900 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative shadow-2xl border border-blue-500/20">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl text-center lg:text-left">
              <div className="reveal inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-blue-500/20">
                <FaMicrochip /> DFM Analysis Available
              </div>
              <h3 className="text-3xl md:text-4xl text-white font-black mb-4 reveal leading-tight">
                Ready for <br />
                <span className="text-blue-500">Precision Machining?</span>
              </h3>
              <p className="text-slate-400 text-base md:text-lg reveal leading-relaxed">
                Submit your technical drawings or 3D models for a **Design for
                Manufacturing (DFM)** review. Our engineers optimize toolpaths
                to ensure your components meet
                <span className="text-white font-semibold">
                  {" "}
                  sub-micron tolerances{" "}
                </span>
                with maximum efficiency.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <Link
                to="/contact-us"
                className="flex items-center justify-center gap-3 reveal bg-blue-700 text-white px-10 py-5 rounded-2xl font-black hover:bg-blue-600 hover:scale-[1.02] transition-all shadow-lg shadow-blue-900/40 whitespace-nowrap"
              >
                Contact us
              </Link>
            </div>
          </div>

          {/* Background Decorative Element */}
          <div className="absolute -right-16 -bottom-16 text-white/5 -rotate-12 pointer-events-none">
            <FaSync size={320} className="animate-spin-slow" />
          </div>

          {/* Subtle Grid Overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#3b82f6 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          ></div>
        </div>
      </div>
    </section>
  );
};

export default AdvanceCNC;
