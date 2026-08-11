import React, { useEffect } from "react";
import { reveal } from "../../animation/ScrollAnimation";
import img from "../../assets/fotor_2026-03-12_18-33-56.png";
import aboutimg from "../../assets/CNC-Lathe-Machining-Processes.jpg";
import SEO from "../../Pages/Seo/Seo";

const About = () => {
  useEffect(() => {
    reveal(".reveal");
  }, []);

  return (
    <>
    {/* <SEO
  title="About HGP Tools | Precision Sheet Metal Components, CNC Machining & Contract Manufacturing Company India"
  description="HGP Tools is a leading precision sheet metal components manufacturer and contract manufacturing company in India specializing in CNC machining, VMC milling, sheet metal fabrication, railway, automotive, electrical, medical, and aerospace industrial components since 1997."
  keywords="About HGP Tools, Precision sheet metal components manufacturer India, Contract manufacturing company India, CNC machining company Faridabad, Sheet metal fabrication company Faridabad, Industrial component manufacturer India, Precision engineering company India, Custom sheet metal parts supplier, VMC machining services India"
  url="https://www.hgptools.com/about-us"
  image="https://www.hgptools.com/images/about-hgp-tools-banner.jpg"
  schema={{
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.hgptools.com/#organization",
    name: "HGP Tools",
    legalName: "HGP Tools",
    url: "https://www.hgptools.com/",
    logo: "https://www.hgptools.com/logo.png",
    image: "https://www.hgptools.com/images/about-hgp-tools-banner.jpg",
    foundingDate: "1997",
    description:
      "HGP Tools is a trusted precision sheet metal fabrication, CNC machining, VMC milling, and contract manufacturing company serving railway, automotive, electrical, medical, and aerospace industries across India.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "22A, Whirlpool Road, Industrial Area",
      addressLocality: "Faridabad",
      addressRegion: "Haryana",
      postalCode: "121001",
      addressCountry: "IN"
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-8375076646",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"]
    },
    areaServed: {
      "@type": "Country",
      name: "India"
    },
    sameAs: [
      "https://www.linkedin.com/company/hgptools",
      "https://www.facebook.com/hgptools"
    ]
  }}
/> */}

      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Title */}
          <h2 className="text-center text-4xl md:text-5xl font-bold text-gray-800 mb-12 reveal">
            About <span className="text-blue-800 font-bold">HGP Tools</span>
            <div className="h-1.5 w-24 bg-blue-800 mx-auto mt-6 rounded-full"></div>
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 ">
            {/* LEFT TEXT */}
            <div className="reveal">
              <h3 className="text-5xl font-bold text-gray-900 mb-6 leading-snug reveal">
                Precision Manufacturing <br />
                for Industrial Applications
              </h3>

              <p className="text-gray-600 mb-4 leading-relaxed reveal">
                HGP Tools is a precision manufacturing company based in Haryana,
                India, specializing in CNC machining, sheet metal fabrication,
                and custom tooling solutions. We support OEMs, engineering
                firms, and industrial manufacturers with high-quality components
                built for reliability, accuracy, and long-term performance.
              </p>

              <p className="text-gray-600 mb-4 leading-relaxed reveal">
                With decades of hands-on manufacturing experience, our facility
                combines modern machining equipment with traditional tooling
                expertise to deliver dependable results across a wide range of
                industrial applications.
              </p>

              <p className="text-gray-600 leading-relaxed reveal">
                Our focus is simple: manufacture precision components that meet
                strict quality requirements and perform reliably in real
                industrial environments.
              </p>
            </div>

            {/* RIGHT IMAGE GRID */}
            <div className="reveal">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <img
                  src={aboutimg}
                  alt="CNC machining process"
                  className="rounded-xl shadow-lg object-cover h-56 w-full"
                />

                <img
                  src={img}
                  alt="Precision machined component"
                  className="rounded-xl shadow-lg object-cover h-56 w-full"
                />
              </div>

              <img
                src="https://images.pexels.com/photos/3862379/pexels-photo-3862379.jpeg"
                alt="Engineering CAD design"
                className="rounded-xl shadow-lg object-cover h-64 w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
