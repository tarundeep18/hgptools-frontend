import React, { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { reveal, revealStagger } from "./animation/ScrollAnimation";

// Always-loaded components (DO NOT lazy)
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import TriggerButton from "./EnquiryForm/TriggerButton";
import PageLoader from "./PageLoader/PageLoader";
import TermsAndConditions from "./Components/Privacy&Policy/Term&Use";
import ScrollToTop from "./Pages/ScrollToTop/ScrollToTop";
import Catelog from "./Catelog/Catelog";
import CatalogGallery from "./Catelog/MainCatelog";
import Login from "./Auth/Login";
import ForgotPassword from "./Auth/ForgotPassword";
import ResetPassword from "./Auth/ResetPassword";
import { Toaster } from "react-hot-toast";
import Dashboard from "./adminDashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute/ProtectedRoute";
import DashboardLayout from "./adminDashboard/DashboardLayout";
import User from "./DashboardRoutes/Admin/Users/User";
import BlogData from "./DashboardRoutes/Admin/BlogsDetails/BlogData";
import QuoteData from "./DashboardRoutes/Admin/QuoteDetails/QuoteData";
import ContactData from "./DashboardRoutes/Admin/ContactDetails/ContactData";
import Setting from "./DashboardRoutes/Setting/Setting";
import PublicLayout from "./ProtectedRoute/PublicRoutes";
import Leads from "./DashboardRoutes/Admin/Leads/Leads";
import Drawing from "./DashboardRoutes/Drawing/Drawing";
import ManageCareer from "./DashboardRoutes/Admin/Career/ManageCareer";
import AdminProducts from "./DashboardRoutes/Products/AdminProducts";
import ProductionPlanning from "./DashboardRoutes/Admin/Inventory/ProductionPlanning";
import Employees from "./DashboardRoutes/Employees/Employees";
import Attendence from "./DashboardRoutes/Attendence/Attendence";
import AccessDenied from "./ProtectedRoute/AccessDenied";
import ClientDashboard from "./adminDashboard/ClientDashboard/ClientDashboard";
import OrderTracking from "./Client/PoManagement/OrderTracking";
import ClientDrawing from "./Client/Drawing/ClientDrawing";
import RequestRFQ from "./Client/RFQ/RequestRFQ";
import ProfileSettings from "./Client/Settings/ProfileSettings";
import SupportTicket from "./Client/SupportTicket/SupportTicket";
import PurchaseOrder from "./Client/PoManagement/PurchaseOrder";
import QualityReports from "./Client/Qc/QualityReports";
import PendingPOList from "./Client/GeneratePendingList/PendingPo";
import UpateDispatch from "./Client/Dispatch/UpateDispatch";
import Rejection from "./Client/Rejection/Rejection";
import OrderHistory from "./Client/GeneratePendingList/OrderHistory";
import Inventory from "./Client/Rejection/Inventory";
import RejectedInventory from "./Client/Rejection/RejectedInventory";
import OldData from "./Client/PoManagement/OldData";
import AllPo from "./Client/PoManagement/AllPo";
import QC from "./Client/Qc/QC";
import QcDashboard from "./adminDashboard/QCDashboard/QcDashboard";
import SocketTest from "./Socket.io/SocketTest";
import { CAPAHistoryModal } from "./Client/Qc/SPCControllChart";
import CAPAHistoryPage from "./Client/Qc/CapaHistoryTable";
import CAPAHistoryTable from "./Client/Qc/CapaHistoryTable";
import GeneratePdiReport from "./Client/Qc/GeneratePdiReport";
import QCGuide from "./Client/Qc/QCGuide";
import GeneratePendingList from "./Client/GeneratePendingList/GeneratePendingList";

/* =========================
   Lazy-loaded Route Pages
========================= */

// Main pages
const Home = lazy(() => import("./Pages/Home"));
const AboutOtherDetails = lazy(
  () => import("./Components/AboutUs/AboutOtherDetails"),
);
const OtherContact = lazy(() => import("./Components/ContactUs/OtherContact"));

// Company
const Certifications = lazy(
  () => import("./Components/Company/Certifications"),
);
const SocialResponsibility = lazy(
  () => import("./Components/Company/SocialResponsibility"),
);

// Capabilities
const ManufacturingCapabilities = lazy(
  () => import("./Components/Capabilities/Capabilities"),
);
const RapidPrototypingDetailed = lazy(
  () => import("./Components/Capabilities/SubCapabilities/RapidPrototyping"),
);
const SheetMetalDetailed = lazy(
  () => import("./Components/Capabilities/SubCapabilities/SheetMetalParts"),
);
const HardwareSupport = lazy(
  () => import("./Components/Capabilities/SubCapabilities/HardwareSupport"),
);
const CustumTools = lazy(
  () => import("./Components/Capabilities/SubCapabilities/CustumTools"),
);
const AdvanceCNC = lazy(
  () => import("./Components/Capabilities/SubCapabilities/AdvanceCNC"),
);

// Application Industries
const Aerospace = lazy(
  () => import("./Components/ApplicationIndustries/SubParts/Aerospace"),
);
const Railway = lazy(
  () => import("./Components/ApplicationIndustries/SubParts/Railway"),
);
const Medicalindustries = lazy(
  () => import("./Components/ApplicationIndustries/SubParts/Medicalindustries"),
);
const ElectronicInd = lazy(
  () => import("./Components/ApplicationIndustries/SubParts/ElectronicInd"),
);

// Automotive
const Automotive = lazy(
  () => import("./Components/Automotive/Automotive/Automotive"),
);
const Flangs = lazy(() => import("./Components/Automotive/Flangs"));
const Bolts = lazy(() => import("./Components/Automotive/Bolts"));
const Shafts = lazy(() => import("./Components/Automotive/Shafts"));
const MachineRing = lazy(() => import("./Components/Automotive/MachineRing"));

// Tools
const Tools = lazy(() => import("./Components/Tools/Tools"));
const PressTools = lazy(
  () => import("./Components/Tools/ToolsSubPart/PressTools"),
);
const Fixture = lazy(() => import("./Components/Tools/ToolsSubPart/Fixture"));

// CNC
const CncMilling = lazy(() => import("./Components/CncSubPart/CncMilling"));
const CNCLatheDetail = lazy(
  () => import("./Components/CncSubPart/LatheServices"),
);
const EDMServices = lazy(() => import("./Components/CncSubPart/EDMServices"));
const CNCBendingDetail = lazy(
  () => import("./Components/CncSubPart/CncBendingDetails"),
);
const TermAndConditions = lazy(
  () => import("./Components/Privacy&Policy/Term&Use"),
);
const PolicyPages = lazy(
  () => import("./Components/Privacy&Policy/Privacy&Policy"),
);
const ReturnPolicy = lazy(
  () => import("./Components/Privacy&Policy/ReturnPolicies"),
);
const CookiePolicy = lazy(
  () => import("./Components/Privacy&Policy/CookiePolicy"),
);

// Media / Blogs / Ecommerce
const Media = lazy(() => import("./Components/Media/Media"));
const Blogs = lazy(() => import("./Components/Blogs/Blogs"));
const BlogDetails = lazy(() => import("./Components/Blogs/BlogsDetails"));
const MarketPlace = lazy(() => import("./MarketPlace/MarketPlace"));

//products
const Career = lazy(() => import("./Components/Career/Career"));
const ProductSection = lazy(
  () => import("./Components/ProductSection/ProductSection"),
);

// Popup (lazy on demand)
const EnquiryPopup = lazy(() => import("./EnquiryForm/Enquiry"));
// dashboard

/* =========================
   App Component
========================= */

const App = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [hasAutoShown, setHasAutoShown] = useState(false);

  // Scroll animations
  useEffect(() => {
    reveal(".reveal");
    revealStagger(".stagger-card");
  }, []);

  // Auto popup after 5s (once per user)
  useEffect(() => {
    if (hasAutoShown) return;

    const hasSeenPopup = localStorage.getItem("discountPopupSeen");

    const timer = setTimeout(() => {
      if (!hasSeenPopup) {
        setShowPopup(true);
        setHasAutoShown(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasAutoShown]);

  const handleTriggerClick = () => setShowPopup(true);

  const handleClosePopup = () => {
    localStorage.setItem("discountPopupSeen", "true");
    setShowPopup(false);
  };

  return (
    <>
      {/* Always visible */}
      <Toaster position="top-right" reverseOrder={false} />

      <main className="min-h-screen">
        {/* ONE Suspense for ALL routes */}
        <Suspense fallback={<PageLoader />}>
          <ScrollToTop />
          <Routes>
            {/* Main pages */}
            {/* PUBLIC ROUTES */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />

              <Route path="/about-us" element={<AboutOtherDetails />} />
              <Route path="/contact-us" element={<OtherContact />} />

              {/* Company */}
              <Route path="/certifications" element={<Certifications />} />
              <Route
                path="/social-responsibility"
                element={<SocialResponsibility />}
              />

              {/* Capabilities */}
              <Route
                path="/capabilities"
                element={<ManufacturingCapabilities />}
              />

              <Route
                path="/capabilities/rapid-prototyping"
                element={<RapidPrototypingDetailed />}
              />
              <Route
                path="/capabilities/sheet-metal"
                element={<SheetMetalDetailed />}
              />
              <Route
                path="/capabilities/hardware-support"
                element={<HardwareSupport />}
              />
              <Route
                path="/capabilities/custom-tools"
                element={<CustumTools />}
              />
              <Route
                path="/capabilities/advance-cnc"
                element={<AdvanceCNC />}
              />

              {/* Industries */}
              <Route
                path="/application-industries/aerospace"
                element={<Aerospace />}
              />
              <Route
                path="/application-industries/railway"
                element={<Railway />}
              />
              <Route
                path="/application-industries/medical"
                element={<Medicalindustries />}
              />
              <Route
                path="/application-industries/electronics"
                element={<ElectronicInd />}
              />

              {/* CNC */}
              <Route
                path="/capabilities/advance-cnc/cnc-miling"
                element={<CncMilling />}
              />
              <Route
                path="/capabilities/advance-cnc/turning"
                element={<CNCLatheDetail />}
              />
              <Route
                path="/capabilities/advance-cnc/edm-services"
                element={<EDMServices />}
              />
              <Route
                path="/capabilities/advance-cnc/bending"
                element={<CNCBendingDetail />}
              />

              {/* Automotive */}
              <Route path="/automotive" element={<Automotive />} />

              {/* Tools */}
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/flangs" element={<Flangs />} />
              <Route path="/tools/bolts" element={<Bolts />} />
              <Route path="/tools/shafts" element={<Shafts />} />
              <Route path="/tools/machined-ring" element={<MachineRing />} />
              <Route path="/tools/press-tools" element={<PressTools />} />
              <Route path="/tools/fixture" element={<Fixture />} />

              {/* Media & Blogs */}
              <Route path="/media-gallery" element={<Media />} />
              <Route path="/marketplace" element={<MarketPlace />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/blogs/:id" element={<BlogDetails />} />

              {/* Privacy & PolicyPages */}
              <Route
                path="/terms-and-conditions"
                element={<TermAndConditions />}
              />
              <Route path="/privacy-and-policy" element={<PolicyPages />} />
              <Route path="/return-policy" element={<ReturnPolicy />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />

              {/* Catelog */}
              <Route path="/catelog/:id" element={<Catelog />} />
              <Route path="/main-catelog" element={<CatalogGallery />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/*-----------------------Career----------------*/}
              <Route path="/career" element={<Career />} />

              {/* quote */}
              <Route path="/quote" element={<EnquiryPopup />} />

              {/* products section*/}
              <Route path="/products" element={<ProductSection />} />
            </Route>

            {/* Protected routes for the admin */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["client", "admin"]}>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-tracking"
                element={
                  <ProtectedRoute allowedRoles={["admin", "client"]}>
                    <OrderTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <User />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/blog-details"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <BlogData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quote-details"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <QuoteData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contact-details"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ContactData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <RejectedInventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Leads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/drawing-details"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Drawing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-careers"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ManageCareer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Setting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/production-planning"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ProductionPlanning />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rejection-items"
                element={
                  <ProtectedRoute allowedRoles={["admin", "client", "qc"]}>
                    <Rejection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Employees />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-drawings"
                element={
                  <ProtectedRoute allowedRoles={["client", "admin", "qc"]}>
                    <ClientDrawing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/request-rfq"
                element={
                  <ProtectedRoute allowedRoles={["client", "admin"]}>
                    <RequestRFQ />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/catelog"
                element={
                  <ProtectedRoute allowedRoles={["client"]}>
                    <Catelog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/settings"
                element={
                  <ProtectedRoute allowedRoles={["client"]}>
                    <ProfileSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support-ticket"
                element={
                  <ProtectedRoute allowedRoles={["client", "admin"]}>
                    <SupportTicket />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/purchase-order"
                element={
                  <ProtectedRoute allowedRoles={["client"]}>
                    <PurchaseOrder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pending-purchase-orders"
                element={
                  <ProtectedRoute allowedRoles={["admin", "client"]}>
                    <PendingPOList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/update-dispatch"
                element={
                  <ProtectedRoute allowedRoles={["admin", "client"]}>
                    <UpateDispatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qc-reports"
                element={
                  <ProtectedRoute allowedRoles={["client", "admin", "qc"]}>
                    <QualityReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-history"
                element={
                  <ProtectedRoute allowedRoles={["client", "admin"]}>
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />
         
              <Route
                path="/all/purchase/orders"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AllPo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/import-old-data"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <OldData />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qc-inspection"
                element={
                  <ProtectedRoute allowedRoles={["admin", "qc"]}>
                    <QC />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qc-dashboard"
                element={
                  <ProtectedRoute allowedRoles={["qc"]}>
                    <QcDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/qa/history"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CAPAHistoryTable />
                  </ProtectedRoute>
                }
              />
              []
              <Route
                path="/generate/pdi-reports"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <GeneratePdiReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test-socket-client-connection"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SocketTest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Qc-guide"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <QCGuide />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/generate/pendinglist"
                element={
                  <ProtectedRoute allowedRoles={["admin","client"]}>
                    <GeneratePendingList />
                  </ProtectedRoute>
                }
              />
              <Route path="/access-denied" element={<AccessDenied />} />
            </Route>
          </Routes>
        </Suspense>
      </main>

      {/* Always visible */}

      <TriggerButton onClick={handleTriggerClick} />

      {/* Lazy popup */}
      <AnimatePresence>
        {showPopup && (
          <Suspense fallback={null}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <EnquiryPopup onClose={handleClosePopup} />
            </motion.div>
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
