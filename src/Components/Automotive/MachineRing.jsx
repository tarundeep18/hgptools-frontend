import React, { useEffect } from "react";
import MachineRingImg from "../../assets/machine-ring2.png";
import { FaLayerGroup } from "react-icons/fa";
import { Link } from "react-router-dom";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";

const MachineRing = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  return (
    <div className="bg-white text-black">
      {/* ================= HERO SECTION ================= */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent "></div>

        <div className="relative max-w-7xl mx-auto px-6 py-28 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="reveal flex items-center gap-3 mb-4 text-blue-800 font-bold tracking-widest text-xs uppercase">
              <FaLayerGroup /> Automotive Industry
            </div>
            <h1 className="reveal text-4xl md:text-5xl font-bold leading-tight">
              Precision Machined Rings for
              <span className="text-blue-800"> Automotive Industries</span>
            </h1>
            <p className="mt-6 reveal text-slate-700 text-lg">
              High-accuracy machined rings engineered for durability,
              dimensional precision, and long-term performance in demanding
              automotive applications.
            </p>

            <div className="mt-8 flex gap-4 reveal">
              <button className="px-6 py-3 rounded-lg text-white bg-blue-800 hover:bg-blue-700 transition font-medium">
                <Link to="/quote">Request a Quote</Link>
              </button>
            </div>
          </div>

          <div className="relative reveal">
            <img
              src={MachineRingImg}
              alt="Machined Rings Manufacturing"
              className="rounded-2xl "
            />
          </div>
        </div>
      </section>

      {/* ================= ABOUT SECTION ================= */}
      <section className="max-w-7xl mx-auto px-6 py-20 ">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-4 reveal">
              Machined Rings Manufacturing
            </h2>
            <p className="text-slate-700 leading-relaxed reveal">
              Machined rings are critical automotive components used in
              transmissions, engines, suspension systems, and braking
              assemblies. Our manufacturing process ensures tight tolerances,
              smooth finishes, and consistent quality across high-volume and
              custom production runs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 text-white stagger-card">
            {[
              "High Dimensional Accuracy",
              "Automotive-Grade Materials",
              "CNC Precision Machining",
              "Strict Quality Control",
            ].map((item, index) => (
              <div
                key={index}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800"
              >
                <p className="font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PROCESS SECTION ================= */}
      <section className="bg-[#0f172a] text-white py-20 stagger-card">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-semibold text-center mb-14 reveal">
            Step-by-Step Manufacturing Process
          </h2>

          <div className="grid md:grid-cols-4 gap-8 reveal">
            {[
              {
                step: "01",
                title: "Material Selection",
                desc: "High-strength steel, alloy steel, or aluminum selected based on automotive standards.",
              },
              {
                step: "02",
                title: "CNC Machining",
                desc: "Advanced CNC turning and milling to achieve precise dimensions and tolerances.",
              },
              {
                step: "03",
                title: "Heat Treatment",
                desc: "Improves strength, wear resistance, and durability under high-load conditions.",
              },
              {
                step: "04",
                title: "Inspection & Finishing",
                desc: "Final inspection using precision instruments with surface finishing.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-600 transition"
              >
                <span className="text-blue-500 font-bold">{item.step}</span>
                <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= APPLICATIONS SECTION ================= */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold mb-10 text-center text-black reveal">
          Automotive Applications
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 text-white stagger-card">
          {[
            "Transmission Assemblies",
            "Engine Components",
            "Suspension Systems",
            "Brake Systems",
            "Steering Mechanisms",
            "Drive Train Parts",
          ].map((app, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-slate-900 border border-slate-800 hover:translate-y-[-4px] transition"
            >
              <p className="font-medium">{app}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CTA SECTION ================= */}
      <section className="py-20 bg-[#0f172a] text-white ">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-4 reveal">
            Trusted Machined Ring Manufacturer
          </h2>
          <p className="text-slate-400 mb-8 reveal">
            Partner with us for reliable automotive machining solutions that
            meet global quality standards.
          </p>

          <button className="px-8 py-3 rounded-lg bg-blue-800 text-white transition font-medium">
            Contact Our Team
          </button>
        </div>
      </section>
    </div>
  );
};

export default MachineRing;
