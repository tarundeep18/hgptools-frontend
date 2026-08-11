import React, { useEffect } from "react";
import {
  FaLeaf,
  FaGraduationCap,
  FaHandHoldingHeart,
  FaUsers,
  FaSun,
  FaRecycle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { reveal,revealStagger } from "../../animation/ScrollAnimation";

const SocialResponsibility = () => {

  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const initiatives = [
    {
      title: "Environmental Stewardship",
      desc: "Reducing our carbon footprint through waste reduction and energy-efficient CNC machining processes.",
      icon: <FaLeaf />,
      color: "bg-green-50 text-green-700 border-green-100",
      tags: ["Zero Waste", "Solar Energy"],
    },
    {
      title: "Employee Welfare",
      desc: "Ensuring a safe, inclusive, and high-growth work environment for our Faridabad-based engineering team.",
      icon: <FaUsers />,
      color: "bg-blue-50 text-blue-700 border-blue-100",
      tags: ["Safety First", "Skill Training"],
    },
    {
      title: "Community Education",
      desc: "Supporting local vocational training and STEM workshops to empower the next generation of engineers.",
      icon: <FaGraduationCap />,
      color: "bg-purple-50 text-purple-700 border-purple-100",
      tags: ["STEM Support", "Skill India"],
    },
  ];

  return (
    <section className="bg-slate-50 py-20 px-6 lg:px-20 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-blue-800 reveal font-bold uppercase tracking-widest text-sm mb-3">
            Commitment Beyond Business
          </h2>
          <p className="text-4xl reveal md:text-5xl font-extrabold text-slate-900 leading-tight">
            Our Social <span className="text-blue-800">Responsibility</span>
          </p>
          <div className="h-1.5 reveal w-24 bg-blue-800 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Initiatives Grid */}
        <div
          className="grid md:grid-cols-3 gap-8 stagger-card"
        >
          {initiatives.map((item, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div
                className={`w-16 reveal h-16 rounded-2xl flex items-center justify-center text-3xl mb-8 border ${item.color} group-hover:scale-110 transition-transform`}
              >
                {item.icon}
              </div>

              <h3 className="text-2xl reveal font-bold text-slate-900 mb-4">
                {item.title}
              </h3>
              <p className="text-slate-600 reveal leading-relaxed mb-8">{item.desc}</p>

              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 reveal bg-slate-100 text-slate-600 text-xs font-bold rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Impact Section */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-[2rem] p-8 lg:p-12 shadow-sm border border-slate-100">
          <div>
            <h4 className="text-2xl reveal font-bold text-slate-900 mb-4">
              Driving Sustainable Growth in India
            </h4>
            <p className="text-slate-600 reveal leading-relaxed mb-6">
              As a manufacturer registered in 2018, HGP Tools believes that
              industrial growth must be ethical and sustainable. We integrate
              social values into our core business objectives, focusing on the
              betterment of our local communities in Haryana.
            </p>
            <div className="flex gap-8">
              <div className="flex reveal items-center gap-2 text-green-700 font-bold">
                <FaSun /> Solar Powered Hub
              </div>
              <div className="flex reveal items-center gap-2 text-blue-700 font-bold">
                <FaRecycle /> 100% Metal Recycling
              </div>
            </div>
          </div>
          <div className="bg-slate-900 rounded-2xl p-8 text-center text-white">
            <p className="italic text-slate-400 mb-6 reveal">
              "Our goal is to build long-term value by integrating technical
              precision with a heart for society."
            </p>
            <div className="font-bold text-lg reveal">— Harpal Singh, Founder</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialResponsibility;
