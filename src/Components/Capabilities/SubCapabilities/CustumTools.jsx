import React from "react";
import {
  FaCogs,
  FaDiceD6,
  FaMicrochip,
  FaChartLine,
  FaShoppingCart,
  FaFlask,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const CustomTools = () => {
  const customServices = [
    {
      title: "Additive Tooling (3D Printed Molds)",
      desc: "Leveraging high-performance polymers and metal powders (Inconel, Titanium), we print complex internal features like conformal cooling channels that are impossible with traditional milling.",
      icon: <FaFlask className="text-blue-800" />,
      features: [
        "Conformal Cooling Channels",
        "Lattice Structure Light-weighting",
        "Rapid Insert Prototyping",
      ],
    },

    {
      title: "Specialized Cutting & Carbide Solutions",
      desc: "Custom-ground carbide inserts and nano-composite coatings (AlTiN, TiAlSiN) engineered for aerospace-grade alloys and hardened steels to ensure superior surface finishes.",
      icon: <FaCogs className="text-blue-800" />,
      features: [
        "Custom Carbide Formulations",
        "Nano-Composite Surface Finishing",
        "Ultra-Tight Tolerances",
      ],
    },
  ];

  return (
    <section className="bg-white py-24 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="text-blue-800 font-bold uppercase tracking-widest text-xs mb-3">
            Bespoke Manufacturing Solutions
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
            Custom <span className="text-blue-800">Tool Services</span>
          </h2>
          <p className="text-slate-500 mt-4 max-w-3xl text-lg">
            From concept to production, we deliver high-performance tooling
            engineered for the industrial landscape. Reduce your lead times and
            optimize every cycle with our precision-engineered solutions.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-10">
          {customServices.map((service, index) => (
            <div
              key={index}
              className="group flex flex-col p-8 border border-slate-100 rounded-[2rem] bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-2xl group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {service.title}
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed mb-8 flex-grow">
                {service.desc}
              </p>
              <div className="space-y-3">
                {service.features.map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-800" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* E-commerce Store CTA */}
        <div className="mt-20 relative overflow-hidden bg-gradient-to-r from-blue-700 to-blue-800 rounded-[3rem] p-10 md:p-16 text-white shadow-2xl">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
            <div className="max-w-xl text-center lg:text-left">
              <h3 className="text-3xl md:text-4xl font-black mb-4">
                Explore Our Tool Catalog
              </h3>
              <p className="text-indigo-100 text-lg">
                Need off-the-shelf precision components or standardized carbide
                inserts? Visit our Online Store for instant availability and
                global next-day shipping.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/shop/custom-tools"
                className="inline-flex items-center gap-3 bg-white text-blue-800 px-10 py-5 rounded-full font-black hover:bg-indigo-50 transition-all shadow-xl active:scale-95"
              >
                <FaShoppingCart className="text-xl" /> Visit Online Store
              </a>
              <button className="inline-flex items-center gap-3 border-2 border-white/30 text-white px-10 py-5 rounded-full font-black hover:bg-white/10 transition-all">
                <FaChartLine className="text-xl" />{" "}
                <Link to="/contact-us">Request Custom Quote</Link>
              </button>
            </div>
          </div>
          {/* Subtle Background Pattern */}
          <div className="absolute top-0 right-0 opacity-10 scale-150 transform translate-x-1/4 -translate-y-1/4">
            <FaCogs size={400} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomTools;
