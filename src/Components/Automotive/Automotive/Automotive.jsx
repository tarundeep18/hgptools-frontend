import React, { useEffect } from "react";
import { FaIndustry, FaCogs, FaTools, FaBolt } from "react-icons/fa";
import AutomotiveImg from "../../../assets/Automotive-img1.png";
import { Link } from "react-router-dom";
import { revealStagger, reveal } from "../../../animation/ScrollAnimation";
import SEO from "../../../Pages/Seo/Seo";

const products = [
  {
    title: "High-Strength Bolts",
    desc: "Precision-engineered automotive bolts designed for durability, load resistance, and long service life.",
    icon: <FaBolt />,
  },
  {
    title: "Machined Rings",
    desc: "CNC-machined rings with tight tolerances, ideal for transmission, suspension, and engine assemblies.",
    icon: <FaCogs />,
  },
  {
    title: "Automotive Shafts",
    desc: "Hardened and balanced shafts manufactured for high torque applications in modern vehicles.",
    icon: <FaTools />,
  },
  {
    title: "Flanges",
    desc: "Robust automotive flanges ensuring secure connections and high pressure resistance.",
    icon: <FaIndustry />,
  },
];

const Automotive = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  return (
    <>
     <SEO
        title="Automotive Sheet Metal Parts Manufacturer India | Precision Automotive Components | HGP Tools"
        description="HGP Tools is a leading automotive sheet metal parts manufacturer in India specializing in automotive shafts, precision brackets, machined rings, custom automotive components, and industrial-grade automotive manufacturing solutions."
        keywords="Automotive sheet metal parts manufacturer, Automotive component manufacturer India, Automotive shafts manufacturer India, Precision automotive brackets supplier, Machined rings manufacturer India, Custom automotive sheet metal components, Automotive precision parts manufacturer, Automotive industrial components supplier"
        url="https://www.hgptools.com/automotive-industries"
        image="https://www.hgptools.com/images/automotive-components-banner.jpg"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Automotive Component Manufacturing",
          provider: {
            "@type": "Organization",
            name: "HGP Tools",
            url: "https://www.hgptools.com"
          },
          areaServed: {
            "@type": "Country",
            name: "India"
          },
          description:
            "Manufacturing automotive shafts, precision brackets, machined rings, and custom automotive sheet metal components for industrial applications."
        }}
      />
      <div className="bg-white text-black">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_60%)]"></div>

          <div className="relative max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <span className="reveal font-bold mb-4  text-blue-800 uppercase ">
                Automotive Manufacturing
              </span>

              <h1 className="reveal text-4xl md:text-6xl font-extrabold leading-tight">
                Precision Parts for
                <span className="block text-blue-800">
                  Automotive Industries
                </span>
              </h1>

              <p className="mt-6 text-gray-400 text-lg reveal">
                We specialize in manufacturing high-performance automotive
                components including bolts, machined rings, shafts, and flanges
                using advanced CNC and quality-driven processes.
              </p>

              <div className="mt-10 flex gap-5 reveal">
                <button className="px-8 py-4 rounded-xl text-white bg-blue-800 hover:bg-blue-700 transition font-semibold">
                  <Link to="/contact-us">Request a Quote</Link>
                </button>
              </div>
            </div>

            {/* Right */}
            <div className="relative reveal">
              <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-3xl"></div>
              <img
                src={AutomotiveImg}
                alt="Automotive Manufacturing"
                className="relative rounded-3xl  object-cover"
              />
            </div>
          </div>
        </section>

        {/* PRODUCTS SECTION */}
        <div className="bg-slate-950">
          <section className="max-w-7xl mx-auto px-6 py-24 bg-slate-950 text-white">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold reveal">
                Our Manufacturing{" "}
                <span className="text-blue-400">Expertise</span>
              </h2>
              <p className="mt-4 text-gray-400 max-w-2xl mx-auto reveal">
                Delivering precision automotive components with uncompromising
                quality standards and advanced machining technology.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 stagger-card">
              {products.map((item, idx) => (
                <div
                  key={idx}
                  className="group bg-slate-900 rounded-2xl p-8 hover:border-blue-700 transition"
                >
                  <div className="text-4xl reveal text-blue-400 mb-6 group-hover:scale-110 transition">
                    {item.icon}
                  </div>
                  <h3 className="text-xl reveal font-semibold mb-4">
                    {item.title}
                  </h3>
                  <p className="reveal text-gray-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* QUALITY SECTION */}
        <section className="bg-slate-900 ">
          <div className="max-w-7xl reveal mx-auto px-6 py-20 grid md:grid-cols-3 gap-12 text-center">
            {[
              ["CNC Machining", "High precision 3-axis CNC machines"],
              ["Automotive Grade Materials", "Tested alloys & hardened steel"],
              [
                "Strict Quality Control",
                "Dimensional & performance inspection",
              ],
            ].map((item, idx) => (
              <div key={idx}>
                <h4 className="text-xl font-semibold mb-3 text-blue-400">
                  {item[0]}
                </h4>
                <p className="text-gray-400">{item[1]}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default Automotive;
