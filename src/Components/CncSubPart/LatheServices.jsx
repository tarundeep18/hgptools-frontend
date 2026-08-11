import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaRedo,
  FaCompactDisc,
  FaMicrochip,
  FaChartLine,
} from "react-icons/fa";
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
import { useState } from "react";
import { reveal, revealStagger } from "../../animation/ScrollAnimation.js";

const CNCLatheDetail = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const [activeTab, setActiveTab] = useState(0);
  const specs = [
    { label: "Max Swing Over Bed", value: "600mm - 1000mm" },
    { label: "Positioning Accuracy", value: "±0.005mm" },
    { label: "Spindle Speed Range", value: "Up to 10,000 RPM" },
    { label: "Axis Configuration", value: "2-Axis & 3-Axis (X, Z, Y)" },
    { label: "Chuck Type", value: "Hydraulic Hollow / Solid" },
    { label: "Tooling Station", value: "8 / 12 Station Turret" },
  ];

  const steps = [
    {
      id: "01",
      title: "Raw Material Selection",
      subtitle: "Round Stock & Bar Feed",
      icon: <Cpu className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-400",
      image:
        "https://www.shutterstock.com/image-photo/closeup-stack-steel-rods-raw-260nw-2527660167.jpg",
      description:
        "CNC turning starts with cylindrical bar stock or blanks selected for rotational stability, machinability, and tensile strength.",
      bullets: [
        "Round bars, hexagonal stock, or tubular blanks",
        "Sawing to length for chucking or bar feeding",
        "Verification of diameter tolerances & straightness",
      ],
      technicalData:
        "Common Materials: Stainless 304/316, Brass, Alloy Steel 4140",
    },
    {
      id: "02",
      title: "CAD & Lathe Programming",
      subtitle: "Rotational Toolpath Design",
      icon: <Layers className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-500",
      image:
        "https://bobcad.com/wp-content/uploads/2014/06/multi-axis-cnc-milling-simulation-g-code-software.png",
      description:
        "Engineers create 2D profiles or 3D models to generate G-code specifically for rotational cutting and threading operations.",
      bullets: [
        "2D profile geometry & centerline definition",
        "Canned cycle generation (Roughing/Threading)",
        "Spindle speed (SFM) & Feed rate optimization",
      ],
      technicalData: "Software: FeatureCAM / Mastercam Lathe / ESPRIT",
    },
    {
      id: "03",
      title: "CNC Turning Operation",
      subtitle: "Precision Lathe Machining",
      icon: <Zap className="w-6 h-6" />,
      color: "from-amber-500 to-orange-400",
      image:
        "https://jaewoomachines.com/cdn/shop/articles/Screenshot-2024-07-16-164755-800x595.png?v=1731472012",
      description:
        "The workpiece rotates at high speeds while stationary or live tools remove material to create perfectly symmetrical cylindrical parts.",
      bullets: [
        "OD & ID Turning, Facing, and Boring",
        "Single-point threading & Grooving",
        "Live tooling for off-center drilling/milling",
      ],
      technicalData: "Tolerance Capability: ±0.005 mm to ±0.01 mm",
    },
    {
      id: "04",
      title: "Finishing & Deburring",
      subtitle: "Rotational Surface Quality",
      icon: <Thermometer className="w-6 h-6" />,
      color: "from-red-500 to-rose-400",
      image:
        "https://www.zintilon.com/wp-content/uploads/2024/04/deburring-2-scaled.jpg",
      description:
        "Finished turned parts are treated to remove 'burrs' at the cutoff point and ensure the required micro-finish on the diameter.",
      bullets: [
        "Part-off burr removal & chamfering",
        "Polishing or Centerless grinding",
        "Passivation or Heat treatment (if required)",
      ],
      technicalData: "Surface Finish: Ra 0.4 – 1.6 µm",
    },
    {
      id: "05",
      title: "Inspection & Metrology",
      subtitle: "Concentricity & Diameter Check",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-400",
      image: "https://www.norelem.com/xs_db/BILD_DB/3/www/750/32501.jpg",
      description:
        "Critical checks are performed on diameters, thread pitches, and concentricity to ensure the part is perfectly balanced.",
      bullets: [
        "Digital Micrometers & Thread Gauges",
        "Concentricity & Runout testing",
        "Optical Comparator profile verification",
      ],
      technicalData: "Standard: ISO 9001:2015 / Geometric Tolerancing (GD&T)",
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <main className="max-w-7xl mx-auto py-12 px-6 lg:px-20">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center gap-3 reveal mb-4 text-blue-800 font-bold tracking-widest text-xs uppercase">
              <FaMicrochip /> Industry Ready
            </div>
            <h1 className="text-3xl reveal md:text-5xl font-black text-blue-800 mb-6 leading-tight">
              CNC Turning <br />
              <span className="text-blue-800 reveal">
                Precision Rotational Systems
              </span>
            </h1>
            <p className="text-slate-600 text-xl leading-relaxed mb-8 reveal">
              Our turning facility utilizes intelligent automation and adaptive
              correction to maintain sub-micron tolerances. Specializing in
              rotationally symmetrical components, we deliver high-speed
              throughput with consistent surface quality.
            </p>
            <div className="flex gap-4 reveal ">
              <button className="bg-blue-800 = text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                <Link to="/quote">Request Quote</Link>
              </button>
            </div>
          </div>

          <div className="relative group reveal">
            <img
              src="https://5.imimg.com/data5/KE/IH/MY-983344/cnc-turning-machines.png"
              alt="Industrial CNC Turning Machine"
              className="relative rounded-[2.5rem] w-full h-[500px] object-cover"
            />
          </div>
        </div>
        {/* Visual Gallery Grid */}
        <div className="mb-20 stagger-card">
          <h2 className="text-3xl font-bold mb-8 text-center reveal">
            Precision Turning Visuals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src="https://images.prismic.io/xometry-marketing/7b18d6e3-7a18-44ce-9847-12bea2bcc787_8-Parts-of-a-CNC-Lathe-Machine.jpg?auto=compress%2Cformat&rect=0%2C0%2C486%2C486&w=486&h=486&fit=max"
                alt="Precision Lathe Components"
                className="w-full h-full object-fit"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src="https://www.rapiddirect.com/wp-content/uploads/2022/08/CNC-turning-basics.webp"
                alt="High Speed Turning Operation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg">
              <img
                src="https://laxmiengwork.com/assets/images/resource/about-1.webp"
                alt="Automated Lathe Tending"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </main>
      {/* steps */}
      <div className="min-h-screen bg-[#0f172a] py-12 px-4 flex items-center justify-center font-sans selection:bg-blue-500/30">
        <div className="max-w-6xl w-full">
          {/* Header Section */}
          <div className="mb-12 text-center reveal">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-blue-400  font-mono tracking-widest text-xs uppercase"
            >
              Industrial Manufacturing Protocol
            </motion.span>
            <h1 className="text-4xl reveal md:text-5xl font-extrabold text-white mt-2 tracking-tight">
              CNC Turning{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Workflow
              </span>
            </h1>
          </div>

          {/* Desktop Navigation Pipeline */}
          <div className="hidden md:flex justify-between mb-12 relative px-4 reveal">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -translate-y-1/2 z-0" />
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className="relative z-10 group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                    activeTab === idx
                      ? `bg-slate-900 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]`
                      : "bg-slate-900 border-slate-700 group-hover:border-slate-500"
                  }`}
                >
                  <div
                    className={`${activeTab === idx ? "text-blue-400" : "text-slate-500"}`}
                  >
                    {step.icon}
                  </div>
                </div>
                <div
                  className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap font-bold text-xs uppercase tracking-tighter ${
                    activeTab === idx ? "text-blue-400" : "text-slate-500"
                  }`}
                >
                  {step.title}
                </div>
              </button>
            ))}
          </div>

          {/* Main Content Card */}
          <div className="grid md:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Info */}
            <div className="md:col-span-7 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <span
                      className={`text-5xl font-black opacity-20 text-transparent bg-clip-text bg-gradient-to-b from-white to-transparent`}
                    >
                      {steps[activeTab].id}
                    </span>
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        {steps[activeTab].title}
                      </h2>
                      <p className="text-blue-400 font-medium">
                        {steps[activeTab].subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-slate-400 text-lg leading-relaxed mb-8">
                    {steps[activeTab].description}
                  </p>

                  <div className="space-y-4">
                    {steps[activeTab].bullets.map((bullet, i) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i}
                        className="flex items-center gap-3 text-slate-300"
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${steps[activeTab].color}`}
                        />
                        {bullet}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Column: Technical Specs & Navigation */}
            <div className="md:col-span-5 flex flex-col gap-6">
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

              {/* Mobile/Quick Nav Buttons */}
              <div className="flex gap-4">
                <button
                  disabled={activeTab === 0}
                  onClick={() => setActiveTab((prev) => prev - 1)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white p-6 rounded-2xl transition-all flex items-center justify-center"
                >
                  <ChevronLeft />
                </button>
                <button
                  disabled={activeTab === steps.length - 1}
                  onClick={() => setActiveTab((prev) => prev + 1)}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white p-6 rounded-2xl transition-all flex items-center justify-center"
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
        <div className="grid stagger-card md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaRedo className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3 reveal">
              Adaptive Correction
            </h3>
            <p className="text-slate-500 reveal">
              machining uses real-time sensor feedback to adjust feeds and
              speeds, responding to vibration or temperature changes.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaCompactDisc className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3 reveal">
              High-Speed Thimbles
            </h3>
            <p className="text-slate-500 reveal">
              Enhanced rotary thimbles and spindles reach up to 10,000 RPM for
              rapid processing of brass, aluminum, and composite shafts.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaChartLine className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3 reveal">
              Predictive Maintenance
            </h3>
            <p className="text-slate-500 reveal">
              Vibration diagnostics and thermal sensors minimize downtime,
              ensuring 99.8% machine availability for large production runs.
            </p>
          </div>
        </div>
        {/* Technical Specs Table */} {/* Technical Specs Table */}
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white stagger-card">
          <h2 className="text-4xl font-black mb-12 text-center reveal">
            Technical Specifications
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
                <span className="text-xl reveal font-bold text-blue-400">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Industrial Advantages */}
        <div className="mt-20">
          <h2 className="text-4xl font-black mb-10 reveal">
            Advanced Turning Advantages
          </h2>
          <div className="space-y-6 reveal">
            {[
              "Digital Twin Integration: Entire process mirrored in a digital ecosystem to eliminate setup errors.",
              "Sub-Micron Tolerance: Advanced linear glass scales provide the highest resolution in all axes.",
              "Lights-Out Capability: Robot-tended CNC cells allow for 24/7 unmanned production.",
              "Broad Material Spectrum: Efficiently process everything from Grade 5 Titanium to high-strength stainless steels.",
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
      </div>
    </div>
  );
};

export default CNCLatheDetail;
