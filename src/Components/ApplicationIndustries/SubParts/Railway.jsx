import React, { useEffect } from "react";
import {
  FaTrain,
  FaCogs,
  FaTools,
  FaRoad,
  FaCheckCircle,
  FaAward,
  FaBolt,
} from "react-icons/fa";
import { FaClipboardCheck, FaIndustry, FaShieldAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import BusbarImg from "../../../assets/bussBar.jpeg";
import DCMotorImg from "../../../assets/dc-motor-diagram (1) (1).jpg";
import { reveal, revealStagger } from "../../../animation/ScrollAnimation.js";
import SEO from "../../../Pages/Seo/Seo.jsx";

const Railway = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const railwayCapabilities = [
    {
      title: "Copper Bus Bars & Power Conductors",
      desc: "We manufacture high-precision copper bus bars and current-carrying components used in railway traction systems, substations, and power distribution panels.",
      icon: <FaCogs className="text-blue-800" />,
      specs: [
        "Electrolytic Grade Copper (ETP & OFC)",
        "Precision Machined & Bent Bus Bars",
        "Tin / Silver Plated for High Conductivity",
      ],
    },
    {
      title: "DC & AC Traction Motor Components",
      desc: "Our facility produces critical machined and fabricated parts for DC and AC traction motors used in locomotives, EMUs, and metro rail systems.",
      icon: <FaTrain className="text-blue-800" />,
      specs: [
        "Motor Housings & End Shields",
        "Shafts, Couplings & Rotor Components",
        "Tight Tolerance CNC Machining",
      ],
    },
    {
      title: "Railway Electrical & Mechanical Parts",
      desc: "We support railway OEMs with durable electrical and mechanical components designed to perform under continuous load, vibration, and harsh environments.",
      icon: <FaTools className="text-blue-800" />,
      specs: [
        "Terminal Blocks & Copper Connectors",
        "Insulated Power Assemblies",
        "Vibration & Heat Resistant Designs",
      ],
    },
  ];

  const products = [
    {
      title: "Copper Bus Bars",
      desc: "High-conductivity copper bus bars used in railway traction systems and power distribution panels.",
      image: BusbarImg,
      icon: <FaBolt className="text-blue-800" />,
    },
    {
      title: "DC Traction Motor Parts",
      desc: "Precision-machined DC motor components for locomotives and railway applications.",
      image: DCMotorImg,
      icon: <FaCogs className="text-blue-800" />,
    },
    {
      title: "AC Traction Motor Components",
      desc: "Critical AC motor parts designed for EMUs, metro trains, and high-speed rail systems.",
      image:
        "https://www.dllinc.com/wp-content/uploads/2016/07/products-traction-motor1.jpg",
      icon: <FaIndustry className="text-blue-800" />,
    },
    {
      title: "Relays",
      desc: "High-reliability switching and protection solutions engineered for EMUs, metro rolling stock, and high-speed rail signaling systems.",
      image:
        "https://www.morssmitt.com/uploads/images/catalog/product/original/mors-smitt-railway-relay-c(3).jpg",
      icon: <FaIndustry className="text-blue-800" />,
    },
  ];

  return (
    <>

     <SEO
        title="Railway Component Manufacturer India | Traction Motor Parts & Precision Railway Components | HGP Tools"
        description="HGP Tools is a trusted railway component manufacturer in India specializing in AC/DC traction motor components, copper bus bars, relay parts, contact levers, brackets, and precision railway sheet metal components."
        keywords="Railway component manufacturer India, DC traction motor parts supplier, AC traction motor components manufacturer, Railway sheet metal parts manufacturer, Copper bus bar railway components, Relay components manufacturer India, Contact lever manufacturer, Precision railway industrial components"
        url="https://www.hgptools.com/railway-industries"
        image="https://www.hgptools.com/images/railway-components-banner.jpg"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Railway Component Manufacturing",
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
            "Manufacturing precision railway components including traction motor parts, copper bus bars, relays, brackets, and sheet metal railway parts."
        }}
      />

      <section className="relative bg-slate-50  text-white py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top,white,transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block reveal mb-4 px-4 py-1 text-sm font-semibold rounded-full bg-blue-800">
              Railway Manufacturing
            </span>
            <h1 className="text-4xl reveal md:text-6xl font-extrabold leading-tight text-black">
              Extending Proven{" "}
              <span className="text-blue-800 ">Precision Manufacturing</span>{" "}
              into Railways
            </h1>
            <p className="mt-6 reveal text-lg text-slate-600 leading-relaxed max-w-xl">
              Our railway manufacturing approach is grounded in precision,
              transparency, and process reliability — focusing on components we
              can deliver consistently and responsibly.
            </p>
            <div className="mt-8 reveal flex flex-wrap gap-4">
              <button className="px-8 py-4 rounded-xl bg-blue-800 text-white font-semibold hover:bg-blue-900 transition">
                <Link to="/quote">Request Quote</Link>
              </button>
            </div>
          </div>

          <div className="relative reveal">
            <div className="absolute -inset-6 rounded-3xl " />
            <img
              src="https://cdn.shopify.com/s/files/1/0891/0461/3680/files/indian-rail-coach-manufacturing-scaled_500x.jpg?v=1727508704"
              alt="Power Press Tool Manufacturing"
              className="relative  rounded-3xl  w-full"
            />
          </div>
        </div>
      </section>
      <section className="bg-slate-50 py-24 px-6 lg:px-20 font-sans">
        <div className="max-w-7xl mx-auto">
          {/* Railway Header */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              {/* Powering Railway{" "} */}

              <h2 className="text-3xl reveal md:text-5xl font-black text-slate-900 mt-6 leading-tight">
                Powering the <span className="text-blue-800">Global Rail</span>{" "}
                Traction & Electrical Systems
              </h2>
            </div>
            <div className="bg-white reveal p-8 rounded-[2rem] text-black shadow-2xl border-b-8 border-blue-800">
              <p className="reveal text-slate-800 text-lg leading-relaxed italic border-l-4 border-blue-800 pl-6">
                As a trusted manufacturing partner to the railway industry, we
                specialize in precision-engineered copper bus bars, DC/AC motor
                components, and power distribution parts that meet stringent
                railway safety and performance standards.
              </p>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="grid md:grid-cols-2 sw gap-8 mb-20 stagger-card">
            {railwayCapabilities.map((item, index) => (
              <div
                key={index}
                className="group p-10 rounded-[2.5rem] bg-white hover:shadow-2xl transition-all duration-500"
              >
                <div className="reveal w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-sm group-hover:bg-white group-hover:text-black transition-all duration-500">
                  {item.icon}
                </div>
                <h3 className="reveal text-2xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="reveal text-blue-800 leading-relaxed mb-8">
                  {item.desc}
                </p>
                <ul className="space-y-3 reveal">
                  {item.specs.map((spec, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-blue-800 font-semibold text-sm"
                    >
                      <FaCheckCircle className="text-emerald-700 shrink-0" />{" "}
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <section className="bg-slate-50 py-24 px-6 lg:px-20 font-sans">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="text-center max-w-3xl mx-auto mb-20">
                <span className="reveal inline-block mb-4 px-4 py-1 text-sm font-semibold text-white bg-blue-800 rounded-full">
                  Product Gallery
                </span>
                <h2 className="reveal text-4xl md:text-6xl font-black text-slate-900 mt-6">
                  Our <span className="text-blue-800">Manufactured</span>{" "}
                  Components
                </h2>
                <p className="reveal text-slate-700 text-lg mt-6 leading-relaxed">
                  A visual showcase of railway electrical and traction motor
                  components manufactured with precision and quality.
                </p>
              </div>

              {/* Product Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 stagger-card">
                {products.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group"
                  >
                    {/* Image */}
                    <div className="reveal relative h-64 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-fit scale-110 group-hover:scale-120 transition-transform duration-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-8 reveal">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-2xl reveal">{item.icon}</div>
                        <h3 className="text-xl font-bold text-slate-900 reveal">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Note */}
              <div className="mt-24 bg-blue-800 rounded-[3rem] p-14 reveal text-center text-white">
                <h3 className="text-3xl md:text-4xl font-black mb-6 reveal">
                  Custom Manufacturing as per Drawings
                </h3>
                <p className="text-blue-100 max-w-2xl mx-auto text-lg reveal">
                  Images shown are representative samples. We manufacture
                  components as per customer drawings, specifications, and
                  railway standards.
                </p>
              </div>
            </div>
          </section>

          {/* //certification */}
          <section className="bg-slate-50 py-24 px-6 lg:px-20 font-sans stagger-card">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 mt-6 reveal">
                  Built on{" "}
                  <span className="text-blue-800">Quality, Safety</span> &
                  Reliability
                </h2>
                <p className="text-slate-700 text-lg mt-6 leading-relaxed reveal">
                  Our quality management systems and inspection processes ensure
                  that every component meets stringent railway and industrial
                  standards.
                </p>
              </div>

              {/* Certifications */}
              <div className="grid md:grid-cols-2 gap-10 mb-24 stagger-card">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                    <FaAward className="text-4xl text-blue-800" />
                    <h3 className="text-2xl font-bold text-slate-900 reveal">
                      Certifications
                    </h3>
                  </div>

                  <ul className="space-y-4 text-blue-800 font-semibold text-sm reveal">
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      ISO 9001: Quality Management System
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      Railway Vendor Quality Compliance
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      In-House Inspection & Traceability
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      Compliance with Customer Drawings & Specs
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-lg">
                  <div className="flex items-center gap-4 mb-6 reveal">
                    <FaClipboardCheck className="text-4xl text-blue-800" />
                    <h3 className="text-2xl font-bold text-slate-900">
                      Inspection & Testing
                    </h3>
                  </div>

                  <ul className="space-y-4 text-blue-800 font-semibold text-sm">
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      Dimensional & Visual Inspection
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      Material Verification
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      Electrical Conductivity Checks
                    </li>
                    <li className="flex items-center gap-3">
                      <FaCheckCircle className="text-emerald-600" />
                      Final Inspection Before Dispatch
                    </li>
                  </ul>
                </div>
              </div>

              {/* Quality Process */}
              <div className="grid md:grid-cols-3 gap-10 mb-24">
                <div className="bg-white rounded-[2.5rem] p-10 shadow-lg text-center">
                  <FaIndustry className="text-5xl text-blue-800 mx-auto mb-6" />
                  <h4 className="text-xl font-bold text-slate-900 mb-4">
                    Controlled Manufacturing
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    All manufacturing processes are carried out under controlled
                    conditions with documented procedures and trained personnel.
                  </p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-lg text-center">
                  <FaShieldAlt className="text-5xl text-blue-800 mx-auto mb-6" />
                  <h4 className="text-xl font-bold text-slate-900 mb-4">
                    Process Traceability
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    Materials, processes, and inspections are traceable to
                    ensure consistency, accountability, and compliance.
                  </p>
                </div>

                <div className="bg-white rounded-[2.5rem] p-10 shadow-lg text-center">
                  <FaCheckCircle className="text-5xl text-blue-800 mx-auto mb-6" />
                  <h4 className="text-xl font-bold text-slate-900 mb-4">
                    Continuous Improvement
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    We continuously improve our systems through audits,
                    feedback, and performance monitoring.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Expertise Trust Bar */}
          <div className="bg-blue-800 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-center mb-6">
                <FaAward className="text-5xl text-yellow-400" />
              </div>

              <p className="text-emerald-100 text-lg mb-10 max-w-2xl mx-auto">
                Trusted by national rail authorities and private logistics
                giants. Our capacity has expanded to meet the growing demand for
                high-speed connectivity and sustainable transit.
              </p>
            </div>
            {/* Background Decorative Pattern */}
            <div className="absolute bottom-0 left-0 opacity-10 scale-150 -rotate-12 transform -translate-x-1/4 translate-y-1/4">
              <FaTrain size={400} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Railway;
