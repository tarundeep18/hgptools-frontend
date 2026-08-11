import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaBolt,
  FaMicroscope,
  FaLayerGroup,
  FaVial,
} from "react-icons/fa";
import EdmImg from "../../assets/edm-2-removebg-preview.png";
import { useState } from "react";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  ShieldCheck,
  Thermometer,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EdmCuttingImg from "../../assets/edm-cutting.jpg";

const CNCEDMDetail = () => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const specs = [
    { label: "Surface Finish (Ra)", value: "Up to 0.1 μm" },
    { label: "Wire Diameter Range", value: "0.05mm - 0.30mm" },
    { label: "Positioning Accuracy", value: "±0.005mm" },
    { label: "Max Workpiece Weight", value: "50 kg" },
    { label: "Taper Angle Capacity", value: "±45° at 100mm" },
    {
      label: "Specialty Materials",
      value: "Carbide, Polycrystalline Diamond (PCD), Hastelloy",
    },
  ];

  const steps = [
    {
      id: "01",
      title: "Material & Electrode Preparation",
      subtitle: "Conductive Stock & Tooling",
      icon: <Cpu className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-400",
      image:
        "https://www.fastpreci.com/wp-content/uploads/2024/12/Aluminum-alloy-raw-materials-for-CNC-machining.webp",
      description:
        "The EDM process begins by selecting electrically conductive workpieces and fabricating custom electrodes (for Sinker EDM) or selecting high-tensile wire (for Wire EDM).",
      bullets: [
        "Hardened Steel, Titanium, Inconel, Carbides",
        "Electrode fabrication: Graphite, Copper, or Tungsten",
        "Material conductivity & mounting verification",
      ],
      technicalData:
        "Workpiece Hardness: Up to 65 HRC | Electrode Materials: Graphite, Copper",
    },
    {
      id: "02",
      title: "CNC EDM Programming",
      subtitle: "Spark Path & Parameter Logic",
      icon: <Layers className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-500",
      image:
        "https://kdmfab.com/wp-content/uploads/2023/12/CAM-CAD-SOFTWARE.jpg",
      description:
        "Specialized CAM software generates precise 2D or 3D toolpaths, defining critical electrical parameters such as pulse 'on' time, 'off' time, and peak current.",
      bullets: [
        "Spark gap calculation & overcut compensation",
        "Pulse parameter optimization (on/off time)",
        "Flushing strategy & dielectric flow programming",
      ],
      technicalData:
        "Control Parameters: Peak Current (Ip), Pulse Duration (Ton)",
    },
    {
      id: "03",
      title: "Spark Erosion Operation",
      subtitle: "Thermal Subtractive Process",
      icon: <Zap className="w-6 h-6" />,
      color: "from-amber-500 to-orange-400",
      image:
        "https://www.amedm.co.uk/wp-content/uploads/2022/03/spark-erosion-machine.jpg",
      description:
        "Material is removed via rapid, controlled electrical discharges between the electrode and workpiece, both submerged in a dielectric fluid that acts as an insulator and coolant.",
      bullets: [
        "Sinker EDM (ram) or Wire EDM (WEDM) cycles",
        "Continuous dielectric flushing of eroded debris",
        "Servo-controlled gap maintenance (10–50 microns)",
      ],
      technicalData:
        "Machining Accuracy: ±0.002 mm | Spark Temp: ~8,000°C – 12,000°C",
    },
    {
      id: "04",
      title: "Refining Recast Removal",
      subtitle: "Surface Integrity & Texture",
      icon: <Thermometer className="w-6 h-6" />,
      color: "from-red-500 to-rose-400",
      image:
        "https://waykenrm.com/wp-content/uploads/2022/06/metal-surface-finishing.jpg",
      description:
        "Post-machining involves multi-pass 'skim' cuts to reduce the recast (white) layer and achieve the target surface roughness (Ra) without directional machining marks.",
      bullets: [
        "Recast layer (white layer) thickness reduction",
        "Skim passing for fine surface finishes",
        "Thermal stress relief or secondary polishing",
      ],
      technicalData: "Surface Finish Range: Ra 0.1 – 1.6 µm (VDI 3400 scales)",
    },
    {
      id: "05",
      title: "Precision Metrology",
      subtitle: "Non-Contact Validation",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-400",
      image:
        "https://blog.cmmxyz.com/hs-fs/hubfs/Picture2.png?width=602&name=Picture2.png",
      description:
        "Final components undergo rigorous inspection using CMM or optical profilometers to ensure intricate geometries and internal corners meet specified tolerances.",
      bullets: [
        "Optical/Non-contact surface roughness testing",
        "Dimensional verification of internal cavities",
        "Crack detection and metallurgical integrity check",
      ],
      technicalData: "Quality Standards: ISO 9001 / AS9100 / IATF 16949",
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <main className="max-w-7xl mx-auto py-12 px-6 lg:px-20">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center reveal gap-3 mb-4 text-blue-800 font-bold tracking-widest text-xs uppercase">
              <FaBolt /> Non-Contact Precision
            </div>
            <h1 className="text-3xl reveal md:text-5xl font-black text-blue-800 mb-6 leading-tight">
              CNC EDM <br />
              <span className="text-blue-800 reveal">Sub-Micron Erosion</span>
            </h1>
            <p className="text-slate-600 text-xl leading-relaxed mb-8 reveal">
              Our EDM center provides high-precision Wire and Sinker
              (Die-Sinking) services for ultra-hard materials. By utilizing
              electrical discharges rather than physical force, we achieve
              complex geometries and micro-features impossible with traditional
              cutting tools.
            </p>
            <div className="flex gap-4 reveal">
              <button className="bg-blue-800 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                <Link to="/quote">Request Quote</Link>
              </button>
            </div>
          </div>

          <div className="relative group reveal">
            <img
              src={EdmImg}
              alt="Advanced Wire EDM Machine"
              loading="lazy"
              className="relative rounded-[2.5rem] w-full h-[500px] object-cover "
            />
          </div>
        </div>

        {/* Visual Gallery Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center reveal">
            Precision Discharge Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-card">
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src={EdmCuttingImg}
                alt="Wire EDM Cutting Process"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src="https://d2n4wb9orp1vta.cloudfront.net/cms/brand/mmt/2025-mmt/0225-mmt-f-gf-diesinkerelectrodeandpart.jpeg;maxWidth=720"
                alt="Sinker EDM Die Cavity"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src="https://www.camtechedm.com/wp-content/uploads/2020/08/edm-hole-drilling-848x400.jpg"
                alt="Micro-EDM Drilling"
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
              EDM Service{" "}
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
        <div className="grid md:grid-cols-3 gap-8 mb-20 stagger-card">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaMicroscope className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3 reveal">
              Micro-Feature Cutting
            </h3>
            <p className="text-slate-500 reveal">
              Capable of producing slits and holes as small as 0.05mm, ideal for
              surgical instruments and high-frequency electronics.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaLayerGroup className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3 reveal">Mirror Finishes</h3>
            <p className="text-slate-500 reveal">
              State-of-the-art power generators produce a surface finish so fine
              that secondary polishing is often completely eliminated.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaVial className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3 reveal">
              Material Neutrality
            </h3>
            <p className="text-slate-500 reveal">
              Hardness is irrelevant; if it conducts electricity, we can machine
              it, including hardened tool steel and exotic superalloys.
            </p>
          </div>
        </div>

        {/* Technical Specs Table */}
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white stagger-card">
          <h2 className="text-4xl font-black mb-12 text-center reveal">
            EDM Technical Specifications
          </h2>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
            {specs.map((spec, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b border-slate-700 pb-4"
              >
                <span className="text-slate-400 reveal font-medium uppercase tracking-wider text-sm">
                  {spec.label}
                </span>
                <span className="sm:text-xl reveal text-sm font-bold text-blue-400">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Industrial Advantages */}
        <div className="mt-20">
          <h2 className="text-4xl font-black mb-10 reveal">
            The EDM Advantage
          </h2>
          <div className="space-y-6 reveal stagger-card">
            {[
              "Zero Mechanical Stress: No cutting forces applied, preventing deformation in delicate or thin-walled parts.",
              "Complex 3D Cavities: Sinker EDM allows for internal sharp corners and deep blind pockets.",
              "Autonomous Operation: Automatic wire threading and AI-monitored spark control allow for 24/7 high-precision runs.",
              "Eco-Pulse Technology: efficiency standards reduce dielectric fluid waste and power consumption by 25%.",
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
  );
};

export default CNCEDMDetail;
