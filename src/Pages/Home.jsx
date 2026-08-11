import React from "react";
import { Helmet } from "react-helmet-async";

import Banner from "../Components/Main/Banner";
import About from "../Components/AboutUs/About";
import Contact from "../Components/ContactUs/Contact";
import Capabilities from "../Components/Capabilities/HomeCapabilities/Capabilities";
import ProductSection from "../Components/ProductSection/ProductSection";
import ToggleMsg from "./ScrollToTop/ToggleMsg";
import BrandsMarquee from "../Components/BrandsMarquee/BrandsMarquee";
import Blogs from "../Components/Blogs/Blogs";

const Home = () => {
  return (
    <>
      <Helmet>
        {/* Primary SEO Title */}
        <title>
          Precision Sheet Metal Components Manufacturer India | CNC Machining &
          Contract Manufacturing | HGP Tools
        </title>


        {/* Meta Description */}
        <meta
          name="description"
          content="HGP Tools is a leading precision sheet metal components manufacturer in India specializing in CNC machining, contract manufacturing, railway components, automotive sheet metal parts, electrical bus bars, brass terminals, medical implant components, aerospace precision parts, VMC machining and CNC turning services."
        />

        {/* Keywords */}
        <meta
          name="keywords"
          content="
          Precision sheet metal components manufacturer India,
          Contract manufacturing company India,
          CNC machining parts manufacturer,
          Sheet metal fabrication company Faridabad,
          Precision machined components manufacturer,
          Industrial component manufacturer India,
          Custom sheet metal parts supplier,
          Railway component manufacturer India,
          Automotive sheet metal parts manufacturer,
          Electrical bus bar manufacturer,
          Brass terminal manufacturer India,
          Medical implant component manufacturer,
          Aerospace precision parts manufacturer,
          VMC machining services India,
          CNC turning services Faridabad
          "
        />
        {/* Open Graph */}
        <meta
          property="og:title"
          content="HGP Tools | Precision Sheet Metal & CNC Machining Manufacturer India"
        />
        <meta
          property="og:description"
          content="Trusted industrial manufacturer for sheet metal fabrication, CNC machining, contract manufacturing, railway, automotive, electrical, medical and aerospace components."
        />
        <meta property="og:url" content="https://www.hgptools.com/" />
        <meta property="og:type" content="website" />

        {/* Local SEO */}
        <meta name="geo.region" content="IN-HR" />
        <meta name="geo.placename" content="Faridabad, Haryana, India" />
      </Helmet>

      {/* Main Homepage Sections */}
      <Banner />
      <About />
      <Capabilities />
      <ProductSection />
      <Blogs />
      <BrandsMarquee />
      <Contact />

      {/* Toggle Button */}
      <ToggleMsg />
    </>
  );
};

export default Home;
