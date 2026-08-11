import React from "react";
import {
  FaFileContract,
  FaShieldAlt,
  FaBalanceScale,
  FaInfoCircle,
} from "react-icons/fa";

const TermsAndConditions = () => {
  const lastUpdated = "January 19, 2026";

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using the HGP Tools website or placing an order, you agree to comply with and be bound by these terms. These terms apply to all visitors, users, and industrial partners who access our services from Faridabad or globally.",
      icon: <FaInfoCircle />,
    },
    {
      title: "2. Intellectual Property",
      content:
        "All content, including CNC designs, tool specifications, logos, and technical drawings, are the exclusive property of HGP Tools (Proprietor: Harpal Singh). Unauthorized reproduction is strictly prohibited.",
      icon: <FaShieldAlt />,
    },
    {
      title: "3. Order & Manufacturing Policies",
      content:
        "All orders for custom machined components (rings, shafts, drone parts) are subject to technical validation. Production lead times provided are estimates and may vary based on material availability and complexity.",
      icon: <FaFileContract />,
    },
    {
      title: "4. Quality & Liability",
      content:
        "While HGP Tools adheres to ISO 9001 and AS9100D standards, our liability is limited to the replacement of defective tools or components. We are not liable for indirect damages resulting from improper tool usage.",
      icon: <FaBalanceScale />,
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="bg-blue-800 py-16 px-6 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Terms & Conditions
        </h1>
        <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
          Please read these terms carefully before engaging with our
          manufacturing services or marketplace.
        </p>
        <div className="mt-6 inline-block bg-blue-800 px-4 py-2 rounded-full text-sm font-medium">
          Last Updated: {lastUpdated}
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-200">
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 text-lg leading-relaxed mb-10">
              These Terms and Conditions govern your relationship with the **HGP
              Tools** website and our industrial manufacturing facility located
              in Faridabad, Haryana.
            </p>

            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={index} className="group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-blue-800 text-2xl group-hover:scale-110 transition-transform">
                      {section.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 m-0">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-slate-600 leading-relaxed pl-10 border-l-2 border-slate-100 group-hover:border-blue-800 transition-colors">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Legal Footer Note */}
            <div className="mt-16 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm italic mb-6">
                Any disputes arising from these terms shall be subject to the
                exclusive jurisdiction of the courts in **Faridabad, Haryana,
                India**.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;









