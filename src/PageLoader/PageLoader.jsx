import React from "react";
import logo from "../assets/logo34-removebg-preview.png";

// Dark theme
const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col items-center">
        {/* Industrial Spinner */}

        <div className="relative h-28 w-28">
          <svg
            className="h-full w-full animate-spin-slow"
            viewBox="0 0 100 100"
          >
            {/* Outer Ring */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#1e293b"
              strokeWidth="8"
            />

            {/* Active Stroke */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="80 200"
              className="animate-dash"
            />
          </svg>

          {/* Center Gear Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full border-4 border-sky-400 animate-pulse" />
          </div>
        </div>

        {/* Branding Text */}
        <div className="mt-10 text-center">
          <p className="text-xs tracking-[0.5em] text-slate-400 uppercase">
            Loading website
          </p>
          <h2 className="text-2xl font-semibold text-white mt-2 tracking-wide">
            Initializing
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Preparing machinery & workflows...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 w-56 h-[3px] bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-sky-400 animate-progress" />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes dash {
          0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 100, 200;
            stroke-dashoffset: -40px;
          }
          100% {
            stroke-dasharray: 100, 200;
            stroke-dashoffset: -120px;
          }
        }

        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 2.5s linear infinite;
        }

        .animate-dash {
          animation: dash 1.6s ease-in-out infinite;
        }

        .animate-progress {
          width: 100%;
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default PageLoader;

// white theme

// const PageLoader = () => {
//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white">
//       <div className="flex flex-col items-center">
//         {/* Logo Section */}
//         {/* <div className="mb-6">
//           <img src={logo} alt="Company Logo" className="h-16 object-contain" />
//         </div> */}

//         {/* Clean Circular Loader */}
//         <div className="relative h-20 w-20">
//           <svg className="h-full w-full animate-spin" viewBox="0 0 50 50">
//             <circle
//               cx="25"
//               cy="25"
//               r="20"
//               fill="none"
//               stroke="#e2e8f0"
//               strokeWidth="4"
//             />

//             <circle
//               cx="25"
//               cy="25"
//               r="20"
//               fill="none"
//               stroke="#2563eb"
//               strokeWidth="4"
//               strokeLinecap="round"
//               strokeDasharray="80 150"
//               className="animate-dash"
//             />
//           </svg>
//         </div>

//         {/* Text */}
//         <div className="mt-6 text-center">
//           <h2 className="text-lg font-semibold text-gray-800 tracking-wide">
//             Loading Website
//           </h2>
//           <p className="text-sm text-gray-500 mt-1">
//             Please wait while we prepare your data
//           </p>
//         </div>

//         {/* Progress Bar */}
//         <div className="mt-5 w-40 h-[3px] bg-gray-200 rounded-full overflow-hidden">
//           <div className="h-full bg-blue-600 animate-progress" />
//         </div>
//       </div>

//       <style jsx>{`
//         @keyframes dash {
//           0% {
//             stroke-dasharray: 1, 150;
//             stroke-dashoffset: 0;
//           }
//           50% {
//             stroke-dasharray: 90, 150;
//             stroke-dashoffset: -35;
//           }
//           100% {
//             stroke-dasharray: 90, 150;
//             stroke-dashoffset: -120;
//           }
//         }

//         @keyframes progress {
//           0% {
//             transform: translateX(-100%);
//           }
//           50% {
//             transform: translateX(0%);
//           }
//           100% {
//             transform: translateX(100%);
//           }
//         }

//         .animate-dash {
//           animation: dash 1.5s ease-in-out infinite;
//         }

//         .animate-progress {
//           width: 100%;
//           animation: progress 2s ease-in-out infinite;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default PageLoader;
