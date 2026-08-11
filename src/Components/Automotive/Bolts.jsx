import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings,
  Zap,
  ShieldCheck,
  Thermometer,
  Droplets,
  Database,
  Shield,
  Info,
  Scale,
  ChevronRight,
  Factory,
  TrendingUp,
  CheckCircle,
  Award,
  TestTube2,
  Hammer,
  Gauge,
  FileCheck,
} from "lucide-react";
import video1 from "../../assets/bolts.mp4";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";

const Bolts = () => {
  const [activeTab, setActiveTab] = useState("bolts");

  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const steelGrades = [
    {
      grade: "8.8",
      subtitle: "Medium Carbon Steel",
      composition: "0.15–0.40% Carbon, with Boron or Manganese additives.",
      strength: "800 MPa",
      strengthLabel: "Tensile Strength",
      use: "Common automotive and structural projects.",
      color: "from-blue-500 to-blue-700",
      icon: <Gauge className="w-5 h-5" />,
    },
    {
      grade: "10.9",
      subtitle: "Alloy Steel",
      composition: "High carbon or alloy steel (Cr, Mo) quenched & tempered.",
      strength: "1040 MPa",
      strengthLabel: "Tensile Strength",
      use: "High-stress machinery and seismic structural joints.",
      color: "from-emerald-500 to-emerald-700",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      grade: "12.9",
      subtitle: "High Alloy Steel",
      composition:
        "High-grade alloy steel (Cr, Ni, Mo, V) with max hardenability.",
      strength: "1220 MPa",
      strengthLabel: "Tensile Strength",
      use: "Critical engine parts and heavy industrial tools.",
      color: "from-violet-500 to-violet-700",
      icon: <Award className="w-5 h-5" />,
    },
  ];

  const coatings = [
    {
      name: "Zinc Plating",
      benefit: "Cost-effective, uniform finish, moderate rust resistance.",
      environment: "Indoor/Dry Environments",
      thickness: "5-15 μm",
      icon: <Droplets className="w-5 h-5" />,
      color: "bg-blue-500/10 border-blue-200",
    },
    {
      name: "Hot-Dip Galvanizing",
      benefit: "Thick metallurgical bond with zinc; superior durability.",
      environment: "Outdoor/Marine Environments",
      thickness: "45-85 μm",
      icon: <Thermometer className="w-5 h-5" />,
      color: "bg-amber-500/10 border-amber-200",
    },
    {
      name: "Black Oxide",
      benefit:
        "No dimensional change; sleek look; requires oil for rust protection.",
      environment: "Precision Tools",
      thickness: "1-2 μm",
      icon: <Shield className="w-5 h-5" />,
      color: "bg-gray-500/10 border-gray-200",
    },
  ];

  const boltSteps = [
    {
      title: "Wire Preparation",
      desc: "Steel wire is uncoiled, straightened, and drawn through dies to achieve precision diameter.",
      icon: <Settings className="w-5 h-5" />,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Cold Forging",
      desc: "The wire is cut and 'headed' using immense pressure to mold the bolt head at room temperature.",
      icon: <Hammer className="w-5 h-5" />,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "Thread Rolling",
      desc: "Bolts are rolled between hardened dies. This presses threads into the steel rather than cutting them, increasing structural integrity.",
      icon: <Settings className="w-5 h-5" />,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Heat Treatment",
      desc: "Quenching and tempering processes harden the steel while ensuring it isn't too brittle.",
      icon: <Thermometer className="w-5 h-5" />,
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Surface Coating",
      desc: "Finishing with Zinc, Hot-Dip Galvanizing, or Black Oxide to provide corrosion resistance.",
      icon: <Droplets className="w-5 h-5" />,
      gradient: "from-indigo-500 to-blue-500",
    },
  ];

  const nutSteps = [
    {
      title: "Blanking & Heading",
      desc: "Steel bars are cut and forged into the classic hexagonal shape.",
      icon: <Settings className="w-5 h-5" />,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Punching",
      desc: "A high-precision hole is punched through the center of the hex blank.",
      icon: <Zap className="w-5 h-5" />,
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      title: "Tapping",
      desc: "Internal threads are cut or formed inside the hole using a specialized rotating tool called a tap.",
      icon: <Settings className="w-5 h-5" />,
      gradient: "from-violet-500 to-purple-500",
    },
    {
      title: "Hardening",
      desc: "Like bolts, nuts undergo heat treatment to match the strength grade of their counterparts.",
      icon: <ShieldCheck className="w-5 h-5" />,
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95   z-10" />
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={video1} type="video/mp4" />
        </video>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 reveal mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Factory className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm  font-semibold text-blue-400 uppercase tracking-wider">
                Industrial Manufacturing
              </span>
            </div>

            <h1 className="text-4xl reveal md:text-6xl font-bold text-white mb-6 leading-tight">
              Precision Engineered
              <span className="block text-blue-400">Fastener Solutions</span>
            </h1>

            <p className="text-xl reveal text-slate-200 mb-8 leading-relaxed max-w-2xl">
              From initial blueprint to final inspection, we deliver
              high-performance tools built to your exact specifications.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 reveal">
              <Link
                to="/contact-us"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Request Custom Quote
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {/* <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                View Technical Specifications
              </button> */}
            </div>
          </div>
        </div>
      </section>

      {/* ================= GRADE COMPARISON SECTION ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center reveal gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-semibold mb-4">
              <Database className="w-4 h-4" />
              ISO 898-1 Certified
            </div>
            <h2 className="text-3xl md:text-4xl reveal font-bold text-slate-900 mb-4">
              Fastener Property Classes
            </h2>
            <p className="text-lg reveal text-slate-600 max-w-3xl mx-auto">
              Select the optimal grade for your application with our engineered
              steel solutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-card">
            {steelGrades.map((grade, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${grade.color} rounded-t-2xl`}
                />

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2 ">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${grade.color} text-white text-sm font-bold`}
                    >
                      {grade.icon}
                      Grade {grade.grade}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {grade.subtitle}
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-500 mb-1">
                      Chemistry
                    </h4>
                    <p className="text-slate-700">{grade.composition}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
                    <div className="text-2xl font-bold text-slate-900">
                      {grade.strength}
                    </div>
                    <div className="text-sm text-slate-600">
                      {grade.strengthLabel}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">
                    Best For
                  </h4>
                  <p className="text-slate-700">{grade.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SURFACE FINISHING SECTION ================= */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center reveal gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 font-semibold mb-4">
              <ShieldCheck className="w-4 h-4" />
              Corrosion Protection
            </div>
            <h2 className="text-3xl md:text-4xl reveal font-bold text-white mb-4">
              Surface Finishing & Protection
            </h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto reveal">
              Advanced coatings engineered for maximum durability in any
              environment
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-card">
            {coatings.map((coating, index) => (
              <div
                key={index}
                className={`${coating.color} rounded-2xl border p-8 backdrop-blur-sm hover:transform hover:-translate-y-2 transition-all duration-300`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 rounded-xl text-white reveal bg-white/10">
                    {coating.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white reveal">
                    {coating.name}
                  </h3>
                </div>

                <p className="text-slate-200 mb-6 leading-relaxed reveal">
                  {coating.benefit}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                    <span className="text-sm text-slate-300">Thickness</span>
                    <span className="font-bold text-white reveal">
                      {coating.thickness}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 reveal">
                      {coating.environment}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Insight Card */}
          <div className="mt-16 bg-gradient-to-r reveal from-blue-900/50 to-blue-800/50 rounded-2xl p-8 border border-blue-700/50 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl reveal bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                  <Scale className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-white mb-2 reveal">
                  Selection Insight: A325 vs A490
                </h4>
                <p className="text-slate-200 leading-relaxed reveal">
                  In heavy construction,{" "}
                  <strong className="text-blue-300">ASTM A325</strong> (Medium
                  Carbon) is preferred for bridge work due to its compatibility
                  with hot-dip galvanizing.
                  <strong className="text-amber-300"> ASTM A490</strong> (Alloy
                  Steel) offers superior strength but cannot be galvanized due
                  to the risk of Hydrogen Embrittlement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MANUFACTURING PROCESS SECTION ================= */}
      <section className="py-20 bg-white stagger-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 font-semibold mb-4">
              <Factory className="w-4 h-4" />
              Manufacturing Excellence
            </div>
            <h2 className="text-3xl md:text-4xl reveal font-bold text-slate-900 mb-4">
              Precision Engineering Process
            </h2>
            <p className="text-lg text-slate-600 reveal max-w-3xl mx-auto">
              How we engineer fasteners for unmatched strength and reliability
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12 reveal">
            <div className="inline-flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("bolts")}
                className={`flex items-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all ${
                  activeTab === "bolts"
                    ? "bg-white text-blue-600 shadow-lg"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Settings className="w-5 h-5" />
                Bolt Manufacturing
              </button>
              <button
                onClick={() => setActiveTab("nuts")}
                className={`flex items-center gap-2 px-8 py-4 rounded-lg font-semibold transition-all ${
                  activeTab === "nuts"
                    ? "bg-white text-blue-600 shadow-lg"
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Settings className="w-5 h-5" />
                Nut Manufacturing
              </button>
            </div>
          </div>

          {/* Process Timeline */}
          <div className="relative max-w-4xl mx-auto reveal">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/20 via-blue-500/50 to-blue-500/20" />

            {(activeTab === "bolts" ? boltSteps : nutSteps).map(
              (step, index) => (
                <div key={index} className="relative mb-12 pl-24">
                  <div
                    className={`absolute left-0 w-16 h-16 rounded-2xl bg-gradient-to-r ${step.gradient} flex items-center justify-center text-white shadow-lg ring-8 ring-white`}
                  >
                    {step.icon}
                  </div>

                  <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-8 border border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                        Step {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-2xl font-bold text-slate-900 reveal">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed reveal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Quality Control Section */}
          <div className="mt-20 bg-gradient-to-r reveal from-blue-900 to-blue-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 reveal h-12 rounded-full bg-blue-400/20 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white reveal">
                      Final Quality Assurance
                    </h3>
                  </div>
                  <p className="text-blue-100 reveal">
                    Every fastener undergoes rigorous testing to exceed industry
                    standards
                  </p>
                </div>
                <div className="flex items-center gap-2 text-white reveal">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">ISO 9001:2015 Certified</span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 stagger-card">
                {[
                  {
                    title: "Tensile Testing",
                    desc: "Ensures the bolt can handle extreme loads without snapping.",
                    icon: <TestTube2 className="w-5 h-5 text-white" />,
                    value: "≥ 1220 MPa",
                  },
                  {
                    title: "Hardness Check",
                    desc: "Verifies the efficacy of the quenching/tempering cycle.",
                    icon: <Gauge className="w-5 h-5 text-white" />,
                    value: "39-44 HRC",
                  },
                  {
                    title: "Dimensional Verification",
                    desc: "Micrometer checks to meet ISO/ASTM standards.",
                    icon: <FileCheck className="w-5 h-5 text-white" />,
                    value: "±0.01mm",
                  },
                ].map((test, index) => (
                  <div
                    key={index}
                    className="bg-blue-800/30 backdrop-blur-sm rounded-xl p-6 border border-blue-700/30"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 rounded-lg bg-blue-700/50 reveal">
                        {test.icon}
                      </div>
                      <span className="text-lg font-bold text-white reveal">
                        {test.value}
                      </span>
                    </div>
                    <h4 className="font-bold text-white mb-2 reveal">
                      {test.title}
                    </h4>
                    <p className="text-blue-200 text-sm reveal">{test.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="bg-gradient-to-r from-slate-50 to-white rounded-2xl p-12 border border-slate-200 shadow-xl">
              <h3 className="text-2xl md:text-3xl reveal font-bold text-slate-900 mb-4">
                Ready to Elevate Your Project?
              </h3>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto reveal">
                Connect with our engineering team for custom fastener solutions
                and technical support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/contact-us"
                  className="group inline-flex reveal items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Request Engineering Consultation
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Bolts;
