import React, { useEffect } from "react";
import AerospaceImg from "../../../assets/aerospace-parts-removebg-preview.png";
import { Link } from "react-router-dom";
import BrassImg from "../../../assets/brass-terminals.jpg";
import BussBarImg from "../../../assets/bus-03-removebg-preview.png";
import { reveal, revealStagger } from "../../../animation/ScrollAnimation";
import stampingImg from "../../../assets/stamping.jpg";

const products = [
  {
    title: "Precision Stamping",
    desc: "High-accuracy metal stamping solutions for electrical and electronic components.",
    image: stampingImg,
  },
  {
    title: "Brass Terminals",
    desc: "Durable and conductive brass terminals manufactured using CNC machines.",
    image: BrassImg,
  },
  {
    title: "Bus Bars",
    desc: "Custom-designed copper and aluminum bus bars for power distribution systems.",
    image: "https://www.trade4asia.com/MultiImage/bus-03.png",
  },
  {
    title: "Electrical Enclosures",
    desc: "Precision-engineered enclosures ensuring safety and reliability of electronics.",
    image:
      "https://tiimg.tistatic.com/fp/1/004/886/electrical-control-panel-enclosures-068.jpg",
  },
  {
    title: "Machined Parts",
    desc: "High-tolerance CNC & VNC machined parts for electrical and electronic industries.",
    image: "https://5.imimg.com/data5/TD/EB/MY-102356/cnc-500x500.jpg",
  },
  {
    title: "Custom Components",
    desc: "Bespoke solutions tailored to your specific electrical manufacturing needs.",
    image:
      "https://mssinternational.com/Website-content/Page%20content/Articles/Resources/bespoke-assemblies/Assembly-selection.jpg",
  },
];

const ElectricalManufacturing = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  return (
    <div className="bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200 min-h-screen">
      {/* Hero Section - Enhanced */}
      <section className="relative bg-slate-50  text-white py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top,white,transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="reveal inline-block mb-4 px-4 py-1 text-sm font-semibold rounded-full bg-blue-800">
              Electronics And Electricial Manufacturing
            </span>
            <h1 className="reveal text-4xl md:text-6xl font-extrabold leading-tight text-black">
              Extending Proven{" "}
              <span className="text-blue-800 ">Precision Manufacturing</span>{" "}
              into Electronics
            </h1>
            <p className="reveal mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              Our electrical and electronics manufacturing approach is grounded
              in precision, transparency, and process reliability — focusing on
              components we can deliver consistently and responsibly.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 reveal">
              <button className="px-8 py-4 rounded-xl bg-blue-800 text-white font-semibold hover:bg-blue-900 transition">
                <Link to="/quote">Request Quote</Link>
              </button>
              {/* <button className="px-8 py-4 rounded-xl border border-white/40 hover:bg-white/10 transition">
                View Capabilities
              </button> */}
            </div>
          </div>

          <div className="relative reveal">
            <div className="absolute -inset-6 rounded-3xl " />
            <img
              src="https://www.rapiddirect.com/wp-content/uploads/2022/07/image-2.png"
              alt="Power Press Tool Manufacturing"
              className="relative rounded-3xl  object-cover"
            />
          </div>
        </div>
      </section>

      {/* Capabilities Section - Enhanced */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" />

        <div className="relative text-center mb-16">
          <div className="inline-block mb-4">
            <span className="reveal text-sm font-semibold text-blue-400 uppercase tracking-wider">
              What We Offer
            </span>
          </div>
          <h2 className="reveal text-4xl md:text-5xl font-bold text-white mb-6">
            Advanced Manufacturing{" "}
            <span className="text-blue-400">Capabilities</span>
          </h2>
          <p className="reveal text-lg text-slate-400 max-w-3xl mx-auto">
            Leveraging cutting-edge technology and precision engineering to
            deliver exceptional quality in every component.
          </p>
        </div>

        <div className="reveal grid md:grid-cols-3 gap-8 relative stagger-card">
          {[
            {
              title: "Advanced CNC & VNC Machining",
              desc: "State-of-the-art Multi-Axis machining for complex electrical components with micron-level precision.",
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ),
            },
            {
              title: "High Precision & Tight Tolerances",
              desc: "Maintaining accuracy within ±0.005mm for reliable and consistent component performance.",
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
            },
            {
              title: "Scalable Production & OEM Support",
              desc: "Flexible manufacturing capacity supporting projects from prototyping to full-scale production.",
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              ),
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group relative bg-gradient-to-br from-slate-900/50 to-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/10"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br rounded-2xl transition-opacity duration-500`}
              />
              <div className="relative">
                <div className="inline-flex p-3 bg-blue-400 rounded-xl mb-6  transition-colors">
                  <div className="text-blue-700">{item.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {item.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                <div className="mt-6 pt-6 border-t border-slate-800 group-hover:border-cyan-500/30 transition-colors">
                  {/* <a
                    href="#"
                    className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Learn more
                    <svg
                      className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section - Enhanced */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-slate-950" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="text-sm font-semibold reveal text-blue-400 uppercase tracking-wider">
                Our Portfolio
              </span>
            </div>
            <h2 className="reveal text-4xl md:text-5xl font-bold text-white mb-6">
              Precision <span className="text-blue-400">Components</span>
            </h2>
            <p className="reveal text-lg text-slate-400 max-w-3xl mx-auto">
              High-quality electrical and electronic parts manufactured with
              consistent excellence and performance-driven design.
            </p>
          </div>

          <div className="grid stagger-card grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, idx) => (
              <div
                key={idx}
                className="group relative bg-gradient-to-b from-slate-900/80 to-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-500/5"
              >
                <div className="relative overflow-hidden">
                  <div className="h-56 overflow-hidden reveal">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="reveal text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {product.title}
                    </h3>
                    <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                      <svg
                        className="w-5 h-5 text-cyan-400"
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

                  <p className="reveal text-slate-400 mb-6 leading-relaxed">
                    {product.desc}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <span className="text-sm text-slate-500">
                      Available in various specifications
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16 reveal">
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

      {/* CTA Section */}
      {/* <section className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-cyan-900/10 to-blue-900/20" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900/60 to-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="lg:w-2/3">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 reveal">
                  Ready to Transform Your Electrical Manufacturing?
                </h2>
                <p className="text-slate-300 text-lg reveal">
                  Contact us today to discuss your precision component
                  requirements and discover how our advanced CNC solutions can
                  elevate your products.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 reveal">
                <button className="px-8 py-4 bg-blue-800 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300">
                  <Link to="/quote">Get a Quote</Link>
                </button>
                <button className="px-8 py-4 border border-slate-600 hover:border-cyan-400 text-white font-semibold rounded-xl transition-all duration-300">
                  <Link to="contact-us">Schedule Call</Link>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default ElectricalManufacturing;
