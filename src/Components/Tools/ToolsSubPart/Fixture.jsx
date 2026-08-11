import React from "react";
import { Link } from "react-router-dom";
import FixtureImg from "../../../assets/fixture.png";

const Fixture = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-slate-50  text-white py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top,white,transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-block mb-4 px-4 py-1 text-sm font-semibold rounded-full bg-blue-800 text-white">
              Precision Engineering Experts
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-black">
              Custom Jigs & Fixture
              <span className="block text-blue-800">Manufacturers</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              Optimizing your production line with high-precision jigs and
              fixtures engineered for repeatable accuracy, reduced cycle times,
              and seamless manufacturing integration.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="px-8 py-4 rounded-xl bg-blue-800 text-white font-semibold hover:bg-blue-900 transition">
                <Link to="/contact-us">Request Custom Fixture</Link>
              </button>
              {/* <button className="px-8 py-4 rounded-xl border border-slate-300 hover:bg-slate-50 transition">
      View Tooling Capabilities
    </button> */}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl " />
            <img
              src={FixtureImg}
              alt="Power Press Tool Manufacturing"
              className="relative rounded-3xl  object-cover"
            />
          </div>
        </div>
      </section>

      {/* cards of jigs and fixture */}
      <h1 className="text-2xl md:text-4xl font-extrabold leading-tight text-blue-800 text-center pt-10">
        Custom Jigs & Fixture
        <div className="h-1.5 w-24 bg-blue-800 mx-auto mt-4 rounded-full"></div>
        {/* <span className="block text-blue-800">Manufacturers</span> */}
      </h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8  mx-auto py-12 px-6 lg:px-20 ">
        {/* <!-- Jig Card --> */}
        <div class="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div class="md:flex h-full">
            <div class="md:w-1/3 overflow-hidden">
              <img
                class="h-48 w-full object-cover md:h-full group-hover:scale-105 transition-transform duration-500"
                src="https://cpimg.tistatic.com/11141650/b/4/Pneumatic-Jig-Fixture..png"
                alt="Mechanical Jig"
              />
            </div>
            <div class="p-6 md:w-2/3 flex flex-col">
              <span class="text-xs font-semibold tracking-wider text-blue-800 uppercase mb-2">
                Precision Tooling
              </span>
              <h3 class="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                Jig: Tool Guide
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed mb-4">
                Its primary function is to direct the tool (such as a drill bit)
                to a precise location, often using hardened steel bushings to
                ensure the tool follows the correct path.jigs are predominantly
                used in "uni-dimensional" machining processes like drilling,
                reaming, tapping, and boring.Jigs are typically lighter in
                construction for easier handling and are often not clamped to
                the machine table unless high forces are involved
              </p>
            </div>
          </div>
        </div>

        {/* <!-- Fixture Card --> */}
        <div class="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div class="md:flex h-full">
            <div class="md:w-1/3 overflow-hidden">
              <img
                class="h-48 w-full object-cover md:h-full group-hover:scale-105 transition-transform duration-500"
                src="https://www.prachifixtures.com/assets/img/products/vmchydra.jpg"
                alt="Mechanical Fixture"
              />
            </div>
            <div class="p-6 md:w-2/3 flex flex-col">
              <span class="text-xs font-semibold tracking-wider text-blue-800 uppercase mb-2">
                Work Holding
              </span>
              <h3 class="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                Fixture: Work-Holder
              </h3>
              <p class="text-slate-600 text-sm leading-relaxed mb-4">
                Its main objective is to establish a secure mounting point and
                maintain the workpiece in a fixed orientation relative to the
                machine. In a fixture-based operation, the tool moves relative
                to the stationary workpiece.Fixtures are essential for
                multi-dimensional operations like milling, turning, grinding,
                shaping, and assembly or welding processes.Fixtures are
                generally heavier and more robust than jigs to withstand higher
                cutting forces and are typically bolted or rigidly clamped to
                the machine table
              </p>
              <div class="mt-auto"></div>
            </div>
          </div>
        </div>
      </div>

      <section class="py-16 bg-white px-6 lg:px-20 max-w-7xl mx-auto border-t border-slate-100">
        <div class="mb-12 text-center md:text-left">
          <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Engineering Design Principles
          </h2>
          <p class="mt-4 text-lg text-slate-600 max-w-2xl">
            Effective tooling design hinges on the{" "}
            <span class="font-semibold text-blue-800">3-2-1 Principle</span> to
            constrain all six degrees of freedom.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* <!-- Locating --> */}
          <div class="p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg
                class="w-6 h-6 text-blue-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 20l-5.447-2.724A2 2 0 013 15.487V6.512a2 2 0 011.553-1.956L9 2m0 18v-8m0 8l5.447-2.724a2 2 0 001.553-1.956V6.512a2 2 0 00-1.553-1.956L9 2m0 0v8m0 0l5.447-2.724a2 2 0 001.553-1.956V6.512a2 2 0 00-1.553-1.956L14.5 2"
                ></path>
              </svg>
            </div>
            <h4 class="text-lg font-bold text-slate-900 mb-3">
              Precise Location
            </h4>
            <p class="text-sm text-slate-600 leading-relaxed">
              Locating points must be fixed and fool-proof to prevent incorrect
              workpiece insertion. Use the 3-2-1 method to arrest movement along
              the X, Y, and Z axes.
            </p>
          </div>

          {/* <!-- Clamping --> */}
          <div class="p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg
                class="w-6 h-6 text-blue-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                ></path>
              </svg>
            </div>
            <h4 class="text-lg font-bold text-slate-900 mb-3">
              Secure Clamping
            </h4>
            <p class="text-sm text-slate-600 leading-relaxed">
              Clamping forces must be directed toward the locators and be strong
              enough to resist cutting forces without deforming the workpiece.
            </p>
          </div>

          {/* <!-- Clearance --> */}
          <div class="p-8 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <svg
                class="w-6 h-6 text-blue-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                ></path>
              </svg>
            </div>
            <h4 class="text-lg font-bold text-slate-900 mb-3">
              Chip Clearance
            </h4>
            <p class="text-sm text-slate-600 leading-relaxed">
              Design must allow for "swarf" (chips) to be easily cleared.
              Include burr grooves and ample space to ensure chips don't
              interfere with the location.
            </p>
          </div>
        </div>

        {/* <!-- Quick Comparison Table --> */}
        <div class="mt-16 overflow-hidden border border-slate-200 rounded-xl shadow-sm">
          <table class="min-w-full divide-y divide-slate-200">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold  text-bold uppercase tracking-wider">
                  Feature
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-bold uppercase tracking-wider">
                  Jigs
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-bold uppercase tracking-wider">
                  Fixtures
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-slate-200 text-sm">
              <tr>
                <td class="px-6 py-4 font-medium text-slate-900">
                  Tool Guidance
                </td>
                <td class="px-6 py-4 text-slate-600">
                  Guides the tool via bushings
                </td>
                <td class="px-6 py-4 text-slate-600">
                  Does not guide the tool
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 font-medium text-slate-900">
                  Weight & Build
                </td>
                <td class="px-6 py-4 text-slate-600">
                  Lighter, often portable
                </td>
                <td class="px-6 py-4 text-slate-600">
                  Heavy, rigid, and bolted
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 font-medium text-slate-900">Operations</td>
                <td class="px-6 py-4 text-slate-600">
                  Drilling, Reaming, Tapping
                </td>
                <td class="px-6 py-4 text-slate-600">
                  Milling, Turning, Grinding
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="py-8 bg-white px-6 lg:px-20 max-w-7xl mx-auto">
        <div class=" ">
          <div class="lg:col-span-2">
            <h3 class="text-2xl font-bold text-slate-900 mb-6">
              Industrial Material Standards
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-5 border border-slate-200 rounded-xl bg-slate-50">
                <h4 class="font-bold text-blue-800 text-xl mb-2">
                  Hardened Tool Steel
                </h4>
                <p class="text-xs text-slate-600">
                  Used for drill bushings and locators. High wear resistance to
                  maintain accuracy over thousands of cycles.
                </p>
              </div>
              <div class="p-5 border border-slate-200 rounded-xl bg-slate-50">
                <h4 class="font-bold text-blue-800 text-xl mb-2">
                  Mild Steel / Cast Iron
                </h4>
                <p class="text-xs text-slate-900">
                  Standard for large fixture bodies. Provides excellent
                  vibration damping and cost-effective rigidity.
                </p>
              </div>
              <div class="p-5 border border-slate-200 rounded-xl bg-slate-50">
                <h4 class="font-bold text-blue-800 text-xl mb-2">
                  Nylon / Acetal
                </h4>
                <p class="text-xs text-slate-900">
                  Ideal for soft-jaw clamps and assembly jigs where surface
                  finish protection of the workpiece is critical.
                </p>
              </div>
              <div class="p-5 border border-slate-200 rounded-xl bg-slate-50">
                <h4 class="font-bold text-blue-800 text-xl mb-2">
                  3D Printed Composites
                </h4>
                <p class="text-xs text-slate-900">
                  The 2026 standard for rapid prototyping of complex geometries
                  and lightweight inspection fixtures.
                </p>
              </div>
            </div>

            <div class="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <h4 class="text-blue-900 font-bold mb-2 flex items-center">
                <svg
                  class="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 010-1.414l.707-.707a1 1 0 111.414 1.414l-.707.707a1 1 0 01-1.414 0zM6.464 18.95a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414z"></path>
                </svg>
                Final Design Checklist
              </h4>
              <ul class="text-sm text-blue-800 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <li>
                  ✓ <strong>Fool-Proofing:</strong> Is it impossible to load the
                  part backward?
                </li>
                <li>
                  ✓ <strong>Clearance:</strong> Is there room for chips (swarf)
                  to escape?
                </li>
                <li>
                  ✓ <strong>Safety:</strong> Are all sharp corners rounded and
                  handles accessible?
                </li>
                <li>
                  ✓ <strong>Economy:</strong> Does the time saved justify the
                  cost of the tool?
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Fixture;
