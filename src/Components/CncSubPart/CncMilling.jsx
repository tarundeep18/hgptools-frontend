import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaLayerGroup,
  FaCubes,
  FaBolt,
  FaCompass,
} from "react-icons/fa";
import CncMilingPart from "../../assets/cnc-miling-part.png";
import {
  Settings,
  Hammer,
  Scissors,
  Thermometer,
  ShieldCheck,
  Cpu,
  Layers,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CncMilingImg from "../../assets/Cnc-miling-part2.png";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { reveal, revealStagger } from "../../animation/ScrollAnimation.js";
import SEO from "../../Pages/Seo/Seo.jsx";

const CNCMillingDetail = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const specs = [
    { label: "Travel Range (X/Y/Z)", value: "1200 x 800 x 600mm" },
    { label: "Positioning Accuracy", value: "±0.005mm" },
    { label: "Axis Configuration", value: "Full 3-Axis Simultaneous" },
    { label: "Spindle Speed", value: "Up to 12,000 RPM" },
    { label: "ATC Capacity", value: "24+ Tools" },

    {
      label: "Material Support",
      value: "Hardened Steel,Aluminum",
    },
  ];

  const steps = [
    {
      id: "01",
      title: "Raw Material Preparation",
      subtitle: "Metal Stock & Blanks",
      icon: <Cpu className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-400",
      image:
        "https://www.fastpreci.com/wp-content/uploads/2024/12/Aluminum-alloy-raw-materials-for-CNC-machining.webp",
      description:
        "The CNC milling process begins with the selection and preparation of certified raw materials, ensuring optimal strength, machinability, and performance for the intended application.",
      bullets: [
        "Aluminium, Mild Steel, Alloy Steel, Stainless Steel",
        "Material grade & hardness verification",
        "Surface cleaning and defect inspection",
      ],
      technicalData:
        "Material Grades: EN8, EN19, SS304 / SS316, Aluminium 6061 / 7075",
    },
    {
      id: "02",
      title: "CAD & CAM Programming",
      subtitle: "Digital Manufacturing",
      icon: <Layers className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-500",
      image:
        "https://kdmfab.com/wp-content/uploads/2023/12/CAM-CAD-SOFTWARE.jpg",
      description:
        "Engineering designs are translated into CNC-readable instructions using advanced CAD/CAM software to ensure precision, efficiency, and collision-free machining.",
      bullets: [
        "3D CAD modelling & design validation",
        "CAM toolpath generation & optimization",
        "Simulation and collision detection",
      ],
      technicalData: "Software Platforms: Fusion 360, Mastercam, SolidCAM",
    },
    {
      id: "03",
      title: "CNC Milling Operation",
      subtitle: "High-Precision Machining",
      icon: <Zap className="w-6 h-6" />,
      color: "from-amber-500 to-orange-400",
      image:
        "https://images.prismic.io/geomiqstaging/Zk2qiSol0Zci9V4Y_CNCMillingProcess.png?auto=format,compress",
      description:
        "Precision material removal is carried out using advanced multi-axis CNC milling machines to achieve complex geometries and tight tolerances.",
      bullets: [
        "3-Axis & 5-Axis CNC milling operations",
        "Face, slot, pocket & contour milling",
        "Automatic tool changing systems",
      ],
      technicalData: "Machining Accuracy: ±0.01 mm tolerance capability",
    },
    {
      id: "04",
      title: "Surface Finishing",
      subtitle: "Dimensional Accuracy",
      icon: <Thermometer className="w-6 h-6" />,
      color: "from-red-500 to-rose-400",
      image:
        "https://waykenrm.com/wp-content/uploads/2022/06/metal-surface-finishing.jpg",
      description:
        "Post-machining finishing processes are applied to enhance surface quality, dimensional accuracy, corrosion resistance, and overall component aesthetics.",
      bullets: [
        "Deburring and edge finishing",
        "Surface grinding (if required)",
        "Anodizing, coating, or polishing",
      ],
      technicalData: "Surface Finish Range: Ra 0.8 – 3.2 µm",
    },
    {
      id: "05",
      title: "Inspection & Quality Control",
      subtitle: "Precision Validation",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-400",
      image:
        "https://cdn.prod.website-files.com/5acf0fd148aa48472fde93b9/603d7e26afa9c00bdbeecf06_problem-image-quality.png",
      description:
        "Each CNC-machined component undergoes rigorous inspection and quality control to ensure compliance with engineering drawings and international standards.",
      bullets: [
        "Vernier, micrometer & CMM inspection",
        "Dimensional and visual quality checks",
        "Batch consistency and traceability",
      ],
      technicalData: "Quality Standards: ISO 9001 / AS9100",
    },
  ];

  return (
    <>
      <SEO
        title="CNC Milling Services India | Precision CNC Machining & VMC Milling Manufacturer | HGP Tools"
        description="HGP Tools provides advanced CNC milling services in India specializing in precision CNC machining, VMC milling, custom machined components, industrial milling solutions, and high-precision engineering parts manufacturing."
        keywords="CNC milling services India, Precision CNC machining manufacturer, VMC machining services India, CNC milling parts manufacturer, Custom machined components India, Industrial CNC milling company Faridabad, Precision machined components manufacturer"
        url="https://www.hgptools.com/cnc-milling"
        image="https://www.hgptools.com/images/cnc-milling-banner.jpg"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "CNC Milling Services",
          provider: {
            "@type": "Organization",
            name: "HGP Tools",
            url: "https://www.hgptools.com",
          },
          areaServed: {
            "@type": "Country",
            name: "India",
          },
          description:
            "Precision CNC milling, VMC machining, custom machined parts, and industrial manufacturing solutions.",
        }}
      />

      <div className="bg-slate-50 min-h-screen font-sans">
        <main className="max-w-7xl mx-auto py-12 px-6 lg:px-20">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="flex reveal items-center gap-3 mb-4 text-blue-800 font-bold tracking-widest text-xs uppercase">
                <FaLayerGroup /> High-Speed Machining
              </div>
              <h1 className="text-3xl reveal md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                CNC Milling <br />
                <span className="text-blue-800 reveal ">
                  Multi-Axis Advanced Sculpting
                </span>
              </h1>
              <p className="reveal text-slate-600 text-xl leading-relaxed mb-8">
                Our milling center specializes in high-speed, multi axis
                simultaneous machining. From prismatic components to complex
                organic surfaces, we deliver aerospace-grade precision with
                industry-leading surface finishes.
              </p>
              <div className="flex gap-4">
                <button className="reveal bg-blue-800 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-indigo-800 transition-all">
                  <Link to="/quote">Request Quote</Link>
                </button>
              </div>
            </div>

            <div className="relative group reveal ">
              <img
                src="https://mantool.com/wp-content/uploads/2020/01/3-Axis-CNC-machining3.jpg"
                alt="5-Axis CNC Milling Center"
                loading="lazy"
                className="relative rounded-[2.5rem] w-full h-[500px] object-cover"
              />
            </div>
          </div>

          {/* Visual Gallery Grid */}
          <div className="mb-20 stagger-card">
            <h2 className="text-3xl reveal font-bold mb-8 text-center">
              Milling Capabilities
            </h2>
            <div className="grid  grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
                <img
                  src={CncMilingPart}
                  alt="3-Axis Impeller Milling"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
                <img
                  src={CncMilingImg}
                  alt="High Speed Aluminum Removal"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
                <img
                  src="https://cdn.yijinsolution.com/wp-content/uploads/2024/06/3-axis-cnc-parts-scaled.webp"
                  alt="Finished Milled Components"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </main>
        {/* steps */}
        <div className="min-h-screen bg-[#0f172a] py-12 px-4 flex items-center justify-center font-sans">
          <div className="max-w-6xl w-full">
            {/* ---------- HEADER ---------- */}
            <div className="mb-12 text-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-blue-400 font-mono tracking-widest text-xs uppercase"
              >
                Industrial Manufacturing Protocol
              </motion.span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mt-2">
                CNC Milling{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  Workflow
                </span>
              </h1>
            </div>

            {/* ---------- DESKTOP PIPELINE ---------- */}
            <div className="hidden md:flex justify-between mb-12 relative px-4">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -translate-y-1/2" />
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className="relative z-10"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all
                ${
                  activeTab === idx
                    ? "bg-slate-900 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    : "bg-slate-900 border-slate-700"
                }`}
                  >
                    <span
                      className={`text-sm font-bold ${
                        activeTab === idx ? "text-blue-400" : "text-slate-500"
                      }`}
                    >
                      {step.id}
                    </span>
                  </div>
                  <div
                    className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 text-xs uppercase font-bold ${
                      activeTab === idx ? "text-blue-400" : "text-slate-500"
                    }`}
                  >
                    {step.title}
                  </div>
                </button>
              ))}
            </div>

            {/* ---------- MAIN GRID ---------- */}
            <div className="grid md:grid-cols-12 gap-8 pt-6">
              {/* ---------- LEFT INFO ---------- */}
              <div className="md:col-span-7 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <span className="text-6xl text-white font-black opacity-20">
                        {steps[activeTab].id}
                      </span>
                      <div>
                        <h2 className="text-3xl font-bold text-white">
                          {steps[activeTab].title}
                        </h2>
                        <p className="text-blue-400">
                          {steps[activeTab].subtitle}
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-400 text-lg mb-8">
                      {steps[activeTab].description}
                    </p>

                    <div className="space-y-4">
                      {steps[activeTab].bullets.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3 text-slate-300"
                        >
                          <span
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${steps[activeTab].color}`}
                          />
                          {item}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ---------- RIGHT VISUAL + TECH ---------- */}
              <div className="md:col-span-5 flex flex-col gap-6">
                {/* PROCESS IMAGE */}
                <motion.div
                  key={steps[activeTab].image}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900"
                >
                  <img
                    src={steps[activeTab].image}
                    alt={steps[activeTab].title}
                    className="w-full h-56 object-cover"
                  />
                </motion.div>

                {/* TECH SPECS */}
                <div
                  className={`rounded-3xl p-8 bg-gradient-to-br ${steps[activeTab].color}`}
                >
                  <h4 className="text-white/80 font-mono text-sm uppercase mb-4">
                    Technical Specifications
                  </h4>
                  <code className="text-white text-sm block bg-black/20 p-4 rounded-xl">
                    {steps[activeTab].technicalData}
                  </code>
                </div>

                {/* MOBILE NAV */}
                <div className="flex gap-4">
                  <button
                    disabled={activeTab === 0}
                    onClick={() => setActiveTab(activeTab - 1)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white p-5 rounded-2xl"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    disabled={activeTab === steps.length - 1}
                    onClick={() => setActiveTab(activeTab + 1)}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white p-5 rounded-2xl"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto py-12 px-6 lg:px-20">
          {/* Features Grid */}
          <div className="stagger-card grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <FaCompass className="text-4xl text-blue-800 mb-6" />
              <h3 className="text-2xl font-bold mb-3">3-Axis Simultaneous</h3>
              <p className="text-slate-500">
                Access complex angles and undercuts in a single setup, improving
                accuracy by eliminating workpiece re-fixturing.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <FaBolt className="text-4xl text-blue-800 mb-6" />
              <h3 className="text-2xl font-bold mb-3">
                High-Velocity Spindles
              </h3>
              <p className="text-slate-500">
                24,000 RPM spindles allow for micro-tooling and mirror-like
                surface finishes on non-ferrous materials.
              </p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <FaCubes className="text-4xl text-blue-800 mb-6" />
              <h3 className="text-2xl font-bold mb-3">Pallet Changing</h3>
              <p className="text-slate-500">
                Integrated pallet systems enable continuous production by
                loading parts while the machine is cutting.
              </p>
            </div>
          </div>

          {/* Technical Specs Table */}
          <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white">
            <h2 className="text-4xl reveal font-black mb-12 text-center">
              Milling Specifications
            </h2>
            <div className="grid reveal md:grid-cols-2 gap-x-16 gap-y-6">
              {specs.map((spec, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border-b border-slate-700 pb-4"
                >
                  <span className="reveal text-slate-400 font-medium uppercase tracking-wider text-sm">
                    {spec.label}
                  </span>
                  <span className="reveal sm:text-xl text-sm tracking-wider font-bold text-blue-400">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Industrial Advantages */}
          <div className="mt-20">
            <h2 className="text-4xl font-black mb-10 reveal">
              Why Choose Our Milling Services?
            </h2>
            <div className="space-y-6 reveal">
              {[
                "High-Removal Rate: Advanced trochoidal milling strategies for 50% faster cycle times.",
                "In-Process Probing: Renishaw probes verify dimensions before the part leaves the machine.",
                // "Thermal Compensation: Real-time sensor feedback to maintain precision during long production runs.",
                "Complex Geometries: Expertise in blisks, impellers, and medical implants.",
              ].map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
                >
                  <FaCheckCircle className="text-blue-800 text-2xl mt-1" />
                  <p className="text-slate-700 text-lg font-medium reveal">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CNCMillingDetail;
