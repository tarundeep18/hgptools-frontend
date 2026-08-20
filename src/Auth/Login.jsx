import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/login`,
        {
          email,
          password,
        },
        {
          withCredentials: true,
        },
      );

  

      const loggedUser = response?.data?.user;

      if (!loggedUser) {
        toast.error("User data missing from response");
        return;
      }

      setUser({
        _id: loggedUser._id,
        email: loggedUser.email,
        name: loggedUser.fname,
        role: loggedUser.role,

        loading: false,
      });

      toast.success("Login successful!");

      if (loggedUser.role === "admin") {
        navigate("/dashboard");
      } else if (loggedUser.role === "client") {
        navigate("/client-dashboard");
      } else if (loggedUser.role === "qc") {
        navigate("/qc-dashboard");
      } else {
        toast.error("Unauthorized role");
      }
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);

      toast.error(
        error.response?.data?.message || "Login failed. Please try again.",
      );
    }
  };
  return (
    <>
      <div class="min-h-screen flex fle-col items-center justify-center">
        <div class="py-6 px-4">
          <div class="grid lg:grid-cols-2 items-center gap-6 max-w-6xl w-full">
            <div class="border border-slate-300 rounded-lg p-6 max-w-md shadow-[0_2px_22px_-4px_rgba(93,96,127,0.2)] max-lg:mx-auto">
              <form onSubmit={submitHandler} class="space-y-6">
                <div class="mb-12">
                  <h1 class="text-slate-900 text-3xl font-semibold">Sign in</h1>
                  <p class="text-slate-600 text-[15px] mt-6 leading-relaxed">
                    Sign in to your account and explore a world of
                    possibilities. Your journey begins here.
                  </p>
                </div>

                <div>
                  <label class="text-slate-900 text-sm font-medium mb-2 block">
                    User name
                  </label>
                  <div class="relative flex items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      class="w-full text-sm text-slate-900 border border-slate-300 pl-4 pr-10 py-3 rounded-lg outline-blue-600"
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#bbb"
                      stroke="#bbb"
                      class="w-[18px] h-[18px] absolute right-4"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="10"
                        cy="7"
                        r="6"
                        data-original="#000000"
                      ></circle>
                      <path
                        d="M14 15H6a5 5 0 0 0-5 5 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 5 5 0 0 0-5-5zm8-4h-2.59l.3-.29a1 1 0 0 0-1.42-1.42l-2 2a1 1 0 0 0 0 1.42l2 2a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-.3-.29H22a1 1 0 0 0 0-2z"
                        data-original="#000000"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <label className="text-slate-900 text-sm font-medium mb-2 block">
                    Password
                  </label>

                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full text-sm text-slate-900 border border-slate-300 pl-4 pr-10 py-3 rounded-lg outline-blue-600"
                    />

                    {/* Eye Icon */}
                    <svg
                      onClick={() => setShowPassword(!showPassword)}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="#bbb"
                      stroke="#bbb"
                      className="w-[18px] h-[18px] absolute right-4 cursor-pointer"
                      viewBox="0 0 128 128"
                    >
                      {showPassword ? (
                        // Eye Off Icon (when password is visible)
                        <path d="M64 32c31.955 0 50.553 24.775 55.293 31.994C114.535 71.205 95.854 96 64 96c-31.955 0-50.553-24.775-55.293-31.994C13.465 56.795 32.146 32 64 32zM64 40c-13.234 0-24 10.766-24 24 0 4.25 1.11 8.242 3.05 11.72L75.72 43.05A23.892 23.892 0 0 0 64 40z" />
                      ) : (
                        // Eye Icon (when password is hidden)
                        <path d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24z" />
                      )}
                    </svg>
                  </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div class="text-sm">
                    <h4 class="text-blue-800 hover:underline font-medium">
                      <Link to="/forgot-password">Forgot your password?</Link>
                    </h4>
                  </div>
                </div>

                <div class="!mt-12">
                  <button
                    type="submit"
                    class="w-full shadow-xl py-2.5 px-4 text-[15px] font-medium tracking-wide rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer"
                  >
                    Sign in
                  </button>
                  {/* <p class="text-sm !mt-6 text-center text-slate-600">
                    Don't have an account{" "}
                    <a
                      href="javascript:void(0);"
                      class="text-blue-600 font-medium hover:underline ml-1 whitespace-nowrap"
                    >
                      Register here
                    </a>
                  </p> */}
                </div>
              </form>
            </div>

            <div class="max-lg:mt-8">
              <img
                src="https://readymadeui.com/login-image.webp"
                class="w-full aspect-[71/50] max-lg:w-4/5 mx-auto block object-cover"
                alt="login img"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
