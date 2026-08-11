import React, { useEffect } from "react";
import {
  FaAward,
  FaIndustry,
  FaCheckCircle,
  FaChevronRight,
  FaShieldAlt,
  FaTools,
  FaMicrochip,
  FaGlobeAmericas,
} from "react-icons/fa";
import { reveal, revealStagger } from "../../animation/ScrollAnimation";
import { Link } from "react-router-dom";

const CompanyTrust = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const certifications = [
    {
      title: "ISO 9001:2015",
      desc: "Global Quality Management Standard.",
      icon: <FaAward />,
    },
    {
      title: "AS9100D",
      desc: "Aerospace & Defense Quality Requirements.",
      icon: <FaShieldAlt />,
    },
    {
      title: "Zero Defect Policy",
      desc: "100% precision in every batch.",
      icon: <FaCheckCircle />,
    },
    {
      id: 4,
      title: "DGFT Certified",
      desc: "Authorized IEC holder for Global Export & Import.",
      icon: <FaGlobeAmericas />, // Represents international trade
    },

    // {
    //   title: "ISO 14001",
    //   desc: "Environmental Management Certified.",
    //   icon: <FaCheckCircle />,
    // },
  ];

  return (
    <section className="bg-white py-16 px-6 lg:px-20 font-sans max-w-7xl mx-auto space-y-24">
      {/* SECTION 1: CERTIFICATIONS */}
      <div className="animate-fadeIn">
        <div className="mb-10">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-2 reveal">
            Quality Standards
          </h2>
          <p className="text-slate-500 max-w-xl reveal">
            HGP Tools operates under strict international certifications to
            ensure every component meets aerospace and automotive tolerances.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-card">
          {certifications.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl transition-all group"
            >
              <div className="text-3xl reveal text-blue-800 mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="font-bold reveal text-xl text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-slate-500 reveal text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER CTA */}
      <div className="p-10 reveal bg-slate-900 rounded-3xl text-center text-white">
        <h4 className="text-2xl font-bold mb-4 reveal">
          Ready to discuss your technical requirements?
        </h4>
        <button className="bg-blue-700 hover:bg-blue-800 text-white px-10 py-4 rounded-full font-bold transition-all">
          <Link to="/contact-us"> Contact Engineering Team</Link>
        </button>
      </div>
    </section>
  );
};

export default CompanyTrust;
