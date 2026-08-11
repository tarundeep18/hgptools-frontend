import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";

import {
  LayoutDashboard,
  Users,
  PencilLine,
  MessageSquareQuote,
  Contact,
  Warehouse,
  Settings,
  PenTool,
  ShoppingCart,
  ClipboardCheck,
  IdCardLanyard,
  CalendarRange,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  FileMinus,
  BookImage,
  Tickets,
  ShoppingBag,
  ClipboardClock,
  PackageCheck,
  History,
  Ban,
  Book,
} from "lucide-react";

import { MdPeopleAlt } from "react-icons/md";
import { FaArrowUpRightDots } from "react-icons/fa6";
import { FaListAlt } from "react-icons/fa";
import { TbReportSearch } from "react-icons/tb";

import logo from "../assets/logo34-removebg-preview.png";

const menuItems = [
  // Overview
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    path: "/dashboard",
    roles: ["admin"],
    group: "Overview",
  },
  {
    title: "Dashboard",
    icon: <LayoutDashboard size={18} />,
    path: "/qc-dashboard",
    roles: ["qc"],
    group: "Overview",
  },
  {
    title: "Dashboard",
    icon: <ChartNoAxesCombined size={18} />,
    path: "/client-dashboard",
    roles: ["client"],
    group: "Overview",
  },
  {
    title: "Client Overview",
    icon: <ChartNoAxesCombined size={18} />,
    path: "/client-dashboard",
    roles: ["admin"],
    group: "Overview",
  },

  // Procurement
  {
    title: "Purchase Order(PO)",
    icon: <ShoppingBag size={18} />,
    path: "/purchase-order",
    roles: ["client"],
    group: "Procurement",
  },
  // {
  //   title: "QR Code",
  //   icon: <ShoppingBag size={18} />,
  //   path: "/qr",
  //   roles: ["admin"],
  //   group: "Procurement",
  // },
  {
    title: "Purchase Order(PO)",
    icon: <ShoppingBag size={18} />,
    path: "/all/purchase/orders",
    roles: ["admin"],
    group: "Procurement",
  },
  {
    title: "Request RFQ",
    icon: <FileMinus size={18} />,
    path: "/request-rfq",
    roles: ["client", "admin"],
    group: "Procurement",
  },
  // {
  //   title: "Import Old data",
  //   icon: <FileMinus size={18} />,
  //   path: "/import-old-data",
  //   roles: ["admin"],
  //   group: "Procurement",
  // },
  {
    title: "Quote Details",
    icon: <MessageSquareQuote size={18} />,
    path: "/quote-details",
    roles: ["admin"],
    group: "Procurement",
  },

  // Order Management
  {
    title: "Order Tracking",
    icon: <FaListAlt size={18} />,
    path: "/order-tracking",
    roles: ["admin"],
    group: "Order Management",
  },
  {
    title: "Pending Orders",
    icon: <ClipboardClock size={18} />,
    path: "/pending-purchase-orders",
    roles: ["admin"],
    group: "Order Management",
  },

  {
    title: "Update Dispatch",
    icon: <PackageCheck size={18} />,
    path: "/update-dispatch",
    roles: ["admin"],
    group: "Order Management",
  },
  {
    title: "Rejection Items",
    icon: <Ban size={18} />,
    path: "/rejection-items",
    roles: ["admin", "client","qc"],
    group: "Order Management",
  },
  // {
  //   title: "Supervisor",
  //   icon: <Ban size={18} />,
  //   path: "/supervisor",
  //   roles: ["admin", "client"],
  //   group: "Order Management",
  // },
  // Engineering & Quality
  {
    title: "QC Reports",
    icon: <TbReportSearch size={18} />,
    path: "/qc-reports",
    roles: ["client", "admin","qc"],
    group: "Engineering & Quality",
  },
  {
    title: "QC Inspection",
    icon: <Book  size={18} />,
    path: "/qc-inspection",
    roles: ["client", "admin","qc"],
    group: "Engineering & Quality",
  },
  {
    title: "Drawings",
    icon: <PenTool size={18} />,
    path: "/client-drawings",
    roles: ["client", "admin","qc"],
    group: "Engineering & Quality",
  },

  // {
  //   title: "Drawing & Documents",
  //   icon: <PenTool size={18} />,
  //   path: "/drawing-details",
  //   roles: ["admin"],
  //   group: "Engineering & Quality",
  // },

  // Production
  {
    title: "Inventory",
    icon: <Warehouse size={18} />,
    path: "/inventory",
    roles: ["admin"],
    group: "Production",
  },
  {
    title: "Production Planning",
    icon: <ClipboardCheck size={18} />,
    path: "/production-planning",
    roles: ["admin"],
    group: "Production",
  },

  // Product Catalog
  {
    title: "Catelog",
    icon: <BookImage size={18} />,
    path: "/catelog",
    roles: ["client"],
    group: "Product Catalog",
  },
  {
    title: "Products",
    icon: <ShoppingCart size={18} />,
    path: "/admin/products",
    roles: ["admin"],
    group: "Product Catalog",
  },

  // CRM
  {
    title: "Leads Management",
    icon: <MdPeopleAlt size={18} />,
    path: "/leads",
    roles: ["admin"],
    group: "CRM",
  },
  {
    title: "Contact Details",
    icon: <Contact size={18} />,
    path: "/contact-details",
    roles: ["admin"],
    group: "CRM",
  },

  // HR
  {
    title: "Employees",
    icon: <IdCardLanyard size={18} />,
    path: "/employees",
    roles: ["admin"],
    group: "HR",
  },
  {
    title: "Career",
    icon: <FaArrowUpRightDots size={18} />,
    path: "/manage-careers",
    roles: ["admin"],
    group: "HR",
  },

  // Content Management
  {
    title: "Blogs",
    icon: <PencilLine size={18} />,
    path: "/blog-details",
    roles: ["admin"],
    group: "Content Management",
  },

  // Administration
  {
    title: "Users",
    icon: <Users size={18} />,
    path: "/users",
    roles: ["admin"],
    group: "Administration",
  },
  {
    title: "Settings",
    icon: <Settings size={18} />,
    path: "/settings",
    roles: ["admin"],
    group: "Administration",
  },
  {
    title: "Order History",
    icon: <History size={18} />,
    path: "/order-history",
    roles: ["admin"],
    group: "Engineering & Quality",
  },
  {
    title: "Settings",
    icon: <Settings size={18} />,
    path: "/profile/settings",
    roles: ["client"],
    group: "Administration",
  },

  // Support
  {
    title: "Support Ticket",
    icon: <Tickets size={18} />,
    path: "/support-ticket",
    roles: ["client", "admin"],
    group: "Support",
  },
];

