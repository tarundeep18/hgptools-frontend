import React from "react";
import Marquee from "react-fast-marquee";
import bharatcompositeLogo from "../../assets/bharat-logo.jpg";
import riverlogo from "../../assets/river_engineering_pvt_ltd_logo.jpeg";
import sahasralogo from "../../assets/sashra.jpeg";
import grozlogo from "../../assets/grozlogo.png";
import infopower from "../../assets/infopower.jpeg";
import escortlogo from "../../assets/escort.jpg";
import actialogo from "../../assets/actia_logo.jpeg";
import stesalitlogo from "../../assets/steasalit.jpeg";

const BrandsMarquee = () => {
  const brands = [
    {
      name: "River Engineering",
      logo: riverlogo,
    },
    {
      name: "Autometers Alliance Limited",
      logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRInipSFh3FwHmmxQsdFp7jqc2uMQFJyfK4kA&s",
    },
    {
      name: "Sahasra electronics pvt. ltd",
      logo: sahasralogo,
    },
    {
      name: "Groz Engineering Tools Private Limited",
      logo: grozlogo,
    },
    {
      name: "Escorts Kubota Limited (EKL",
      logo: escortlogo,
    },
    {
      name: "Accurate Products Corporation Private Limited",
      logo: "https://tiimg.tistatic.com/co_logo/10828073/accurate-products-corporation-pvt-ltd--v1.jpg",
    },
    {
      name: "Mahindra",
      logo: "https://1000logos.net/wp-content/uploads/2020/04/Mahindra-Logo-2012.png",
    },
    {
      name: "Actia Group",
      logo: actialogo,
    },
    {
      name: "StesaLIT Limited",
      logo: stesalitlogo,
    },

    {
      name: "Bharat Composites",
      logo: bharatcompositeLogo,
    },
    {
      name: "Infopower Technologies Pvt. Ltd.",
      logo: infopower,
    },
  ];

  // Duplicate brands for seamless infinite scroll
  const duplicatedBrands = [...brands, ...brands];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full mb-6">
            <span className="text-sm font-semibold text-blue-700">
              Trusted Partners
            </span>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Trusted by Leading
            <span className=" bg-clip-text text-blue-800"> Global Brands</span>
          </h2>

          {/* Description */}
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're proud to collaborate with innovative companies, delivering
            excellence across industries.
          </p>
        </div>

        {/* Marquee Container */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>

          {/* Main Marquee */}
          <Marquee
            speed={80}
            pauseOnHover={true}
            gradient={false}
            className="py-4"
          >
            {duplicatedBrands.map((brand, index) => (
              <div key={`${brand.name}-${index}`} className="group mx-6">
                <div
                  className="flex items-center justify-center 
                  bg-white rounded-2xl 
                  w-48 h-28 p-6
                  border border-gray-100
                  transition-all duration-500 
                  hover:shadow-2xl hover:shadow-blue-100/50
                  hover:border-blue-200 hover:scale-105
                  cursor-pointer"
                >
                  <img
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    className="max-h-14 w-auto object-contain  scale-x-125
                    
                  group-hover:opacity-100
                    transition-all duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/150x60?text=Brand+Logo";
                    }}
                  />
                </div>

                {/* Brand name tooltip on hover */}
                <div className="text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-xs font-medium text-gray-500">
                    {brand.name}
                  </span>
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  );
};

export default BrandsMarquee;
