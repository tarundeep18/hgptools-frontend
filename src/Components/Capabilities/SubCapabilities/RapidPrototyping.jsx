import React, { useEffect } from "react";
import {
  FaDraftingCompass,
  FaVial,
  FaMicrochip,
  FaArrowRight,
  FaCheckCircle,
  FaLayerGroup,
} from "react-icons/fa";
import { useState } from "react";
import { reveal, revealStagger } from "../../../animation/ScrollAnimation";
import SEO from "../../../Pages/Seo/Seo";

const RapidPrototypingDetailed = () => {
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  const subParts = [
    {
      title: "1. Pilot Development",
      subtitle: "From Concept to Blueprint",
      desc: "Our engineering team takes your initial ideas or rough sketches and converts them into high-fidelity 3D CAD/CAM models. We analyze the geometry for manufacturability (DFM) to ensure the design is optimized for high-speed CNC production.",
      features: [
        "3D CAD Modeling",
        "Structural Analysis",
        "Feasibility Studies",
      ],
      icon: <FaDraftingCompass />,
      color: "border-blue-800 text-blue-800",
    },
    {
      title: "2. Precision Sampling",
      subtitle: "Physical Validation",
      desc: "Before mass production, we create functional metal samples. This allows you to verify the micron-level fit, finish, and material integrity. Our sampling process uses the exact alloy steel or aerospace-grade aluminum intended for the final product.",
      features: [
        "Micron-Level Testing",
        "Material Integrity",
        "Surface Finish Audit",
      ],
      icon: <FaVial />,
      color: "border-blue-800 text-blue-800",
    },
    {
      title: "3. Custom Engineering Solutions",
      subtitle: "Bespoke Technical Support",
      desc: "We don't just manufacture; we solve. Whether it's a unique drone frame or a specialized automotive ring, we provide custom engineering support to refine tolerances and reduce production costs without compromising quality.",
      features: ["Bespoke Tooling", "Stress Testing", "Cost Optimization"],
      icon: <FaMicrochip />,
      color: "border-blue-800 text-blue-800",
    },
  ];

  const manufacturingSteps = [
    {
      number: "01",
      title: "Concept & Requirements",
      description:
        "Understanding client ideas, functional needs, materials, and application requirements for the prototype.",
      image:
        "https://www.stratasys.com/contentassets/190e0886c0d34803bd3935b1e9d60242/3d-printer-create-a-rapid-prototype-model.jpg?v=49b74b&width=896&height=0&mode=crop",
    },
    {
      number: "02",
      title: "3D Design & CAD Modeling",
      description:
        "Creating precise 3D CAD models using design software for visualization and development.",
      image:
        "https://www.travancoreanalytics.com/wp-content/uploads/2020/07/cad-based-3d-visualization-using-three-js.jpg",
    },
    {
      number: "03",
      title: "Digital Simulation & Validation",
      description:
        "Testing strength, fitment, performance, and manufacturability through digital simulations.",
      image:
        "https://slcontrols.com/wp-content/uploads/2021/03/Digital-Validation-and-Why-Its-Important-to-Pharmaceutical-and-MedTech-Manufacturers.jpg",
    },
    {
      number: "04",
      title: "Rapid Prototype Manufacturing",
      description:
        "Prototype production using 3D printing, CNC machining, or rapid tooling technologies.",
      image:
        "https://images.prismic.io/geomiqstaging/MWQ0ODI2NTctOTYxNS00NjYxLTg0ZjktMTA0ZDkzNzM1OGEx_0b5d480b-d276-4252-a46d-f63f685be78e_adobestock_209103920.jpeg",
    },
    {
      number: "05",
      title: "Testing & Iteration",
      description:
        "Functional testing, feedback collection, design improvements, and repeated iterations.",
      image:
        "https://www.digital-advocacy.com/documents/blog-images/upload/iterative-testing.svg",
    },
    {
      number: "06",
      title: "Final Prototype & Production Readiness",
      description:
        "Final prototype approval, documentation, and preparation for mass manufacturing.",
      image:
        "https://at-machining.com/wp-content/uploads/2024/09/Accelerate-Your-Products-from-Prototype-to-Mass-Production.jpeg",
    },
  ];

  const [activeStep, setActiveStep] = useState(manufacturingSteps[0]);

  return (
    <section className="bg-white py-24 px-6 lg:px-20 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="reveal">
            <span className="text-blue-800 font-bold uppercase tracking-widest text-sm reveal">
              Innovation Hub
            </span>
            <h2 className="text-4xl md:text-6xl font-extrabold reveal text-slate-900 mt-4 mb-6 leading-tight">
              Rapid <span className="text-blue-800">Prototyping</span> &
              Development
            </h2>
          </div>
          <div className="bg-slate-50 p-8 rounded-3xl border-l-8 border-blue-800 reveal">
            <p className="text-slate-600 text-lg leading-relaxed italic reveal">
              We bridge the gap between design and reality. In the fast-paced
              2026 industrial market, our rapid prototyping service reduces your
              time-to-market by up to 60% while ensuring aerospace-grade
              precision.
            </p>
          </div>
        </div>

        {/* Detailed Sub-parts Grid */}
        <div className="grid lg:grid-cols-3 gap-10 stagger-card">
          {subParts.map((part, index) => (
            <div
              key={index}
              className="group relative bg-white border border-slate-100 p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-500"
            >
              {/* Icon & Title */}
              <div
                className={`w-16 h-16 reveal rounded-2xl flex items-center justify-center text-3xl mb-8 border-2 ${part.color} group-hover:scale-110 transition-transform`}
              >
                {part.icon}
              </div>

              <h3 className="text-2xl reveal font-bold text-slate-900 mb-1">
                {part.title}
              </h3>
              <p
                className={`text-sm reveal font-bold uppercase tracking-wide mb-6 ${part.color.split(" ")[1]}`}
              >
                {part.subtitle}
              </p>

              <p className="text-slate-600 reveal leading-relaxed mb-8">
                {part.desc}
              </p>

              {/* Feature List */}
              <ul className="space-y-3 mb-10 reveal">
                {part.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-slate-800 font-semibold text-sm"
                  >
                    <FaCheckCircle className="text-green-500" /> {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* step by step process */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-20">
          <h2 className="text-3xl font-extrabold text-center mb-16 reveal">
            Our Manufacturing Process
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center ">
            {/* LEFT IMAGE */}
            <div>
              <img
                src={activeStep.image}
                alt={activeStep.title}
                className="w-full h-[380px] object-cover rounded-2xl shadow-lg transition-all duration-500"
              />
            </div>

            {/* RIGHT STEPS */}
            <div className="space-y-16">
              {/* ROW 1 */}
              <div className="relative">
                <div className="absolute top-7 left-6 right-6 h-1 bg-gray-200" />
                <div className="flex justify-between relative z-10">
                  {manufacturingSteps.slice(0, 3).map((step) => (
                    <StepItem
                      key={step.number}
                      step={step}
                      activeStep={activeStep}
                      setActiveStep={setActiveStep}
                    />
                  ))}
                </div>
              </div>

              {/* ROW 2 */}
              <div className="relative">
                <div className="absolute top-7 left-6 right-6 h-1 bg-gray-200" />
                <div className="flex justify-between relative z-10">
                  {manufacturingSteps.slice(3, 6).map((step) => (
                    <StepItem
                      key={step.number}
                      step={step}
                      activeStep={activeStep}
                      setActiveStep={setActiveStep}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Footer / Tech Stack */}
        <div className="mt-20 flex flex-wrap justify-center gap-6">
          <div className="px-6 py-3 bg-blue-800 text-white rounded-xl flex items-center gap-3">
            <FaLayerGroup className="text-white" />
            <span className="text-sm font-bold">Tech: 3-Axis CNC</span>
          </div>
          <div className="px-6 py-3 bg-blue-800 text-white rounded-xl flex items-center gap-3">
            <FaMicrochip className="text-white" />
            <span className="text-sm font-bold">
              Compliance: AS9100D & ISO 9001
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

const StepItem = ({ step, activeStep, setActiveStep }) => {
  const isActive = activeStep.number === step.number;

  return (
    <>
      <SEO
        title="Rapid Prototype Manufacturing India | Precision Prototype Development & Custom Engineering | HGP Tools"
        description="HGP Tools offers rapid prototype manufacturing services in India including precision engineering prototypes, custom metal prototypes, product development, CNC prototype machining, and industrial prototyping solutions."
        keywords="Rapid prototype manufacturing India, Precision prototype development, Custom engineering prototypes, CNC prototype machining India, Metal prototype manufacturer, Industrial product development India, Rapid prototyping services Faridabad"
        url="https://www.hgptools.com/rapid-prototype"
        image="https://www.hgptools.com/images/rapid-prototype-banner.jpg"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Rapid Prototype Manufacturing",
          provider: {
            "@type": "Organization",
            name: "HGP Tools",
            url: "https://www.hgptools.com",
          },
          areaServed: {
            "@type": "Country",
            name: "India",
          },
          description:
            "Rapid prototype development, CNC machining prototypes, engineering design validation, and industrial product development solutions.",
        }}
      />

      <div
        onMouseEnter={() => setActiveStep(step)}
        className="cursor-pointer flex flex-col items-center w-full"
      >
        <div
          className={`w-14 h-14 flex items-center justify-center rounded-full border-4 transition-all duration-300
          ${
            isActive
              ? "bg-blue-800 border-blue-800 text-white scale-110"
              : "bg-white border-gray-300 text-gray-700"
          }`}
        >
          <span className="font-bold">{step.number}</span>
        </div>

        <div className="mt-4 text-center px-2">
          <h4
            className={`font-semibold ${
              isActive ? "text-blue-800" : "text-gray-800"
            }`}
          >
            {step.title}
          </h4>

          {isActive && (
            <p className="text-sm text-gray-600 mt-2 max-w-[180px]">
              {step.description}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default RapidPrototypingDetailed;
