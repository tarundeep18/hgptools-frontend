import React from "react";
import {
  FaCheckCircle,
  FaBolt,
  FaExpandArrowsAlt,
  FaMicrochip,
  FaLeaf,
} from "react-icons/fa";

const CNCLaserDetail = () => {
  const specs = [
    { label: "Laser Source", value: "3kW - 30kW Fiber Laser" },
    { label: "Positioning Accuracy", value: "±0.02 mm" },
    { label: "Cutting Speed", value: "Up to 60 m/min" },
    { label: "Max Sheet Size", value: "2000mm x 4000mm" },
    { label: "Material Range", value: "Reflective Metals (Copper, Brass, Al)" },
    { label: "Pulse Frequency", value: "Femtosecond / Picosecond Capable" },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <main className="max-w-7xl mx-auto py-12 px-6 lg:px-20">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center gap-3 mb-4 text-orange-600 font-bold tracking-widest text-xs uppercase">
              <FaBolt /> High-Energy Photon Processing
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              Laser Processing <br />
              <span className="text-orange-600">
                Intelligent Thermal Profiling
              </span>
            </h1>
            <p className="text-slate-600 text-xl leading-relaxed mb-8">
              Our 2026 laser center utilizes ultra-high-power fiber lasers
              integrated with AI-driven dynamic beam shaping. This allows for
              "cold" processing of delicate components and rapid-fire cutting of
              heavy-gauge aerospace alloys with zero mechanical stress.
            </p>
            <div className="flex gap-4">
              <button className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-orange-700 transition-all">
                <Link to="/contact-us">Request Quote</Link>
              </button>
            </div>
          </div>

          <div className="relative group">
            <img
              src="https://www.mazakoptonics.com"
              alt="Industrial Fiber Laser Cutter"
              className="relative rounded-[2.5rem] w-full h-[500px] object-cover shadow-2xl"
            />
          </div>
        </div>

        {/* Visual Gallery Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Laser Technology in Action
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg border border-slate-200">
              <img
                src="https://www.thefabricator.com"
                alt="Reflective Metal Cutting"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg border border-slate-200">
              <img
                src="https://www.laserfocusworld.com"
                alt="Ultrafast Pulse Processing"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg border border-slate-200">
              <img
                src="https://5.imimg.com"
                alt="Intricate Laser Cut Parts"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaMicrochip className="text-4xl text-orange-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">AI Beam Shaping</h3>
            <p className="text-slate-500">
              Dynamic beam profiling automatically adjusts the laser's energy
              distribution to optimize edge quality for different thicknesses.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaExpandArrowsAlt className="text-4xl text-orange-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Large Format Bed</h3>
            <p className="text-slate-500">
              Processing capabilities up to 4000mm in length allow for oversized
              industrial panels and high-volume nesting of small parts.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaLeaf className="text-4xl text-orange-600 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Eco-Pulse Efficiency</h3>
            <p className="text-slate-500">
              Modern fiber sources convert over 30% of energy into output,
              reducing operational costs and environmental impact by 45%.
            </p>
          </div>
        </div>

        {/* Technical Specs Table */}
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white">
          <h2 className="text-4xl font-black mb-12 text-center">
            Laser Processing Specifications
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
                <span className="text-xl font-bold text-orange-400">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Industrial Advantages */}
        <div className="mt-20">
          <h2 className="text-4xl font-black mb-10">
            Why Choose Our Laser Services?
          </h2>
          <div className="space-y-6">
            {[
              "Cold Processing: Ultrafast lasers prevent heat-affected zones (HAZ), preserving the temper of specialized alloys.",
              "Reflective Metal Mastery: Specialized optics allow stable cutting of high-purity copper, brass, and aluminum.",
              "Smart Nesting: AI software optimizes material usage to reduce waste by up to 20% compared to traditional methods.",
              "Contactless Precision: Zero physical contact means no tool wear and consistent sub-micron repeatability.",
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
              >
                <FaCheckCircle className="text-orange-600 text-2xl mt-1" />
                <p className="text-slate-700 text-lg font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CNCLaserDetail;
