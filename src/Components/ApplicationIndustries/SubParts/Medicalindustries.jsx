import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { reveal, revealStagger } from "../../../animation/ScrollAnimation";

const products = [
  {
    title: "Surgical Instrument Housings",
    desc: "Ultra-precision CNC milled handles and housings for surgical instruments with ergonomic finishes.",
    image:
      "https://mdaltd.ca/wp-content/uploads/2024/08/precision-cnc-machining-parts-for-medical-devices-1.jpg",
  },
  {
    title: "Orthopedic Implants",
    desc: "Complex 3-axis VMC machined titanium and stainless steel implants for bone reconstruction.",
    image:
      "https://www.jycncmachining.com/js/htmledit/kindeditor/attached/20200613/20200613171139_16081.jpg",
  },
  {
    title: "Ventilator Components",
    desc: "High-tolerance manifolds and valve bodies critical for life-support ventilation systems.",
    image:
      "https://content.jdmagicbox.com/quickquotes/images_main/emergency-medical-ventilator-device-803235010-dsm0vphr.jpg?impolicy=queryparam&im=Resize=(360,360),aspect=fit",
  },
  {
    title: "CPR Device Frameworks",
    desc: "Precision-engineered internal structures and gear assemblies for automated CPR chest compression systems.",
    image:
      "https://ars.els-cdn.com/content/image/1-s2.0-S0735675716307070-gr1.jpg",
  },
  {
    title: "Diagnostic Equipment Parts",
    desc: "VMC machined aluminum and plastic chassis components for MRI and CT scanner sub-assemblies.",
    image:
      "https://5.imimg.com/data5/SELLER/Default/2024/10/459707368/NV/HK/GX/1218425/machined-medical-parts.jpg",
  },
  {
    title: "Catheter Connectors",
    desc: "Micro-machined CNC turned connectors and fittings with medical-grade biocompatible finishing.",
    image:
      "https://sc04.alicdn.com/kf/H13add4bc0dd542a79aa2d1d31ad320c6P.png_350x350.png",
  },
];

const MedicalManufacturing = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200 min-h-screen">
      {/* Hero Section - Medical Focused */}
      <section className="relative bg-white text-slate-900 py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,#0284c7,transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="reveal inline-block mb-4 px-4 py-1 text-sm font-semibold rounded-full bg-blue-800 text-white">
              Medical Industries
            </span>
            <h1 className="reveal text-4xl md:text-6xl font-extrabold leading-tight text-slate-900">
              Life-Critical{" "}
              <span className="text-blue-800">Precision Engineering</span> for
              Healthcare
            </h1>
            <p className="reveal mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              Utilizing advanced 3-axis VMC and Swiss CNC technology to
              manufacture high-tolerance components for ventilators, surgical
              and life-saving CPR equipment.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 reveal">
              <button className="px-8 py-4 rounded-xl bg-blue-800 text-white font-semibold hover:bg-blue-700 transition shadow-lg shadow-sky-200">
                <Link to="/quote">Get Medical Quote</Link>
              </button>
            </div>
          </div>

          <div className="relative reveal">
            <div className="absolute -inset-4 bg-sky-100 rounded-3xl blur-xl opacity-50" />
            <img
              src="https://www.isbr.in/blogs/wp-content/uploads/2023/06/PGDM-in-Healthcare-Management.jpg"
              alt="Medical CNC Machining"
              className="relative rounded-3xl shadow-2xl border border-slate-200 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-sky-900/20 rounded-full blur-3xl" />

        <div className="relative text-center mb-16">
          <div className="inline-block mb-4 reveal">
            <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
              Technical Excellence
            </span>
          </div>
          <h2 className="text-4xl reveal md:text-5xl font-bold text-white mb-6">
            Medical Grade{" "}
            <span className="text-blue-400">CNC & VMC Solutions</span>
          </h2>
          <p className="text-lg reveal text-slate-400 max-w-3xl mx-auto">
            Meeting the stringent requirements of the medical industry through
            automated machining and rigorous quality control protocols.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative stagger-card">
          {[
            {
              title: "Multi-Axis VMC Machining",
              desc: "High-speed Vertical Machining Centers optimized for complex geometries in implants and surgical tools.",
              icon: (
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              ),
              gradient: "from-sky-500/20 to-blue-500/20",
            },
            {
              title: "Biocompatible Material Expertise",
              desc: "Specialized in machining Titanium (Grade 5), Stainless Steel 316L, and medical-grade PEEK plastics.",
              icon: (
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              ),
              gradient: "from-blue-500/20 to-indigo-500/20",
            },
            {
              title: "Sterilization-Ready Finishing",
              desc: "Surface treatments and finishing processes designed to withstand repeated autoclave and chemical sterilization.",
              icon: (
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              ),
              gradient: "from-indigo-500/20 to-sky-500/20",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300"
            >
              <div
                className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${item.gradient} text-blue-400 mb-6 group-hover:scale-110 transition-transform`}
              >
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                {item.title}
              </h3>
              <p className="text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Showcase */}
      <section className="relative py-24 overflow-hidden ">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="reveal text-sm font-semibold text-blue-400 uppercase tracking-wider">
                Our Portfolio
              </span>
            </div>
            <h2 className=" reveal text-4xl md:text-5xl font-bold text-white mb-6">
              Precision <span className="text-blue-400">Components</span>
            </h2>
            <p className="reveal text-lg text-slate-400 max-w-3xl mx-auto">
              High-quality electrical and electronic parts manufactured with
              consistent excellence and performance-driven design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 stagger-card">
            {products.map((product, idx) => (
              <div
                key={idx}
                className="group relative bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-blue-800/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/5"
              >
                <div className="relative overflow-hidden">
                  <div className="h-56 overflow-hidden reveal">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-fit group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl reveal font-bold text-white group-hover:text-blue-400 transition-colors">
                      {product.title}
                    </h3>
                    <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                      <svg
                        className="w-5 h-5 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>

                  <p className="text-slate-400 reveal mb-6 leading-relaxed">
                    {product.desc}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <span className="text-sm text-slate-500 reveal">
                      Available in various specifications
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <button className="group px-8 py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 inline-flex items-center gap-2">
              <span>View All Products</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MedicalManufacturing;
