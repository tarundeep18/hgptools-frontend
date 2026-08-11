import { Link } from "react-router-dom";

export default function RoleBasedSidebar({ role }) {
  const menu = {
    admin: [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Manage Users", path: "/admin/users" },
    ],
    customer: [
      { label: "Dashboard", path: "/customer/dashboard" },
      { label: "My Orders", path: "/customer/orders" },
    ],
  };

  return (
    <div>
      {menu[role]?.map((item) => (
        <Link key={item.path} to={item.path}>
          {item.label}
        </Link>
      ))}
    </div>
  );
}
