import React from "react";
import {
  FaCookieBite,
  FaShieldAlt,
  FaChartLine,
  FaCog,
  FaLock,
} from "react-icons/fa";

const CookiePolicy = () => {
  const lastUpdated = "January 19, 2026";

  const cookieTypes = [
    {
      title: "Essential Cookies",
      desc: "Necessary for the Tool Marketplace to function, such as managing your cart, secure login, and session persistence.",
      icon: <FaLock />,
      status: "Required",
    },
    {
      title: "Analytical Cookies",
      desc: "Helps us understand how industrial users interact with our site so we can optimize our technical resources and load times.",
      icon: <FaChartLine />,
      status: "Optional",
    },
    {
      title: "Functional Cookies",
      desc: "Remembers your preferences, such as your region (e.g., Faridabad/Global) and specific tool categories of interest.",
      icon: <FaCog />,
      status: "Optional",
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <div className="bg-blue-800 py-16 px-6 text-center text-white">
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
            <FaCookieBite className="text-4xl text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Cookie Policy
        </h1>
        <p className="text-amber-50 text-lg max-w-2xl mx-auto">
          We use cookies to enhance your technical browsing experience and
          optimize our manufacturing services.
        </p>
        <div className="mt-6 inline-block bg-blue-800 px-4 py-2 rounded-full text-sm font-medium border border-blue-500">
          Updated: {lastUpdated}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-16 px-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-8 md:p-12 border border-slate-200">
          <p className="text-slate-600 text-lg leading-relaxed mb-12">
            This policy explains how **HGP Tools** uses cookies and similar
            technologies to recognize you when you visit our website. It
            explains what these technologies are and why we use them.
          </p>

          <div className="space-y-8">
            {cookieTypes.map((cookie, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-start gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:border-blue-800"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-800 text-2xl shadow-sm">
                  {cookie.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {cookie.title}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-200 px-2 py-0.5 rounded">
                      {cookie.status}
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed italic">
                    "{cookie.desc}"
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Management Section */}
          <div className="mt-16 pt-8 border-t border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
              <FaShieldAlt className="text-blue-800" /> How can I control
              cookies?
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              You can set or amend your web browser controls to accept or refuse
              cookies. If you choose to reject cookies, you may still use our
              website, though your access to some functionality (like the Tool
              Marketplace cart) may be restricted.
            </p>
            <div className="p-6 bg-slate-900 rounded-2xl text-white text-center">
              <p className="text-sm mb-4">
                For more information about how we protect your overall data,
                please visit our Privacy Policy.
              </p>
              <button className="bg-blue-800 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
                Update Cookie Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
