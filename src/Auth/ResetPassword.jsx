import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setError("No reset token provided. Please request a new password reset.");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/reset-password/${token}`,
        { password },
      );
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      
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
                    Reset Password
                  </h1>
                  <p className="text-slate-600 text-[15px] mt-6 leading-relaxed">
                    Create a new password for your account.
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
                    Enter your new password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-sm text-slate-900 border border-slate-300 pl-4 pr-10 py-3 rounded-lg outline-blue-600"
                      placeholder="Enter your new password"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-900 text-sm font-medium mb-2 block">
                    Confirm your new password
                  </label>
                  <div className="relative flex items-center">
                    <input
                      name="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-sm text-slate-900 border border-slate-300 pl-4 pr-10 py-3 rounded-lg outline-blue-600"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
                <div className="mt-12">
                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full shadow-xl py-2.5 px-4 text-[15px] font-medium tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
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

export default ResetPassword;
