import React from 'react';
import { FaUndo, FaTools, FaBoxOpen, FaClipboardCheck, FaTruck } from 'react-icons/fa';

const ReturnPolicy = () => {
  const lastUpdated = "January 19, 2026";

  const policies = [
    {
      title: "Marketplace Standard Tools",
      desc: "Standard tools purchased via our Marketplace can be returned within 10 days of delivery, provided they are unused and in original packaging.",
      icon: <FaBoxOpen />,
      type: "Eligible for Refund"
    },
    {
      title: "Custom Machined Components",
      desc: "Custom components (Rings, Shafts, Drone parts) manufactured as per client CAD drawings are non-returnable. We offer a full replacement guarantee if parts do not meet the specified micron-level tolerances.",
      icon: <FaTools />,
      type: "Replacement Only"
    },
    {
      title: "Quality Inspection Process",
      desc: "All returns are subject to inspection at our Faridabad facility. Tools must show no signs of mounting or operational wear to qualify for a standard return.",
      icon: <FaClipboardCheck />,
      type: "Technical Audit"
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="bg-blue-800 py-16 px-6 text-center text-white">
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
            <FaUndo className="text-4xl text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Returns & Refunds</h1>
        <p className="text-blue-100 text-lg max-w-2xl mx-auto">
          Our policy is designed to ensure technical satisfaction and industrial reliability.
        </p>
        <div className="mt-6 inline-block bg-blue-800 px-4 py-2 rounded-full text-sm font-medium border border-blue-500">
          Effective Date: {lastUpdated}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto py-16 px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {policies.map((item, index) => (
            <div key={index} className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col items-center text-center hover:translate-y-[-10px] transition-all duration-300">
              <div className="text-blue-600 text-4xl mb-6">{item.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                {item.type}
              </span>
              <p className="text-slate-500 leading-relaxed text-sm italic">
                "{item.desc}"
              </p>
            </div>
          ))}
        </div>

        {/* Detailed Shipping & Return Process */}
        <div className="mt-16 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-4">
            <FaTruck className="text-blue-600" /> Return Procedure
          </h2>
          <div className="space-y-6 text-slate-600 text-lg">
            <p>
              1. <strong>Initiation:</strong> Email <span className="text-blue-600 font-bold">support@hgptools.com</span> with your Order ID and photos of the tool/component.
            </p>
            <p>
              2. <strong>Reverse Pickup:</strong> For eligible marketplace items, we will arrange a reverse pickup within 48 hours via our logistics partners.
            </p>
            <p>
              3. <strong>Refund/Credit:</strong> Once the technical audit is complete, refunds are processed within 7 business days to the original payment method or as business credit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;
