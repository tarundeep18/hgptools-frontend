import React from "react";
import Logo from "../../assets/logo34-removebg-preview.png";
import { Link } from "react-router-dom";
import MakeinIndia from "../../assets/make-in-india.png";
import StartupImg from "../../assets/startup-india-9af443199a32d5a937d66a2a8f63d6c0-1.png";
import { FaFacebook, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <>
      <footer className="relative z-10 pb-8 pt-10 dark:bg-dark lg:pb-10 lg:pt-[80px]">
        <div className="container mx-auto ">
          <div className="mx-4 flex flex-wrap ">
            <div className="w-full px-4 sm:w-2/3 lg:w-3/12">
              <div className="mb-10 w-full">
                <Link to="/" className="mb-6 inline-block max-w-[200px]">
                  <img src={Logo} alt="logo" className="h-20 block" />
                </Link>
                <p className="mb-7 text-base text-body-color dark:text-dark-6">
                  HGP Tools integrates automated manufacturing with traditional
                  engineering craftsmanship to deliver zero-defect industrial
                  components.
                </p>
                <div>
                  {/* Phone Number Row */}
                  <p className="flex items-center text-sm font-medium text-dark">
                    <span className="mr-3 text-primary">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_941_15626)">
                          <path
                            d="M15.1875 19.4688C14.3438 19.4688 13.375 19.25 12.3125 18.8438C10.1875 18 7.84377 16.375 5.75002 14.2813C3.65627 12.1875 2.03127 9.84377 1.18752 7.68752C0.250019 5.37502 0.343769 3.46877 1.43752 2.40627C1.46877 2.37502 1.53127 2.34377 1.56252 2.31252L4.18752 0.750025C4.84377 0.375025 5.68752 0.562525 6.12502 1.18752L7.96877 3.93753C8.40627 4.59378 8.21877 5.46877 7.59377 5.90627L6.46877 6.68752C7.28127 8.00002 9.59377 11.2188 13.2813 13.5313L13.9688 12.5313C14.5 11.7813 15.3438 11.5625 16.0313 12.0313L18.7813 13.875C19.4063 14.3125 19.5938 15.1563 19.2188 15.8125L17.6563 18.4375C17.625 18.5 17.5938 18.5313 17.5625 18.5625C17 19.1563 16.1875 19.4688 15.1875 19.4688ZM2.37502 3.46878C1.78127 4.12503 1.81252 5.46877 2.50002 7.18752C3.28127 9.15627 4.78127 11.3125 6.75002 13.2813C8.68752 15.2188 10.875 16.7188 12.8125 17.5C14.5 18.1875 15.8438 18.2188 16.5313 17.625L18.0313 15.0625C18.0313 15.0313 18.0313 15.0313 18.0313 15L15.2813 13.1563C15.2813 13.1563 15.2188 13.1875 15.1563 13.2813L14.4688 14.2813C14.0313 14.9063 13.1875 15.0938 12.5625 14.6875C8.62502 12.25 6.18752 8.84377 5.31252 7.46877C4.90627 6.81252 5.06252 5.96878 5.68752 5.53128L6.81252 4.75002V4.71878L4.96877 1.96877C4.96877 1.93752 4.93752 1.93752 4.90627 1.96877L2.37502 3.46878Z"
                            fill="currentColor"
                          />
                        </g>
                      </svg>
                    </span>
                    <a href="tel:+918375076646">
                      <span>+91 8375076646</span>
                    </a>
                  </p>

                  {/* GST Number Row */}
                  <p className="flex items-center text-sm font-medium text-dark mt-2">
                    <span className="mr-3 text-primary">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <span>GSTIN:06AMKPS5527L1ZH</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Capabilities & Industries (Restructured) */}
            <LinkGroup header="Solutions">
              <li className="list-none">
                <Link
                  to="/application-industries/electronics"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Electrical & Electronics Industries
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/application-industries/railway"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Railway Industries
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/automotive"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Automotive Industries
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/capabilities"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Our Capabilities
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/capabilities/advance-cnc"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  CNC Machining
                </Link>
              </li>
            </LinkGroup>

            {/* Section 2: Company (Looks Good) */}
            <LinkGroup header="Company">
              <li className="list-none">
                <Link
                  to="/about-us"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  About HGP Tools
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/media-gallery"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Media Gallery
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/certifications"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Quality Certifications
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/social-responsibility"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Social Responsibility
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/contact-us"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Contact & Support
                </Link>
              </li>
            </LinkGroup>

            {/* Section 3: Resources & Quick Links */}
            <LinkGroup header="Resources">
              <li className="list-none">
                <Link
                  to="/blogs"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Blogs
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/marketplace"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Market Place
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/career"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Career
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/terms-and-conditions"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Terms of Use
                </Link>
              </li>
              <li className="list-none">
                <Link
                  to="/privacy-and-policy"
                  className="text-base hover:text-blue-700 transition-colors duration-300 block py-1"
                >
                  Privacy Policy
                </Link>
              </li>
            </LinkGroup>

            <div className="w-full px-4 sm:w-1/2 lg:w-3/12">
              <div className="mb-10 w-full">
                <h4 className="mb-9 text-lg font-semibold text-dark dark:text-white">
                  Follow Us On
                </h4>
                <div className="mb-6 flex items-center">
                  <a
                    href="https://facebook.com"
                    className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-dark hover:border-primary hover:bg-blue-800 hover:text-white sm:mr-4 lg:mr-3 xl:mr-4"
                  >
                    <FaFacebook />
                  </a>
                  <a
                    href="https://twitter.com"
                    className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-dark hover:border-primary hover:bg-blue-800 hover:text-white  sm:mr-4 lg:mr-3 xl:mr-4"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M12.63 0h2.454l-5.36 6.142L16 15.2h-4.937l-3.867-5.055-4.425 5.055H.316l5.733-6.57L0 .8h5.063l3.495 4.621L12.63 0zm-.86 13.728h1.36L4.323 1.399H2.865l8.905 12.329z" />
                    </svg>
                  </a>
                  <a
                    href="https://youtube.com"
                    className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-dark hover:border-primary hover:bg-blue-800 hover:text-white  sm:mr-4 lg:mr-3 xl:mr-4"
                  >
                    <svg
                      width="16"
                      height="12"
                      viewBox="0 0 16 12"
                      className="fill-current"
                    >
                      <path d="M15.6645 1.88018C15.4839 1.13364 14.9419 0.552995 14.2452 0.359447C13.0065 6.59222e-08 8 0 8 0C8 0 2.99355 6.59222e-08 1.75484 0.359447C1.05806 0.552995 0.516129 1.13364 0.335484 1.88018C0 3.23502 0 6 0 6C0 6 0 8.79263 0.335484 10.1198C0.516129 10.8664 1.05806 11.447 1.75484 11.6406C2.99355 12 8 12 8 12C8 12 13.0065 12 14.2452 11.6406C14.9419 11.447 15.4839 10.8664 15.6645 10.1198C16 8.79263 16 6 16 6C16 6 16 3.23502 15.6645 1.88018ZM6.4 8.57143V3.42857L10.5548 6L6.4 8.57143Z" />
                    </svg>
                  </a>
                  <a
                    href="https://linkedin.com"
                    className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-dark hover:border-primary hover:bg-blue-800 hover:text-white  sm:mr-4 lg:mr-3 xl:mr-4"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      className="fill-current"
                    >
                      <path d="M13.0214 0H1.02084C0.453707 0 0 0.451613 0 1.01613V12.9839C0 13.5258 0.453707 14 1.02084 14H12.976C13.5432 14 13.9969 13.5484 13.9969 12.9839V0.993548C14.0422 0.451613 13.5885 0 13.0214 0ZM4.15142 11.9H2.08705V5.23871H4.15142V11.9ZM3.10789 4.3129C2.42733 4.3129 1.90557 3.77097 1.90557 3.11613C1.90557 2.46129 2.45002 1.91935 3.10789 1.91935C3.76577 1.91935 4.31022 2.46129 4.31022 3.11613C4.31022 3.77097 3.81114 4.3129 3.10789 4.3129ZM11.9779 11.9H9.9135V8.67097C9.9135 7.90323 9.89082 6.8871 8.82461 6.8871C7.73571 6.8871 7.57691 7.74516 7.57691 8.60323V11.9H5.51254V5.23871H7.53154V6.16452H7.55423C7.84914 5.62258 8.50701 5.08065 9.52785 5.08065C11.6376 5.08065 12.0232 6.43548 12.0232 8.2871V11.9H11.9779Z" />
                    </svg>
                  </a>
                  <a
                    href="https://instagram.com"
                    className="mr-3 flex h-8 w-8 items-center justify-center rounded-full border border-stroke text-dark hover:border-primary hover:bg-blue-800 hover:text-white  sm:mr-4 lg:mr-3 xl:mr-4"
                  >
                    <FaInstagram />
                  </a>
                </div>
                <p className="text-base text-body-color ">
                  &copy; 2025 HGP TOOLS
                </p>
              </div>
              {/* make in india logo */}
              {/* <div className="w-full   ">
                <img src={StartupImg} className="" alt="startupindia" />
              </div> */}
              <div className="w-full   ">
                <img src={MakeinIndia} className="" alt="makeinindia" />
              </div>
              {/* make in india logo */}
            </div>
          </div>
        </div>
        <div>
          <span className="absolute bottom-0 left-0 z-[-1]">
            <svg
              width={217}
              height={229}
              viewBox="0 0 217 229"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M-64 140.5C-64 62.904 -1.096 1.90666e-05 76.5 1.22829e-05C154.096 5.49924e-06 217 62.904 217 140.5C217 218.096 154.096 281 76.5 281C-1.09598 281 -64 218.096 -64 140.5Z"
                fill="url(#paint0_linear_1179_5)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_1179_5"
                  x1="76.5"
                  y1={281}
                  x2="76.5"
                  y2="1.22829e-05"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3056D3" stopOpacity="0.08" />
                  <stop offset={1} stopColor="#C4C4C4" stopOpacity={0} />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="absolute right-10 top-10 z-[-1]">
            <svg
              width={75}
              height={75}
              viewBox="0 0 75 75"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M37.5 -1.63918e-06C58.2107 -2.54447e-06 75 16.7893 75 37.5C75 58.2107 58.2107 75 37.5 75C16.7893 75 -7.33885e-07 58.2107 -1.63918e-06 37.5C-2.54447e-06 16.7893 16.7893 -7.33885e-07 37.5 -1.63918e-06Z"
                fill="url(#paint0_linear_1179_4)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_1179_4"
                  x1="-1.63917e-06"
                  y1="37.5"
                  x2={75}
                  y2="37.5"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#13C296" stopOpacity="0.31" />
                  <stop offset={1} stopColor="#C4C4C4" stopOpacity={0} />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </div>
      </footer>
    </>
  );
};

export default Footer;

const LinkGroup = ({ children, header }) => {
  return (
    <>
      <div className="w-full px-4 sm:w-1/2 lg:w-2/12">
        <div className="mb-10 w-full">
          <h4 className="mb-9 text-lg font-semibold text-dark dark:text-white">
            {header}
          </h4>
          <ul className="space-y-3">{children}</ul>
        </div>
      </div>
    </>
  );
};

const NavLink = ({ link, label }) => {
  return (
    <li>
      <a
        href={link}
        className="inline-block text-base leading-loose text-body-color hover:text-indigo-600 dark:text-dark-6"
      >
        {label}
      </a>
    </li>
  );
};
