import React, { useEffect, useState } from "react";
import { FaLayerGroup, FaCogs } from "react-icons/fa";
import video1 from "../../../assets/sheet-metal.mp4";
import { FaIndustry, FaShieldAlt } from "react-icons/fa";
import PowerPress from "../../../assets/power-tool.png";
import PowerPressMachine from "../../../assets/power-press-machine-1.png";
import CuttingImg from "../../../assets/cutting.jpg";
import BendingImg from "../../../assets/bending.jpg";
import WeldingImg from "../../../assets/PowerPressWelding.png";
import { Link } from "react-router-dom";
import { reveal, revealStagger } from "../../../animation/ScrollAnimation";
import SEO from "../../../Pages/Seo/Seo";

const SheetMetalDetailed = () => {
  const slide = {
    src: video1,
    title: "Engineering Excellence, One Machined Part at a Time",
    description:
      "From initial blueprint to final inspection, we deliver high-performance tools built to your exact specifications.",
  };

  const manufacturingSteps = [
    {
      number: "01",
      title: "Received Drawings",
      description:
        "We receive your 3D drawings (STP, STEP, IGS, IGES) and prepare a quotation.",
      image:
        "https://www.jtc-machining.com/uploadfile/2022/04/07/202204071132047bpO9P.webp",
    },
    {
      number: "02",
      title: "Engineering & Planning",
      description:
        "Process simulation and manufacturing planning for accuracy.",
      image:
        "https://www.jtc-machining.com/uploadfile/2022/04/07/20220407113216sNJ3cn.webp",
    },
    {
      number: "03",
      title: "Sheet Metal Fabrication",
      description: "Laser cutting, CNC bending, polishing, and forming.",
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9gZ0r5__foFqH3pTUK40HnWPn5taK37h7kg&s",
    },
    {
      number: "04",
      title: "Process Check",
      description: "Tool testing, machine verification, and sample generation.",
      image:
        "https://www.jtc-machining.com/uploadfile/2022/04/07/20220407113352VnI9Pc.webp",
    },
    {
      number: "05",
      title: "Size Inspection",
      description: "Post-processing dimensional accuracy verification.",
      image:
        "https://www.jtc-machining.com/uploadfile/2022/04/07/202204071134081AiYdy.webp",
    },
    {
      number: "06",
      title: "Surface Finish & QC",
      description: "Final finishing, coating, and quality inspection.",
      image:
        "https://www.jtc-machining.com/uploadfile/2022/04/07/202204071134180gqmG8.webp",
    },
  ];

  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);
  const [activeStep, setActiveStep] = useState(manufacturingSteps[0]);

  return (
    <>

    <SEO
        title="Sheet Metal Parts Manufacturer India | Precision Fabrication & Custom Sheet Metal Components | HGP Tools"
        description="HGP Tools is a leading sheet metal parts manufacturer in India specializing in precision sheet metal fabrication, custom sheet metal components, industrial sheet metal manufacturing, punching, bending, welding, and fabrication solutions."
        keywords="Sheet metal parts manufacturer India, Precision sheet metal fabrication company, Custom sheet metal parts supplier, Sheet metal fabrication company Faridabad, Industrial sheet metal components manufacturer, Precision fabricated sheet metal parts, CNC sheet metal fabrication India"
        url="https://www.hgptools.com/sheet-metal-parts"
        image="https://www.hgptools.com/images/sheet-metal-banner.jpg"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          serviceType: "Sheet Metal Fabrication",
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
            "Precision sheet metal fabrication, punching, bending, welding, and custom industrial sheet metal parts manufacturing."
        }}
      />
      {/* ================= HERO ================= */}
      <div className="relative w-full h-[400px] md:h-[550px] overflow-hidden bg-black">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={slide.src} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="relative reveal z-10 h-full max-w-7xl mx-auto px-6 lg:px-20 flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 reveal">
              {slide.title}
            </h1>
            <p className="text-lg opacity-90 mb-6 reveal">
              {slide.description}
            </p>
            <button className="bg-blue-800 hover:bg-blue-700 px-6 py-3 rounded-md font-bold uppercase text-xs tracking-widest">
              Request Quote
            </button>
          </div>
        </div>
      </div>

      {/* ================= FEATURES ================= */}
      <div className="max-w-7xl mx-auto p-6 md:p-10 rounded-xl mt-10">
        <h2 className="text-3xl font-extrabold text-center reveal mb-10">
          Sheet Metal Fabrication Services
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 stagger-card">
          <Link to="/tools/press-tools">
            {" "}
            <FeatureCard
              title="Press Tools"
              image={PowerPress}
              desc="Welding services include MIG, TIG, and spot welding to assemble and strengthen sheet metal components."
              icon={<FaShieldAlt />}
            />
          </Link>

          <FeatureCard
            title="Power Press"
            image={PowerPressMachine}
            desc="Power press machines are used for stamping, punching, blanking, and forming sheet metal parts with high speed and accuracy."
            icon={<FaIndustry />}
          />

          <FeatureCard
            title="Welding"
            image={WeldingImg}
            desc="Welding services include MIG, TIG, and spot welding to assemble and strengthen sheet metal components."
            icon={<FaShieldAlt />}
          />
          <FeatureCard
            title="CNC Bending"
            image={BendingImg}
            desc="CNC bending forms sheet metal into accurate angles and shapes according to customer specifications."
            icon={<FaCogs />}
          />
          <FeatureCard
            title="Laser Cutting"
            image={CuttingImg}
            desc="Sheet metal laser cutting customizes precise shapes from raw sheet metal using high-precision laser machinery."
            icon={<FaLayerGroup />}
          />
        </div>
      </div>
      {/* ================= WHAT WE MANUFACTURE ================= */}
      <div className="mt-28 max-w-7xl mx-auto px-6 md:px-10 stagger-card">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="inline-block reveal mb-3 px-4 py-1 text-xs font-semibold tracking-widest text-blue-600 bg-blue-50 rounded-full">
            OUR CAPABILITIES
          </span>

          <h2 className="text-3xl reveal md:text-4xl font-extrabold text-gray-900 mb-4">
            Components We Manufacture
          </h2>

          <p className="text-gray-600 reveal max-w-3xl mx-auto text-lg">
            Leveraging laser cutting, CNC bending, power press, and advanced
            welding, we manufacture high-precision sheet metal components for
            demanding industrial applications.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 reveal gap-10">
          {[
            {
              title: "Electrical Panels & Enclosures",
              desc: "Precision-fabricated enclosures for electrical and power systems.",
            },
            {
              title: "Mounting Brackets & Clamps",
              desc: "High-strength brackets manufactured using power press & bending.",
            },
            {
              title: "Control Boxes & Cabinets",
              desc: "Custom-designed cabinets with accurate dimensions and finish.",
            },
            {
              title: "Busbar Supports & Covers",
              desc: "Insulated and metallic supports for electrical busbar systems.",
            },
            {
              title: "Automotive Sheet Metal Parts",
              desc: "Durable metal components for automotive assemblies.",
            },
            {
              title: "Machine Frames & Housings",
              desc: "Welded and formed frames for industrial machinery.",
            },
            {
              title: "Custom Fabricated Assemblies",
              desc: "End-to-end fabrication from raw sheet to final assembly.",
            },
            {
              title: "Industrial Structural Parts",
              desc: "Load-bearing structural components for heavy applications.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group relative reveal bg-white border border-gray-200 rounded-2xl p-8
      transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-600"
            >
              {/* Top Accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-t-2xl opacity-0 group-hover:opacity-100 transition" />

              {/* Icon */}
              <div
                className="mb-6 reveal flex h-14 w-14 items-center justify-center rounded-xl
        bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition"
              >
                <FaIndustry className="text-xl" />
              </div>

              {/* Content */}
              <h4 className="font-bold reveal text-gray-900 mb-2 leading-snug">
                {item.title}
              </h4>

              <p className="text-sm reveal text-gray-600 leading-relaxed">
                {item.desc}
              </p>

              {/* Bottom CTA Indicator */}
              <div className="mt-6 flex items-center text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition">
                Manufactured In-House
                <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MATERIALS ================= */}
      <div className="max-w-8xl mx-auto  mt-28 reveal bg-gray-500  bg-gradient-to-b from-gray-50 to-white py-24">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

        <div className="relative mx-auto px-6 md:px-10">
          {/* Heading */}
          <div className="text-center reveal mb-16">
            <span className="inline-block  mb-3 px-4 py-1 text-xs font-semibold tracking-widest text-blue-600 bg-blue-50 rounded-full">
              MATERIAL EXPERTISE
            </span>

            <h2 className="text-3xl reveal md:text-4xl font-extrabold text-gray-900 mb-4">
              Materials We Work With
            </h2>

            <p className="text-gray-600 max-w-2xl reveal mx-auto text-lg">
              We process a wide range of industrial-grade metals to meet
              strength, durability, and application-specific requirements.
            </p>
          </div>

          {/* Material Cards */}
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8  stagger-card">
            {[
              {
                name: "Mild Steel (MS)",
                note: "Structural & general fabrication",
              },
              {
                name: "Stainless Steel (SS)",
                note: "Corrosion-resistant components",
              },
              { name: "Aluminum", note: "Lightweight & precision parts" },
              {
                name: "Galvanized Steel (GI)",
                note: "Zinc-coated for durability",
              },
              { name: "CRCA Sheets", note: "Cold-rolled precision sheets" },
              { name: "HR Sheets", note: "Hot-rolled heavy-duty sheets" },
              { name: "Copper", note: "Electrical & conductive parts" },
              {
                name: "Custom Alloys",
                note: "Application-specific materials",
              },
            ].map((mat, i) => (
              <div
                key={i}
                className="group reveal relative bg-white border border-gray-200 rounded-2xl p-6
          transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-600"
              >
                {/* Icon */}
                <div
                  className="mb-5 reveal flex h-5 w-5 items-center justify-center rounded-xl
            bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition"
                >
                  <FaShieldAlt className="text-lg" />
                </div>

                {/* Content */}
                <h4 className="font-bold text-gray-900 reveal mb-1">
                  {mat.name}
                </h4>

                <p className="text-sm text-gray-600 reveal">{mat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= PROCESS (2 ROW TIMELINE) ================= */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-20">
        <h2 className="text-3xl font-extrabold text-center mb-16 reveal">
          Our Manufacturing Process
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* LEFT IMAGE */}
          <div>
            <img
              src={activeStep.image}
              alt={activeStep.title}
              className="w-full h-[380px] reveal object-cover rounded-2xl shadow-lg transition-all duration-500"
            />
          </div>

          {/* RIGHT STEPS */}
          <div className="space-y-16">
            {/* ROW 1 */}
            <div className="relative">
              <div className="absolute top-7 left-6 right-6 h-1 bg-gray-200" />
              <div className="flex justify-between relative z-10 reveal">
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

      {/* Infrastructure Highlights */}
      <div className="max-w-7xl mx-auto  mt-20 grid grid-cols-1 md:grid-cols-2 gap-6 stagger-card">
        <div className="bg-blue-800 p-8 rounded-3xl flex items-center gap-6 text-white">
          <FaIndustry className="text-5xl text-white" />
          <div>
            <h4 className="text-xl font-bold">In-House Powder Coating</h4>
            <p className="text-slate-400 text-sm">
              Equipped for heavy-gauge industrial enclosures.
            </p>
          </div>
        </div>
        <div className="bg-blue-800 p-8 rounded-3xl flex items-center gap-6 text-white">
          <FaShieldAlt className="text-5xl text-white" />
          <div>
            <h4 className="text-xl font-bold">Zero-Corrosion Guarantee</h4>
            <p className="text-white text-sm">
              Certified surface treatments for outdoor durability.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const StepItem = ({ step, activeStep, setActiveStep }) => {
  const isActive = activeStep.number === step.number;

  return (
    <div
      onMouseEnter={() => setActiveStep(step)}
      className="cursor-pointer flex flex-col items-center w-full"
    >
      <div
        className={`w-14 h-14 flex items-center justify-center rounded-full border-4 transition-all duration-300
          ${
            isActive
              ? "bg-blue-600 border-blue-600 text-white scale-110"
              : "bg-white border-gray-300 text-gray-700"
          }`}
      >
        <span className="font-bold">{step.number}</span>
      </div>

      <div className="mt-4 text-center px-2">
        <h4
          className={`font-semibold ${
            isActive ? "text-blue-600" : "text-gray-800"
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
  );
};

const FeatureCard = ({ title, image, desc, icon }) => (
  <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition">
    <img src={image} alt={title} className="w-full h-56 object-contain" />
    <div className="p-6">
      <div className="flex items-center mb-3 text-blue-600">
        {icon}
        <h3 className="ml-2 text-xl font-bold">{title}</h3>
      </div>
      <p className="text-gray-600">{desc}</p>
    </div>
  </div>
);

export default SheetMetalDetailed;
