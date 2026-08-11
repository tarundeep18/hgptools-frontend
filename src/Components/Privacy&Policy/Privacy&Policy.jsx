import React from "react";
import {
  FaLock,
  FaUserShield,
  FaDatabase,
  FaCookieBite,
  FaUserEdit,
} from "react-icons/fa";

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content:
        "We collect information necessary to provide industrial manufacturing services. This includes contact details (Name, Email, Phone), business information, and technical files (CAD drawings, blueprints) uploaded via our RFQ forms.",
      icon: <FaDatabase />,
    },
    {
      title: "2. Data Protection (IP Protection)",
      content:
        "As an aerospace and automotive supplier, we understand the value of Intellectual Property. Your technical drawings and proprietary designs are stored on secure servers and are only accessible by authorized engineering personnel.",
      icon: <FaLock />,
    },
    {
      title: "3. How We Use Your Data",
      content:
        "Your data is used solely for processing orders, providing technical quotes, and communicating about your manufacturing projects. We do not sell or lease your business data to third-party marketing firms.",
      icon: <FaUserShield />,
    },
    {
      title: "4. Cookies & Analytics",
      content:
        "We use cookies to improve your experience on our Tool Marketplace and to analyze website traffic. This helps us optimize our tool inventory based on industrial demand.",
      icon: <FaCookieBite />,
    },
    {
      title: "5. Your Rights",
      content:
        "You have the right to request access to your data, ask for corrections, or request the permanent deletion of your technical files from our manufacturing records after a project is completed.",
      icon: <FaUserEdit />,
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="bg-blue-800 py-16 px-6 text-center text-white">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Privacy Policy
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          At HGP Tools, your industrial privacy and data security are our top
          priorities.
        </p>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-200">
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                    {section.icon}
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">
                    {section.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
