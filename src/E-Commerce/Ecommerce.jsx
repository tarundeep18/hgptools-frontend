import React, { useEffect } from "react";
import {
  FaTools,
  FaShoppingCart,
  FaClock,
  FaIndustry,
  FaEnvelope,
  FaArrowRight,
  FaCheckCircle,
  FaRegNewspaper,
} from "react-icons/fa";
import { FiChevronRight } from "react-icons/fi";
import { reveal, revealStagger } from "../animation/ScrollAnimation";

const Ecommerce = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-16 font-sans">
      <div className="max-w-7xl w-full">
        {/* Main Card with glass morphism effect */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-[2.5rem] p-8 md:p-14 lg:p-20 shadow-2xl relative overflow-hidden border border-slate-700/50 backdrop-blur-sm">
          {/* Animated Gradient Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-slate-700/30 via-blue-900/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>

          {/* Subtle Grid Pattern */}
          <div
            className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-20`}
          />

          {/* Content Container */}
          <div className="relative z-10">
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center  reveal gap-3 bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-800/30 text-blue-300 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
                <div className="flex items-center gap-2 ">
                  <FaTools className="text-blue-400" />
                  <span>HGP TOOLS PLATFORM</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                </div>
              </div>

              <h1 className="text-4xl reveal md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Industrial Tools
                <span className="block reveal bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent mt-2">
                  E-Commerce Platform
                </span>
              </h1>

              <div className="inline-flex items-center gap-3 reveal bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg mb-8">
                <FaClock className="text-blue-400 animate-spin-slow" />
                <span className="font-medium text-slate-300">
                  Launching in 2026
                </span>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>

              <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto reveal">
                Our secure online platform for industrial tools is currently in
                development. Soon you'll be able to browse, order, and track
                premium tools directly through our streamlined eCommerce system.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br stagger-card from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 reveal h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-bold reveal text-white mb-2 text-lg group-hover:text-blue-300 transition-colors">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-slate-400 reveal leading-relaxed group-hover:text-slate-300 transition-colors">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-700/50 group-hover:border-blue-500/30 transition-colors">
                    <span className="text-xs text-slate-500 group-hover:text-blue-400 transition-colors">
                      Feature {index + 1} of 3
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-8 mb-12 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <FaCheckCircle className="text-white text-sm" />
                </div>
                <span className="bg-gradient-to-r reveal from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Platform Benefits
                </span>
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 stagge-card">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-8 h-8 reveal rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center group-hover:border-blue-500 transition-all duration-300">
                      <FiChevronRight className="text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <span className="text-slate-300 reveal font-medium group-hover:text-white transition-colors">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 md:p-10 text-white overflow-hidden relative border border-slate-700/50">
              {/* Glowing Background Effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/20 via-purple-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/4 blur-xl"></div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-start gap-4 md:gap-6">
                    <div className="w-16 reveal h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse-slow">
                      <FaTools className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-3 reveal text-white">
                        Need Immediate Assistance?
                      </h3>
                      <p className="text-slate-300 reveal leading-relaxed max-w-lg">
                        Looking for{" "}
                        <span className="font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                          custom-made tools
                        </span>{" "}
                        or need to place an urgent order? Our specialist team is
                        available to help.
                      </p>
                    </div>
                  </div>

                  <a
                    href="/contact"
                    className="group inline-flex reveal items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-8 py-4 rounded-xl font-bold transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 min-w-fit border border-blue-500/30 hover:border-blue-400/50"
                  >
                    <span>Contact Our Team</span>
                    <FaArrowRight className="group-hover:translate-x-2 transition-transform duration-300" />
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            {/* <div className="mt-10 text-center">
              <p className="text-sm text-slate-400">
                Stay updated with our latest developments
                <a
                  href="/newsletter"
                  className="group inline-flex items-center gap-2 ml-3 text-blue-400 hover:text-cyan-300 transition-colors"
                >
                  <FaRegNewspaper className="group-hover:scale-110 transition-transform" />
                  <span>Subscribe to newsletter</span>
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </a>
              </p>
            </div> */}
          </div>
        </div>

        {/* Additional Info Bar */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500 reveal">
            © 2024 HGP Tools. All industrial tools are certified and quality
            assured.
          </p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </section>
  );
};

// Features data
const features = [
  {
    icon: <FaShoppingCart className="text-white text-xl" />,
    title: "Online Ordering",
    description:
      "Browse and purchase standard industrial tools with streamlined checkout.",
  },
  {
    icon: <FaIndustry className="text-white text-xl" />,
    title: "Industrial Grade",
    description:
      "Certified tools suitable for production and tool-room applications.",
  },
  {
    icon: <FaClock className="text-white text-xl" />,
    title: "Coming Soon",
    description:
      "Finalizing the platform for optimal user experience and reliability.",
  },
];

// Benefits data
const benefits = [
  "Secure Payment Processing",

  "Technical Specifications",
  "Order History & Tracking",
  "Bulk Order Discounts",
  "PDF Documentation",
  "Live Chat Support",
  "Express Shipping",
];

export default Ecommerce;
