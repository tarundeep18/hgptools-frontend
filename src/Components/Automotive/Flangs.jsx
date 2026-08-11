import React, { useEffect } from "react";
import {
  Settings,
  Layers,
  Zap,
  Shield,
  Target,
  Award,
  Info,
  Wrench,
  Factory,
  ChevronRight,
  CheckCircle,
  Gauge,
  Thermometer,
  Users,
  Download,
  Clock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import video1 from "../../assets/circle.mp4";
import { Link } from "react-router-dom";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";

const Flangs = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const processes = [
    {
      name: "CNC Turning",
      desc: "Precise cylindrical forms with high concentricity and superior surface finish.",
      icon: <Settings className="w-6 h-6" />,
      specs: ["±0.01mm accuracy", "5-axis simultaneous", "Ra 0.4μm finish"],
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "CNC Milling",
      desc: "Intricate geometries and tight-tolerance features for complex components.",
      icon: <Layers className="w-6 h-6" />,
      specs: [
        "5-axis capability",
        "High-speed machining",
        "±0.005mm tolerance",
      ],
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      name: "Precision Grinding",
      desc: "Superior surface finishes and micron-level accuracy for critical applications.",
      icon: <Zap className="w-6 h-6" />,
      specs: ["Ra 0.1μm finish", "Cylindrical/ID grinding", "Mirror finishes"],
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  const materials = [
    {
      type: "Stainless Steel",
      subtitle: "Corrosion Resistant",
      application: "Food processing, chemical, and marine industries.",
      grade: "304, 316L, 17-4PH",
      properties: [
        "High corrosion resistance",
        "Excellent weldability",
        "Food-safe",
      ],
      color: "bg-blue-500/10 border-blue-200",
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
    },
    {
      type: "Alloy Steel",
      subtitle: "High-Strength",
      application: "Automotive, heavy machinery, and construction equipment.",
      grade: "4140, 4340, 8620",
      properties: [
        "High tensile strength",
        "Excellent toughness",
        "Heat treatable",
      ],
      color: "bg-amber-500/10 border-amber-200",
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
    },
    {
      type: "Aluminum Alloys",
      subtitle: "Lightweight Performance",
      application: "Aerospace, electronics, and automotive lightweighting.",
      grade: "6061-T6, 7075, 2024",
      properties: [
        "High strength-to-weight",
        "Excellent machinability",
        "Corrosion resistant",
      ],
      color: "bg-slate-500/10 border-slate-200",
      icon: <Sparkles className="w-5 h-5 text-slate-600" />,
    },
  ];

  const qualityStandards = [
    {
      label: "Dimensional Accuracy",
      value: "±0.05mm",
      icon: <Target className="w-5 h-5" />,
    },
    {
      label: "Surface Finish",
      value: "Ra 0.4μm",
      icon: <Gauge className="w-5 h-5" />,
    },
    {
      label: "Hardness Testing",
      value: "HRC 30-45",
      icon: <Thermometer className="w-5 h-5" />,
    },
    {
      label: "Lead Time",
      value: "2-4 Weeks",
      icon: <Clock className="w-5 h-5" />,
    },
  ];

  const slide = {
    src: video1,
    title: "Precision Engineered Flanges & Machined Components",
    description:
      "From initial blueprint to final inspection, we deliver high-performance components built to your exact specifications.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95  z-10" />
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={slide.src} type="video/mp4" />
        </video>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="reveal w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Factory className="w-6  h-6 text-blue-400" />
              </div>
              <span className="text-sm font-semibold reveal text-blue-400 uppercase tracking-wider">
                Precision Manufacturing
              </span>
            </div>

            <h1 className="reveal text-4xl reveal md:text-6xl font-bold text-white mb-6 leading-tight">
              Industrial Flanges &
              <span className="block text-blue-400">Machined Components</span>
            </h1>

            <p className="text-xl reveal text-slate-200 mb-8 leading-relaxed max-w-2xl">
              High-precision CNC machined rings and flanges engineered for
              critical applications in demanding industries.
            </p>

            <div className="flex reveal flex-col sm:flex-row gap-4">
              <Link
                to="/contact-us"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Request Quote
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              {/* <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                Download Technical Catalog
              </button> */}
            </div>
          </div>
        </div>
      </section>

      {/* ================= QUALITY STANDARDS ================= */}
      <section className="py-12 bg-white stagger-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {qualityStandards.map((standard, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 reveal rounded-lg bg-blue-500/10">
                    {standard.icon}
                  </div>
                  <div>
                    <div className="text-2xl reveal font-bold text-slate-900">
                      {standard.value}
                    </div>
                    <div className="text-sm reveal text-slate-600">
                      {standard.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= KNOWLEDGE SECTION ================= */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-800 font-semibold mb-4">
              <Award className="w-4 h-4" />
              Engineering Excellence
            </div>
            <h2 className="reveal text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Precision Machined Rings & Flanges
            </h2>
            <p className="reveal text-lg text-slate-600 max-w-3xl mx-auto">
              Seamless components engineered for zero-failure performance in
              critical applications
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 stagger-card">
            <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-blue-800 flex items-center justify-center">
                  <Info className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 reveal">
                  What Are They?
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4 reveal">
                Machined rings are precision-engineered circular components
                manufactured via advanced CNC processes. Unlike cast
                alternatives, they offer superior structural integrity with zero
                porosity for high-pressure environments.
              </p>
              <div className="reveal flex items-center gap-2 text-sm text-blue-600 font-semibold">
                <CheckCircle className="w-4 h-4" />
                Superior to cast components
              </div>
            </div>

            <div className="group stagger-card bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Factory className="w-7 h-7 text-white" />
                </div>
                <h3 className="reveal text-xl font-bold text-slate-900">
                  Where Are They Used?
                </h3>
              </div>
              <p className="reveal text-slate-600 leading-relaxed mb-4">
                Essential in HGP Tool systems, hydraulic cylinders, bearing
                races, aerospace turbines, and industrial machinery where
                failure-proof sealing and precision rotation are mandatory.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  "Hydraulic Systems",
                  "Aerospace",
                  "Power Generation",
                  "Industrial Machinery",
                ].map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 reveal">
                  How Are They Built?
                </h3>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4 reveal">
                Starting from forged blanks, we utilize subtractive machining
                techniques including rough turning, heat treatment for optimal
                hardness, and final diamond-tip grinding for micron-level
                precision.
              </p>
              <div className="reveal flex items-center gap-2 text-sm text-violet-600 font-semibold">
                <Zap className="w-4 h-4" />
                Advanced manufacturing process
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MANUFACTURING PROCESSES ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Processes Column */}
            <div>
              <div className="mb-10">
                <div className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-800 font-semibold mb-4">
                  <Settings className="w-4 h-4" />
                  Manufacturing Excellence
                </div>
                <h2 className="reveal text-3xl font-bold text-slate-900 mb-4">
                  Advanced Manufacturing Stack
                </h2>
                <p className="text-slate-600 reveal">
                  Our multi-step CNC processes ensure precision and reliability
                  for every component
                </p>
              </div>

              <div className="space-y-6 stagger-card">
                {processes.map((process, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500" />

                    <div className="flex items-start gap-4">
                      <div
                        className={`reveal w-12 h-12 rounded-xl bg-gradient-to-r ${process.gradient} flex items-center justify-center`}
                      >
                        {process.icon}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl reveal font-bold text-slate-900">
                            {process.name}
                          </h3>
                          <span className="text-xs font-bold text-blue-800  px-3 py-1 rounded-full">
                            Step {index + 1}
                          </span>
                        </div>
                        <p className="text-slate-600 mb-4 reveal">
                          {process.desc}
                        </p>

                        <div className="flex flex-wrap gap-2 reveal">
                          {process.specs.map((spec, i) => (
                            <span
                              key={i}
                              className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-700 rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials Column */}
            <div>
              <div className="mb-10">
                <div className="inline-flex reveal items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-semibold mb-4">
                  <Layers className="w-4 h-4 " />
                  Material Expertise
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4 reveal">
                  Engineered Materials
                </h2>
                <p className="text-slate-600 reveal">
                  Select from our range of premium materials optimized for
                  specific applications
                </p>
              </div>

              <div className="space-y-6 staagger-card">
                {materials.map((material, index) => (
                  <div
                    key={index}
                    className={`group ${material.color} rounded-2xl border p-6 hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 reveal rounded-lg bg-white">
                          {material.icon}
                        </div>
                        <div>
                          <h3 className="text-xl reveal font-bold text-slate-900">
                            {material.type}
                          </h3>
                          <p className="text-sm reveal text-slate-600">
                            {material.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs reveal font-bold px-3 py-1 bg-white/80 rounded-full">
                        {material.grade}
                      </span>
                    </div>

                    <p className="text-slate-700 mb-4 reveal">
                      {material.application}
                    </p>

                    <div className="space-y-2 reveal">
                      {material.properties.map((prop, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-slate-700">{prop}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Product Showcase */}
                {/* <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-slate-900/30" />
                  <div className="relative bg-gradient-to-br from-slate-900 to-blue-900 p-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                      <div className="text-white">
                        <h3 className="text-2xl font-bold mb-2 reveal">
                          Precision Flange Showcase
                        </h3>
                        <p className="text-blue-200 reveal">
                          Explore our complete range of CNC machined components
                          for industrial applications
                        </p>
                        <div className="flex items-center gap-4 mt-6">
                          <div className="flex items-center gap-2  reveal">
                            <Award className="w-5 h-5 text-blue-300" />
                            <span className="text-sm">
                              ISO 9001:2015 Certified
                            </span>
                          </div>
                          <div className="flex items-center gap-2 reveal">
                            <Users className="w-5 h-5 text-blue-300" />
                            <span className="text-sm">
                              Expert Engineering Support
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 reveal">
                        <Link
                          to="/contact-us"
                          className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg"
                        >
                          Request Custom Quote
                          <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= RELATED PRODUCTS ================= */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 reveal">
              Related Industrial Products
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto reveal">
              Complete your industrial solution with our range of
              precision-engineered components
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-card">
            {[
              { name: "Pneumatic Hog Ring Pliers", category: "Assembly Tools" },
              {
                name: "Hydraulic Guide Rings",
                category: "Hydraulic Components",
              },
              { name: "HTP Sprayer Spares", category: "Agricultural Parts" },
              {
                name: "CNC Machined Flanges",
                category: "Precision Components",
              },
            ].map((product, index) => (
              <a
                key={index}
                href="#"
                className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
              >
                <div className="mb-4">
                  <span className="text-xs reveal font-semibold text-blue-800 bg-blue-50 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
                <h4 className="font-bold reveal text-slate-900 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h4>
              </a>
            ))}
          </div>

          {/* Final CTA */}
          <div className="mt-20 text-center">
            <div className="bg-blue-800 text-white rounded-2xl p-12 shadow-2xl">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 reveal">
                Ready to Engineer Your Solution?
              </h3>
              <p className="text-blue-200 mb-8 max-w-2xl mx-auto reveal">
                Connect with our engineering team for custom component design,
                technical specifications, and manufacturing support.
              </p>
              <button>
                <Link
                  to="/quote"
                  className="group inline-flex items-center justify-center px-8 py-4  text-white font-semibold rounded-xl"
                >
                  Request Custom Quote
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Flangs;
