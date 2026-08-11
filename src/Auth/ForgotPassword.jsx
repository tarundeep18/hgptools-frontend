import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // submit handler for submit the email
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/forgot-password`,
        { email },
      );
      toast.success(response.data.message || "Email sent successfully!");
      setTimeout(() => navigate("/reset-password"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="py-6 px-4">
          <div className="grid lg:grid-cols-2 items-center gap-6 max-w-6xl w-full">
            <div className="border border-slate-300 rounded-lg p-6 max-w-md shadow-[0_2px_22px_-4px_rgba(93,96,127,0.2)] max-lg:mx-auto">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="mb-12">
                  <h1 className="text-slate-900 text-3xl font-semibold">
                    Forgot Password
                  </h1>
                  <p className="text-slate-600 text-[15px] mt-6 leading-relaxed">
                    Enter your email to receive a password reset link.
                  </p>

                </div>
                {message && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-slate-900 text-sm font-medium mb-2 block">
                    Enter your email
                  </label>
                  <div className="relative flex items-center">
                    <input
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm text-slate-900 border border-slate-300 pl-4 pr-10 py-3 rounded-lg outline-blue-600"
                      placeholder="Enter your email"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#bbb"
                      stroke="#bbb"
                      className="w-[18px] h-[18px] absolute right-4"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="10" cy="7" r="6"></circle>
                      <path d="M14 15H6a5 5 0 0 0-5 5 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 5 5 0 0 0-5-5zm8-4h-2.59l.3-.29a1 1 0 0 0-1.42-1.42l-2 2a1 1 0 0 0 0 1.42l2 2a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-.3-.29H22a1 1 0 0 0 0-2z"></path>
                    </svg>
                  </div>
                </div>

                <div className="!mt-12">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full shadow-xl py-2.5 px-4 text-[15px] font-medium tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && (
                      <svg
                        className="w-5 h-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                    )}

                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>

            <div className="max-lg:mt-8">
              <img
                src="https://readymadeui.com/login-image.webp"
                className="w-full aspect-[71/50] max-lg:w-4/5 mx-auto block object-cover"
                alt="login img"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
