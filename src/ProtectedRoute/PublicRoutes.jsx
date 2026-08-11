import Navbar from "../Components/Navbar/Navbar";
import Footer from "../Components/Footer/Footer";

import React from "react";
import { Outlet } from "react-router-dom";

const PublicLayout = ({ children }) => (
  <>
    <Navbar />
    <Outlet />
    <Footer />
  </>
);

export default PublicLayout;
