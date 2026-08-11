import React, { useEffect } from "react";
import {
  FaIndustry,
  FaCogs,
  FaCheckCircle,
  FaTools,
  FaDraftingCompass,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import PowerPress from "../../../assets/power-tool.png";
import { reveal, revealStagger } from "../../../animation/ScrollAnimation";

const PowerPressManufacturerSection = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-slate-50  text-white py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top,white,transparent_60%)]" />
        <div className="relative reveal max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block reveal mb-4 px-4 py-1 text-sm font-semibold rounded-full bg-blue-800">
              Industrial Manufacturing Experts
            </span>
            <h1 className="text-4xl reveal md:text-6xl font-extrabold leading-tight text-black">
              Power Press Tool
              <span className="block text-blue-800">
                Manufacturers & Suppliers
              </span>
            </h1>
            <p className="mt-6 text-lg reveal text-slate-600 leading-relaxed max-w-xl">
              Delivering precision‑engineered power press tools designed for
              high productivity, consistent accuracy, and long‑term industrial
              performance.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 reveal">
              <button className="px-8 py-4 rounded-xl bg-blue-800 text-white font-semibold hover:bg-blue-900 transition">
                <Link to="/contact-us">Get Custom Tool</Link>
              </button>
              {/* <button className="px-8 py-4 rounded-xl border border-white/40 hover:bg-white/10 transition">
                View Capabilities
              </button> */}
            </div>
          </div>

          <div className="relative reveal">
            <div className="absolute -inset-6 rounded-3xl " />
            <img
              src={PowerPress}
              alt="Power Press Tool Manufacturing"
              className="relative rounded-3xl  object-cover"
            />
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="w-full bg-gradient-to-b from-slate-950 to-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl reveal font-bold tracking-tight">
              Precision Power Press Tool Manufacturer
            </h2>
            <p className="mt-5 text-slate-300 leading-relaxed reveal">
              We are a trusted manufacturer of high‑quality power press tools,
              delivering precision‑engineered solutions for sheet metal forming,
              cutting, bending, and shaping applications across industries.
            </p>
          </div>

          {/* Core Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="bg-slate-900 border border-slate-800 reveal rounded-2xl p-8 hover:border-indigo-500 transition">
              <FaIndustry className="text-blue-700 text-3xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                End‑to‑End Manufacturing
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed reveal">
                Complete in‑house design, machining, assembly, and quality
                inspection ensure consistent performance and durability.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-indigo-500 transition">
              <FaCogs className="text-blue-700 text-3xl mb-4" />
              <h3 className="text-xl font-semibold mb-2 reveal">
                High Precision Engineering
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed reveal">
                Tight tolerances, robust tool design, and advanced CNC machining
                guarantee repeatable accuracy and long tool life.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-indigo-500 transition">
              <FaCheckCircle className="text-blue-700 text-3xl mb-4" />
              <h3 className="text-xl font-semibold mb-2 reveal">
                Industry‑Grade Quality
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed reveal">
                Every tool is tested for strength, alignment, and output
                consistency to meet demanding industrial standards.
              </p>
            </div>
          </div>

          {/* Products */}
          <div className="mb-20">
            <h3 className="text-3xl font-semibold mb-10 text-center reveal">
              Our Power Press Tool Range
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal">
              {[
                "Progressive Dies",
                "Compound Dies",
                "Blanking Tools",
                "Piercing Tools",
                "Bending & Forming Tools",
                "Custom Power Press Tools",
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border reveal border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:shadow-indigo-500/10 transition"
                >
                  <FaTools className="text-blue-700 text-2xl mb-3" />
                  <h4 className="font-semibold text-lg mb-2 reveal">{item}</h4>
                  <p className="text-slate-400 text-sm reveal">
                    Engineered for high efficiency, accuracy, and durability in
                    continuous production environments.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center mb-20">
            <div>
              <h3 className="text-3xl font-semibold mb-6 reveal">
                Why Choose Us
              </h3>
              <ul className="space-y-4 text-slate-300 reveal">
                <li className="flex gap-3 reveal">
                  <FaCheckCircle className="text-blue-700 mt-1" /> Custom tool
                  design as per client drawings & samples
                </li>
                <li className="flex gap-3 reveal">
                  <FaCheckCircle className="text-blue-700 mt-1" /> High‑strength
                  materials for extended tool life
                </li>
                <li className="flex gap-3 reveal">
                  <FaCheckCircle className="text-blue-700 mt-1" /> Strict
                  quality control & dimensional inspection
                </li>
                <li className="flex gap-3 reveal">
                  <FaCheckCircle className="text-blue-700 mt-1" /> On‑time
                  delivery & reliable after‑sales support
                </li>
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 reveal">
              <FaDraftingCompass className="text-blue-700 text-4xl mb-4" />
              <h4 className="text-xl font-semibold mb-3 reveal">
                Custom Tool Development
              </h4>
              <p className="text-slate-400 leading-relaxed reveal">
                From concept and CAD design to final production, we develop
                custom power press tools tailored to your production volume,
                material type, and precision requirements.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-3xl font-semibold mb-4 reveal">
              Looking for Reliable Power Press Tools?
            </h3>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto reveal">
              Partner with us for precision‑engineered power press tools that
              enhance productivity, reduce downtime, and deliver consistent
              results.
            </p>
            <button className="px-8 py-4 rounded-xl bg-blue-700 hover:bg-blue-800 transition font-semibold">
              <Link to="/quote">Request a Quote </Link>
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default PowerPressManufacturerSection;
