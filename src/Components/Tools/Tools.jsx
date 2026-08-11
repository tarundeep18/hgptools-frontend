import React from "react";
import {
  FaShoppingCart,
  FaSearch,
  FaBoxOpen,
  FaTruck,
  FaShieldAlt,
  FaArrowRight,
  FaTools,
  FaMicroscope,
  FaCogs,
  FaIndustry,
} from "react-icons/fa";

const Tools = () => {
  const toolCategories = [
    {
      title: "Precision Cutting Tools",
      desc: "High-performance tools engineered for CNC & VMC machining accuracy.",
      items: [
        "Carbide End Mills",
        "HSS & Carbide Drill Bits",
        "Indexable Inserts",
        "Reamers",
      ],
      icon: <FaTools className="text-blue-800" />,
    },
    {
      title: "Metrology & Measurement",
      desc: "Reliable inspection instruments to maintain micron-level tolerances.",
      items: [
        "Digital Calipers",
        "Micrometers",
        "Bore Gauges",
        "Height Gauges",
      ],
      icon: <FaMicroscope className="text-blue-800" />,
    },
    {
      title: "Workholding Solutions",
      desc: "Stable and repeatable clamping systems for production environments.",
      items: [
        "Precision Vises",
        "Collet Chucks",
        "Magnetic Plates",
        "Clamping Kits",
      ],
      icon: <FaBoxOpen className="text-blue-600" />,
    },
  ];

  return (
    <>
      <section className="bg-white py-24 px-6 lg:px-20 font-sans">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-20 grid lg:grid-cols-2 gap-12 items-center">
            {/* LEFT CONTENT */}
            <div className="max-w-3xl">
              <span className="text-blue-800 font-bold uppercase tracking-[0.35em] text-xs">
                HGP Tools Division
              </span>

              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mt-4 leading-tight">
                Industrial Tools & <br />
                <span className="text-blue-800">Custom Manufacturing</span>
              </h1>

              <p className="text-slate-600 mt-6 text-lg leading-relaxed">
                We supply a wide range of industrial tools for machining,
                inspection, and production support. Along with standard tools,
                we also specialize in <strong>custom-made tools</strong>{" "}
                manufactured using CNC, VMC, and press operations.
              </p>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <div className="relative z-10 rounded-3xl overflow-hidden  ">
                <img
                  src="https://www.fictiv.com/wp-content/uploads/2021/05/image2-1.jpg"
                  alt="Industrial CNC tools and machining"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Decorative background accent */}
              <div className="absolute -bottom-8 -right-8 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>
            </div>
          </div>

          {/* Tool Categories */}
          <div className="grid lg:grid-cols-3 gap-8 mb-24">
            {toolCategories.map((cat, idx) => (
              <div
                key={idx}
                className="group bg-white border border-slate-200 rounded-3xl p-8 hover:shadow-2xl transition-all duration-500"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl mb-6">
                  {cat.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {cat.title}
                </h3>
                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                  {cat.desc}
                </p>
                <ul className="space-y-4">
                  {cat.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-slate-600 font-medium"
                    >
                      {item}
                      <FaArrowRight className="text-[10px] opacity-60" />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Custom Tool Manufacturing */}
          <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-10 md:p-16 mb-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6">
                  Custom Tool{" "}
                  <span className="text-blue-800">Manufacturing</span>
                </h2>
                <p className="text-slate-600 text-lg leading-relaxed mb-8">
                  If your application requires a non-standard or
                  application-specific tool, our engineering team can design and
                  manufacture it as per your drawings or functional
                  requirements.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <FaCogs className="text-blue-800 text-xl" />
                    <span className="font-semibold text-sm">
                      CNC & VMC Machining
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaIndustry className="text-blue-800 text-xl" />
                    <span className="font-semibold text-sm">
                      Press & Fabrication Tools
                    </span>
                  </div>
                </div>

                <p className="text-slate-500 mt-8 text-sm">
                  Suitable for jigs, fixtures, special cutters, gauges, press
                  tools, and low-to-medium batch production tooling.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <h4 className="font-bold text-slate-900 mb-6 text-lg">
                  Who We Serve
                </h4>
                <ul className="space-y-4 text-slate-600 text-sm">
                  <li>• Manufacturing & Production Units</li>
                  <li>• OEMs & Tier-1 / Tier-2 Suppliers</li>
                  <li>• Maintenance & Tool Rooms</li>
                  <li>• R&D and Prototype Development Teams</li>
                </ul>
              </div>
            </div>
          </div>

          {/* eCommerce CTA */}
          <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white">
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                  HGP Online <br />
                  <span className="text-blue-500 underline decoration-blue-800 underline-offset-8">
                    Global Store
                  </span>
                </h3>
                <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                  Looking for ready-to-use industrial tools? Visit our online
                  tool store. Need something specific? Contact us for custom
                  tool manufacturing based on your drawings or application
                  needs.
                </p>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="flex items-center gap-3">
                    <FaTruck className="text-blue-800 text-xl" />
                    <span className="text-sm font-bold">Express Shipping</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaShieldAlt className="text-blue-800 text-xl" />
                    <span className="text-sm font-bold">100% Certified</span>
                  </div>
                </div>

                <a
                  href="https://shop.hgptools.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-4 bg-blue-800 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  <FaShoppingCart /> Enter Live Shop
                </a>
                <a
                  href="https://shop.hgptools.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center ml-8 gap-4 bg-blue-800 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                >
                  <FaTools /> Custom Tool
                </a>
              </div>

              <div className="relative hidden lg:block">
                {/* Decorative "Storefront" UI element */}
                <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-2xl">
                  <div className="flex items-center justify-between mb-8 border-b border-slate-700 pb-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="bg-slate-700 px-4 py-1 rounded-md text-[10px] font-mono">
                      shop.hgptools.com
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex gap-4 items-center bg-slate-900/50 p-4 rounded-xl border border-slate-700/50"
                      >
                        <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
                        <div className="flex-grow">
                          <div className="h-3 w-24 bg-slate-700 rounded mb-2"></div>
                          <div className="h-2 w-16 bg-slate-800 rounded"></div>
                        </div>
                        <div className="h-8 w-20 bg-blue-600/20 border border-blue-600/30 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Floating Icon */}
                <div className="absolute -top-6 -right-6 bg-blue-800 p-6 rounded-full shadow-2xl animate-bounce">
                  <FaSearch className="text-2xl text-white" />
                </div>
              </div>
            </div>

            {/* Background Gradient Blur */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Tools;
