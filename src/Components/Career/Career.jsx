import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  Upload,
  Briefcase,
  Send,
  Globe,
} from "lucide-react";

const Career = () => {
  return (
    <div className="w-full bg-slate-50 min-h-screen font-sans ">
      {/* HERO SECTION */}
      <section className="relative bg-slate-900 py-28 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute transform -rotate-12 -left-10 -top-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute transform rotate-12 -right-10 -bottom-10 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center px-6">
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest text-blue-400 uppercase bg-blue-400/10 rounded-full">
            Work with us
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Build the Future of{" "}
            <span className="text-blue-800">Manufacturing</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            We are looking for passionate innovators to join our team in
            Faridabad. Your next big career move starts here.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-6  mt-12 mb-20 grid lg:grid-cols-3 gap-8">
        {/* FORM CARD */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Briefcase className="text-blue-800" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Apply for a Position
              </h2>
            </div>

            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-800 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-800 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 00000 00000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-800 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">
                    Position *
                  </label>
                  {/* <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none">
                    <option>Select a role</option>
                    <option>Production Engineer</option>
                    <option>Quality Analyst</option>
                    <option>Operations Manager</option>
                    <option>Other</option>
                  </select> */}
                  <input
                    type="text"
                    placeholder="Manager"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-800 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Tell us about yourself
                </label>
                <textarea
                  rows="4"
                  placeholder="Briefly describe your experience..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-800 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  Resume / CV *
                </label>
                <div className="relative group">
                  <div className="w-full border-2 border-dashed border-slate-200 group-hover:border-blue-800 rounded-xl p-8 transition-colors flex flex-col items-center justify-center bg-slate-50">
                    <Upload
                      className="text-slate-400 group-hover:text-blue-800 mb-2 transition-colors"
                      size={28}
                    />
                    <p className="text-sm text-slate-500">
                      <span className="text-blue-800 font-semibold">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PDF, DOCX (Max 5MB)
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-800 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transform active:scale-[0.98] transition-all"
              >
                <Send size={18} />
                Submit Application
              </button>
            </form>
          </div>
        </div>

        {/* SIDEBAR INFO */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/60 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Globe size={20} className="text-blue-600" />
              Contact Information
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Call Us
                  </p>
                  <p className="text-slate-700 font-medium">+91 8375076646</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Email Us
                  </p>
                  <p className="text-slate-700 font-medium text-sm">
                    hr@hgptools.com
                  </p>
                  <p className="text-slate-700 font-medium text-sm">
                    careers@hgptools.com
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Location
                  </p>
                  <p className="text-slate-700 font-medium text-sm leading-relaxed">
                    22A, Whirlpool Rd, Rajiv Gandhi Colony, NIT, Faridabad, HR
                    121001
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAP CARD */}

          <div className=" rounded-2xl overflow-hidden shadow-xl  border border-slate-100">
            <div className="p-2 border-b border-slate-50">
              <p className="text-xl font-bold text-black">Visit our office</p>
            </div>
            <div className="relative w-full h-98 overflow-hidden">
              <iframe
                title="Office Location"
                src="https://maps.google.com/maps?q=22A,%20Whirlpool%20Rd,%20Rajiv%20Gandhi%20Colony,%20New%20Industrial%20Township,%20Faridabad,%20Haryana%20121001&t=&z=14&ie=UTF8&iwloc=&output=embed"
                className="absolute inset-0 w-full h-full border-0  transition-all duration-500"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Career;