export default function Sidebar({ darkMode }) {
  const [expandedItems, setExpandedItems] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}/user/protected-dashboard`,
          {
            withCredentials: true,
          },
        );
        setUser(res.data.user);
      } catch (error) {
        console.log("Sidebar user fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // If user not found
  if (!user) {
    return null;
  }

  // Filter menu based on user role
  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <aside
      className={`w-65 h-screen flex flex-col border-r shadow-lg transition-all duration-300 ${
        darkMode
          ? "bg-gray-900 text-gray-100 border-gray-800"
          : "bg-white text-gray-800 border-gray-200"
      }`}
    >
      {/* Logo Section */}
      <div
        className={`flex items-center justify-between px-6 h-20 shrink-0 border-b sticky top-0 z-10 ${
          darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <NavLink className="flex items-center">
          <div className="h-18 w-auto flex items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt="Logo"
              className="h-full w-auto object-contain"
            />
          </div>
        </NavLink>
      </div>

      {/* Menu Section */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
        <p
          className={`text-xs uppercase font-semibold mb-4 tracking-wider ${
            darkMode ? "text-gray-400" : "text-gray-500"
          }`}
        >
          Main Menu
        </p>

        <ul className="space-y-2">
          {filteredMenu.map((item, index) => (
            <li key={index}>
              <div className="relative">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md"
                        : darkMode
                          ? "text-gray-300 hover:bg-gray-800 hover:text-white hover:translate-x-1"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:translate-x-1"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center">
                        <span
                          className={`mr-3 transition-colors ${
                            isActive
                              ? "text-white"
                              : darkMode
                                ? "text-gray-400 group-hover:text-white"
                                : "text-gray-500 group-hover:text-gray-900"
                          }`}
                        >
                          {item.icon}
                        </span>

                        <span className="font-medium">{item.title}</span>
                      </div>

                      {item.submenu && (
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpand(index);
                          }}
                          className={`transition-transform duration-300 ${
                            expandedItems[index] ? "rotate-90" : ""
                          } ${
                            isActive
                              ? "text-white"
                              : darkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                          }`}
                        >
                          <ChevronRight size={18} />
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </div>

              {/* Submenu */}
              {item.submenu && expandedItems[index] && (
                <div
                  className={`ml-6 mt-2 pl-4 border-l space-y-1 ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  {item.submenu.map((subItem, subIndex) => (
                    <NavLink
                      key={subIndex}
                      to={subItem.path}
                      className={({ isActive }) =>
                        `block px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                          isActive
                            ? darkMode
                              ? "bg-gray-800 text-blue-400 font-semibold"
                              : "bg-blue-800 text-blue-800 font-semibold"
                            : darkMode
                              ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`
                      }
                    >
                      {subItem.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
