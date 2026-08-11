import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaPaperPlane,
  FaFileUpload,
} from "react-icons/fa";

const Contact = () => {
  const [fileName, setFileName] = useState("Choose file or drag here");
  const [contacts, setContacts] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phnNumber: "",
    description: "",
    drawing: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "file_upload") {
      setFormData((prev) => ({
        ...prev,
        drawing: files[0],
      }));
    } else if (name === "phone") {
      setFormData((prev) => ({
        ...prev,
        phnNumber: value,
      }));
    } else if (name === "message") {
      setFormData((prev) => ({
        ...prev,
        description: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phnNumber", formData.phnNumber);
      data.append("description", formData.description);
      data.append("drawing", formData.drawing);

      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/contact`,
        data,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast.success("Contact details sent successfully!");
        console.log("contact details", response.data);

        setFormData({
          name: "",
          email: "",
          phnNumber: "",
          description: "",
          drawing: null,
        });

        setFileName("Choose file or drag here");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send contact");
    }
  };

  return (
    <section className="py-24 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="reveal text-blue-800 font-bold uppercase tracking-widest text-sm mb-3">
            Commitment Beyond Business
          </h2>
          <p className="reveal text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
            Contact <span className="text-blue-800">US</span>
          </p>
          <div className="h-1.5 w-24 bg-blue-800 mx-auto mt-6 rounded-full"></div>
        </div>
        <div className="grid lg:grid-cols-2 grid-cols-1 gap-12 items-stretch">
          {/* Form Side */}
          <div className="reveal bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-blue-800 font-bold text-sm uppercase tracking-[0.2em] mb-2">
                Connect with HGP
              </h1>
              <h2 className="text-gray-900 text-4xl font-bold">
                Leave us a message
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Row 1: Name and Email */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="relative">
                  <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none text-gray-700"
                    placeholder="Full Name"
                    required
                    onChange={handleChange}
                  />
                </div>
                <div className="relative">
                  <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none text-gray-700"
                    placeholder="Email Address"
                    required
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Row 2: Phone */}
              <div className="relative">
                <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  className="w-full h-14 pl-12 pr-6 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none text-gray-700"
                  placeholder="Telephone (e.g. +91 ...)"
                  required
                  onChange={handleChange}
                />
              </div>

              {/* Message */}
              <textarea
                name="message"
                className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all outline-none text-gray-700 resize-none"
                placeholder="Briefly describe your requirements..."
                onChange={handleChange}
              ></textarea>

              {/* File Upload */}
              <div className="group">
                <label className="block text-gray-500 mb-2 ml-1 text-xs font-bold uppercase tracking-wider">
                  Technical Drawing / RFQ
                </label>
                <div className="relative w-full h-14 border-2 border-dashed border-slate-200 rounded-2xl flex items-center px-6 bg-slate-50 group-hover:border-indigo-400 group-hover:bg-indigo-50 transition-all cursor-pointer">
                  <input
                    type="file"
                    name="file_upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      setFileName(e.target.files[0]?.name || "Choose file");
                      handleChange(e);
                    }}
                  />
                  <div className="flex items-center gap-3 text-gray-500 group-hover:text-indigo-600">
                    <FaFileUpload className="text-xl" />
                    <span className="text-sm font-medium truncate">
                      {fileName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full h-14 flex items-center justify-center gap-3 text-white text-lg font-bold rounded-2xl bg-blue-800 shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all active:scale-[0.98]"
              >
                Send Inquiry <FaPaperPlane className="text-sm" />
              </button>
            </form>
          </div>

          {/* Map Side */}
          <div className="reveal flex flex-col gap-6">
            {/* The Map */}
            <div className="flex-grow min-h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
              <iframe
                className="w-full h-full grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                frameBorder="0"
                src="https://maps.google.com/maps?width=637&height=559&hl=en&q=22%2FA%20whirlpool%20road%20industrial%20area%20NIT%20Faridabad-121001&t=&z=18&ie=UTF8&iwloc=B&output=embed"
                title="Google Map - Faridabad Industrial Area"
              ></iframe>
            </div>

            {/* Business Quick Info Bar */}
            <div className="bg-blue-800 p-6 rounded-3xl text-white flex justify-around items-center">
              <div className="text-center">
                <p className="text-indigo-300 text-xs uppercase font-bold">
                  Office Hours
                </p>
                <p className="font-medium">9:00 AM - 6:00 PM</p>
              </div>
              <div className="h-8 w-px bg-blue-800"></div>
              <div className="text-center">
                <p className="text-indigo-300 text-xs uppercase font-bold">
                  Location
                </p>
                <p className="font-medium">Faridabad, HR</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
