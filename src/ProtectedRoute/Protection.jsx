import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PERMISSIONS } from "../config/roles";

export default function ProtectedRoute({ allowedRoles, requiredPermission }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" replace />;

  // Role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // all permission check here 
  if (
    requiredPermission &&
    !PERMISSIONS[user.role]?.includes(requiredPermission)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

// config/roles.js

export const ROLE = {
  ADMIN: "admin",
  CUSTOMER: "customer",

};

export const PERMISSIONS = {
  admin: ["view_dashboard", "manage_users", "view_orders"],
  customer: ["view_dashboard", "view_own_orders"],
};
