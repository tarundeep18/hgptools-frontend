import React from "react";
import { 
  FaTools, 
  FaCogs, 
  FaShieldAlt, 
  FaCloudDownloadAlt, 
  FaShoppingCart,
  FaVrCardboard
} from "react-icons/fa";

const HardwareSupport = () => {
  const supportCategories = [
    {
      title: "Predictive Maintenance",
      desc: "Using AI-driven sensor data to identify abnormal heat or vibration, preventing failures before they cause downtime in 2026 smart factories.",
      icon: <FaCogs className="text-blue-800" />,
      specs: ["Vibration Analysis", "Thermal Imaging", "Real-time IIoT Alerts"]
    },
    {
      title: "On-Site & Remote Calibration",
      desc: "Precision calibration for micrometers, digital indicators, and torque wrenches to ensure compliance with AS9100D standards.",
      icon: <FaTools className="text-blue-800" />,
      specs: ["ISO/IEC 17025 Certified", "Remote AR Diagnostics", "NIST Traceable"]
    },
    {
      title: "HaaS (Hardware-as-a-Service)",
      desc: "Shift from Capex to Opex with our managed hardware models. Includes automated 3-year refresh cycles and full lifecycle management.",
      icon: <FaShieldAlt className="text-blue-800" />,
      specs: ["Zero-Touch Deployment", "Managed Replacement", "Flexible Scaling"]
    },
    {
      title: "Digital Twin Integration",
      desc: "Hardware troubleshooting via 3D digital twins. Simulate stress tests and part replacements in a virtual environment before execution.",
      icon: <FaVrCardboard className="text-blue-800" />,
      specs: ["CAD Synchronization", "What-if Scenarios", "Operational Simulation"]
    }
  ];

  return (
    <section className="bg-slate-50 py-20 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Industrial <span className="text-blue-800">Hardware Support</span> 2026
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Maximizing uptime through smart maintenance, lifecycle management, and rapid technical intervention.
          </p>
        </div>

        {/* Support Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {supportCategories.map((item, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-5">
                <div className="text-3xl p-4 bg-blue-50 rounded-xl">{item.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-500 mb-4 leading-relaxed">{item.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.specs.map((spec, sIdx) => (
                      <span key={sIdx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* E-commerce Call to Action */}
        <div className="bg-blue-900 rounded-[2.5rem] p-10 md:p-16 text-white flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-3xl font-extrabold mb-4">Need Replacement Parts?</h3>
            <p className="text-blue-200 text-lg max-w-md">
              Access our 2026 Digital Catalog for certified industrial components, 
              real-time inventory tracking, and next-day global shipping.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href="/store" 
              className="flex items-center justify-center gap-3 bg-white text-blue-900 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-xl"
            >
              <FaShoppingCart /> Visit Online Store
            </a>
            <button className="flex items-center justify-center gap-3 border border-blue-400 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-800 transition-colors">
              <FaCloudDownloadAlt /> Service Manuals
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HardwareSupport;
