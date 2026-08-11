import React, { useEffect } from "react";
import {
  FaTools,
  FaCheckCircle,
  FaRocket,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { revealStagger, reveal } from "../../animation/ScrollAnimation";
import CountUp from "react-countup";

const AboutOtherDetails = () => {
  useEffect(() => {
    revealStagger(".reveal");
    revealStagger(".stagger-card");
  }, []);

  return (
    <>
      <div className="bg-white">
        {/* 1. MAIN HERO SECTION */}
        <section className="py-24 relative bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex flex-row justify-center items-center mb-16">
              <h2 className="reveal capitalize text-center text-5xl flex flex-wrap gap-4 justify-center items-center font-extrabold text-gray-800">
                About{" "}
                <span className="reveal capitalize text-blue-800 flex items-center gap-3">
                  HGP TOOLS <FaTools className="text-blue-800" />
                </span>
              </h2>
            </div>

            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 grid-cols-1 gap-16 items-center">
              {/* Image Staggered Grid */}
              <div className="reveal relative grid sm:grid-cols-2 grid-cols-1 gap-6 lg:order-first order-last">
                <div className="relative">
                  <img
                    className="rounded-2xl shadow-2xl object-cover h-full w-full border-4 border-white"
                    src="https://pagedone.io/asset/uploads/1717741205.png"
                    alt="HGP Workshop"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-blue-800 p-6 rounded-xl hidden sm:block shadow-xl">
                    <p className="text-white font-bold text-xl text-center">
                      Quality <br /> First
                    </p>
                  </div>
                </div>
                <div className="pt-22 w-[90%] h-[60%] ">
                  <img
                    className="rounded-2xl shadow-2xl object-cover  w-full border-4 border-white"
                    src="https://www.sdiahmedabad.in/Panel//Document/photo-gallery//L_321d1421-6aa3-4759-a58a-28b50d6b20f0.jpeg"
                    alt="Precision Tools"
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="flex flex-col lg:items-start items-center gap-8">
                <div className="space-y-6">
                  <h3 className="reveal text-gray-900 text-4xl lg:text-5xl font-bold font-manrope leading-tight lg:text-start text-center">
                    Precision Engineering. <br />
                    <span className="text-blue-800">Built to Last.</span>
                  </h3>
                  <p className="reveal text-gray-600 text-lg leading-relaxed lg:text-start text-center">
                    At HGP TOOLS, we believe that the right tools don't just
                    complete a task—they empower craftsmen to achieve
                    perfection. Based in the heart of Haryana's industrial hub,
                    we have spent over three decades perfecting the art of tool
                    manufacturing.
                  </p>
                  <p className="reveal text-gray-500 text-base leading-relaxed lg:text-start text-center">
                    Our journey started with a small workshop and a big vision.
                    Today, we are proud to serve global industries with
                    equipment that stands the test of time and rigorous
                    industrial use.
                  </p>
                </div>

                {/* Stats Bar */}
                <div className="w-full grid grid-cols-3 gap-4 border-y border-gray-200 py-8">
                  <div className="text-center lg:text-start">
                    <h3 className="reveal text-gray-900 text-4xl font-bold font-manrope leading-normal">
                      <CountUp
                        end={27}
                        duration={
                          5
                        } /* Increased duration (in seconds) makes it slower */
                        enableScrollSpy={true}
                        scrollSpyOnce={
                          false
                        } /* Setting this to false makes it restart every time */
                      />
                      <span>+</span>
                    </h3>
                    <h6 class="reveal text-gray-500 text-base font-normal leading-relaxed">
                      Years of Experience
                    </h6>
                  </div>

                  <div class="flex-col justify-start items-start inline-flex">
                    <h4 class="reveal text-gray-900 text-4xl font-bold font-manrope leading-normal">
                      <CountUp
                        end={52}
                        duration={
                          10
                        } /* Increased duration (in seconds) makes it slower */
                        enableScrollSpy={true}
                        scrollSpyOnce={
                          false
                        } /* Setting this to false makes it restart every time */
                      />
                      <span>+</span>
                    </h4>
                    <p className="reveal text-gray-500 text-sm font-medium uppercase tracking-wider">
                      Clients
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. CORE VALUES SECTION (The "Bigger" addition) */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="reveal text-4xl font-bold text-gray-900 mb-4">
                Why Industry Leaders Choose HGP
              </h2>
              <div className="w-24 h-1.5 bg-blue-800 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-10 reveal">
              <div className="p-8 rounded-3xl bg-gray-50 hover:bg-indigo-50 transition-colors group">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-800 group-hover:text-white transition-all">
                  <FaShieldAlt size={28} />
                </div>
                <h4 className="text-xl font-bold mb-3reveal ">
                  Unmatched Durability
                </h4>
                <p className="text-gray-600 reveal leading-relaxed">
                  Our tools are forged with premium-grade alloys and tested
                  under extreme stress conditions to ensure they never fail on
                  the job.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-gray-50 hover:bg-indigo-50 transition-colors group">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-800 group-hover:text-white transition-all">
                  <FaRocket size={28} />
                </div>
                <h4 className="text-xl font-bold mb-3reveal ">
                  Innovation Driven
                </h4>
                <p className="text-gray-600 leading-relaxed reveal ">
                  We invest 15% of our annual revenue into R&D to bring
                  ergonomics and smart technology to traditional hand tools.
                </p>
              </div>

              <div className="p-8 rounded-3xl bg-gray-50 hover:bg-indigo-50 transition-colors group">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-800 group-hover:text-white transition-all">
                  <FaUsers size={28} />
                </div>
                <h4 className="text-xl font-bold mb-3 reveal">
                  Customer Centric
                </h4>
                <p className="text-gray-600 leading-relaxed reveal ">
                  Beyond selling tools, we provide end-to-end support, training,
                  and maintenance services to our industrial partners.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. QUALITY ASSURANCE SECTION (Final "Bigger" page) */}
        <section className="py-24 bg-gray-100 ">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex flex-wrap items-center reveal">
              <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
                <h2 className="text-4xl font-bold mb-8 reveal">
                  Our Quality Promise
                </h2>
                <ul className="space-y-6 reveal">
                  {[
                    "ISO 9001:2015 Certified Manufacturing Process",
                    "100% Manual Inspection of Precision Components",
                    "Eco-Friendly Sustainable Production Facility",
                    "Lifetime Replacement Warranty on Professional Range",
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-4 text-lg ">
                      <FaCheckCircle className="text-blue-800 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full lg:w-1/2">
                <div className="bg-gray-100 p-10 rounded-3xl border-2 border-indigo-800">
                  <h3 className="text-2xl font-bold mb-4 reveal">
                    Want a Custom Solution?
                  </h3>
                  <p className="reveal mb-8">
                    If your industry requires specialized tooling, our engineers
                    are ready to design a custom prototype for you.
                  </p>
                  <div className="flex gap-4">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 bg-gray-100 border-blue-800 rounded-lg px-4 border"
                    />
                    <button className="bg-blue-800 px-6 py-3 text-white rounded-lg font-bold hover:bg-blue-800 transition-colors">
                      <Link to="/quote">Request Quote </Link>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AboutOtherDetails;
