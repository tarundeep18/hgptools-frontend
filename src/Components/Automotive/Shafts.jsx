import React, { useEffect } from "react";
import Shaft from "../../assets/Shaft.mp4";
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
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";

const shafts = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const slide = {
    src: Shaft,
    title: "Engineering Excellence, One Machined Part at a Time",
    description:
      "From initial blueprint to final inspection, we deliver high-performance tools built to your exact specifications.",
  };

  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const steps = [
    {
      id: "01",
      title: "Material Selection",
      subtitle: "Metallurgy & Forging",
      icon: <Cpu className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-400",
      description:
        "The foundation of shaft integrity depends on high-grade alloy selection and grain structure optimization.",
      bullets: [
        "ASTM Grade Carbon Steels",
        "Vacuum Degassing to remove impurities",
        "Hot Forging for superior fatigue resistance",
      ],
      technicalData: "Typical Material: AISI 4140 / 4340 Alloy Steel",
    },
    {
      id: "02",
      title: "Primary Shaping",
      subtitle: "CNC & Forging",
      icon: <Layers className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-500",
      description:
        "Transforming raw billets into near-net shapes through high-speed material removal or precision molding.",
      bullets: [
        "Heavy-duty CNC Turning centers",
        "Induction heating for forging",
        "Closed-die casting for complex geometry",
      ],
      technicalData: "Tolerance Range: ±0.05mm (Primary Stage)",
    },
    {
      id: "03",
      title: "Precision Machining",
      subtitle: "Feature Engineering",
      icon: <Zap className="w-6 h-6" />,
      color: "from-amber-500 to-orange-400",
      description:
        "Integrating power-transmission features like splines, keyways, and high-precision threads.",
      bullets: [
        "Multi-axis Milling for keyways",
        "Cold Spline Rolling for high torque",
        "Automated Drilling & Tapping",
      ],
      technicalData: "Surface Finish: Ra 1.6 to 3.2 µm",
    },
    {
      id: "04",
      title: "Thermal Treatment",
      subtitle: "Structural Hardening",
      icon: <Thermometer className="w-6 h-6" />,
      color: "from-red-500 to-rose-400",
      description:
        "Controlled thermal cycles to optimize the balance between surface hardness and core ductility.",
      bullets: [
        "Induction Hardening (750°C+)",
        "Liquid Quenching media",
        "Stress-relieving Tempering cycles",
      ],
      technicalData: "Surface Hardness: 58-62 HRC",
    },
    {
      id: "05",
      title: "Quality Assurance",
      subtitle: "Finishing & NDT",
      icon: <ShieldCheck className="w-6 h-6" />,
      color: "from-emerald-500 to-teal-400",
      description:
        "Final grinding to micron tolerances and non-destructive testing for subsurface defects.",
      bullets: [
        "Centerless Grinding for finish",
        "Magnetic Particle Inspection (MPI)",
        "Dynamic Balancing at RPM",
      ],
      technicalData: "Concentricity: < 0.005mm",
    },
  ];

  return (
    <>
      {/* hero section */}
      <div className="relative w-full h-[400px] md:h-[550px] overflow-hidden bg-black">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={slide.src} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-6 lg:px-20 flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 reveal">
              {slide.title}
            </h1>
            <p className="text-lg opacity-90 mb-6 reveal">
              {slide.description}
            </p>
            <button className="reveal bg-blue-800 hover:bg-blue-700 px-6 py-3 rounded-md font-bold uppercase text-xs tracking-widest">
              Request Quote
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-[#0f172a] py-12 px-4 flex items-center justify-center font-sans selection:bg-blue-500/30">
        <div className="max-w-6xl w-full">
          {/* Header Section */}
          <div className="mb-12 text-center reveal">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-blue-400  font-mono tracking-widest text-xs uppercase"
            >
              Industrial Manufacturing Protocol 2026
            </motion.span>
            <h1 className="text-4xl reveal md:text-5xl font-extrabold text-white mt-2 tracking-tight">
              Shaft Engineering{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Workflow
              </span>
            </h1>
          </div>

          {/* Desktop Navigation Pipeline */}
          <div className="hidden md:flex justify-between mb-12 relative px-4">
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
              <div
                className={`flex-1 rounded-3xl p-8 bg-gradient-to-br ${steps[activeTab].color} relative overflow-hidden group`}
              >
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <h4 className="text-white/80 font-mono text-sm uppercase tracking-widest">
                    Technical Specifications
                  </h4>
                  <div className="mt-8">
                    <div className="text-4xl font-bold text-white mb-2 tracking-tight leading-none">
                      Precision <br /> Standards
                    </div>
                    <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 mt-4 border border-white/10">
                      <code className="text-white text-sm">
                        {steps[activeTab].technicalData}
                      </code>
                    </div>
                  </div>
                </div>
                {/* Decorative Circle */}
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-500" />
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
    </>
  );
};

export default shafts;
