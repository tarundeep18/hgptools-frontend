import React from "react";
import {
  FaCheckCircle,
  FaCogs,
  FaVectorSquare,
  FaRobot,
  FaWeightHanging,
} from "react-icons/fa";
import { Link } from "react-router-dom";

const CNCBendingDetail = () => {
  const specs = [
    { label: "Bending Force (Tonnage)", value: "Up to 2 Tons" },
    { label: "Max Bending Length", value: "4000 mm" },
    { label: "Angular Precision", value: "±0.5° (Real-time Correction)" },
    {
      label: "Back-Gauge Configuration",
      value: "6-Axis (X1, X2, R1, R2, Z1, Z2)",
    },
    { label: "Material Thickness", value: "0.5mm to 20mm" },
    { label: "Standard Bend Radius", value: '0.030" (Industry Standard 2026)' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <main className="max-w-7xl mx-auto py-12 px-6 lg:px-20">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="flex items-center gap-3 mb-4 text-blue-700 font-bold tracking-widest text-xs uppercase">
              <FaVectorSquare /> Precision Metal Forming
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
              CNC Bending <br />
              <span className="text-blue-700">Adaptive Press Brake Tech</span>
            </h1>
            <p className="text-slate-600 text-xl leading-relaxed mb-8">
              Our 2026 facility features high-precision CNC press brakes with
              integrated LAMS (Laser Angle Measuring Systems). This ensures
              "first-part-correct" production by compensating for material
              springback and grain variations in real-time.
            </p>
            <div className="flex gap-4">
              <button className="bg-blue-800 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                <Link to="/contact-us">Request Quote</Link>
              </button>
            </div>
          </div>

          <div className="relative group">
            <img
              src="https://wmtmetal.com/wp-content/uploads/2020/10/press-brake-optimized.jpg"
              alt="High-Precision CNC Press Brake"
              className="relative rounded-[2.5rem] w-full h-[500px] object-cover shadow-2xl"
            />
          </div>
        </div>

        {/* Visual Gallery Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Forming & Bending Visuals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg border border-slate-200">
              <img
                src="https://www.har-tech.com/wp-content/uploads/2023/03/technique-de-pliage-de-metal.jpeg"
                alt="Automated Press Brake Cell"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg border border-slate-200">
              <img
                src="https://www.accurl.com/wp-content/uploads/2023/11/7-min-1.jpg"
                alt="Complex Sheet Metal Bend"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-3xl overflow-hidden h-64 shadow-lg border border-slate-200">
              <img
                src="https://anhuitooling.com/wp-content/uploads/2024/12/We-Provide-Best-Press-Brake-Tooling.jpg"
                alt="Precision Bending Tooling"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaCogs className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3">2-Axis Back-Gauge</h3>
            <p className="text-slate-500">
              Advanced multi-axis positioning allows for the complex folding of
              asymmetrical parts and deep-box geometries in a single setup.
            </p>
          </div>
          {/* <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaRobot className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3">Robotic Tending</h3>
            <p className="text-slate-500">
              Integrated robotic cells enable unmanned 24/7 bending, maintaining 
              flawless consistency for high-volume automotive and HVAC production.
            </p>
          </div> */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <FaWeightHanging className="text-4xl text-blue-800 mb-6" />
            <h3 className="text-2xl font-bold mb-3">High-Tonnage Capacity</h3>
            <p className="text-slate-500">
              With forces up to 2 tons, we easily handle heavy-gauge structural
              steel and hardened plates exceeding 20mm in thickness.
            </p>
          </div>
        </div>

        {/* Technical Specs Table */}
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 text-white">
          <h2 className="text-4xl font-black mb-12 text-center">
            Bending Specifications
          </h2>
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-6">
            {specs.map((spec, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center border-b border-slate-700 pb-4"
              >
                <span className="text-slate-400 font-medium uppercase tracking-wider text-sm">
                  {spec.label}
                </span>
                <span className="text-xl font-bold text-blue-800">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Industrial Advantages */}
        <div className="mt-20">
          <h2 className="text-4xl font-black mb-10">
            Why Choose Our Bending Services?
          </h2>
          <div className="space-y-6">
            {[
              "LAMS Angle Correction: Sensors verify and adjust every bend angle in real-time, eliminating manual re-work.",
              "Dynamic Crowning: Compensates for bed deflection to ensure perfectly straight bends across the entire 4m length.",
              "No-Mark Tooling: Specialized film and composite dies prevent scratches on stainless steel and aesthetic surfaces.",
              "Material Versatility: Expert forming for Aluminum, Grade 5 Titanium, Copper, and High-Strength Carbon Steels.",
            ].map((text, i) => (
              <div
                key={i}
                className="flex items-start gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
              >
                <FaCheckCircle className="text-blue-800 text-2xl mt-1" />
                <p className="text-slate-700 text-lg font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CNCBendingDetail;
