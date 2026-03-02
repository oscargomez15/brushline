import React, { useEffect, useMemo, useState } from "react";
// If you use react-router:
import { NavLink, useLocation } from "react-router-dom";

// If you're using Netlify Identity widget:
import netlifyIdentity from "netlify-identity-widget";

import {
  FiHome,
  FiFileText,
  FiSearch,
  FiPlusCircle,
  FiEdit,
  FiDollarSign,
  FiChevronRight,
  FiChevronDown
} from "react-icons/fi";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [openMenu, setOpenMenu] = useState(null); // "estimates" | "invoices" | null
  const [email, setEmail] = useState("");
  const [mobileMenu, setMobileMenu] = useState(null); // "estimates" | "invoices" | null

  useEffect(() => {
    // Close any open mobile menu when route changes
    setMobileMenu(null);
  }, [location.pathname]);
  
  const location = useLocation();

  useEffect(() => {
    // read current user email (Netlify Identity)
    const user = netlifyIdentity.currentUser();
    setEmail(user?.email || user?.user_metadata?.email || "");

    // keep updated if login state changes
    const onLogin = (u) => setEmail(u?.email || u?.user_metadata?.email || "");
    const onLogout = () => setEmail("");

    netlifyIdentity.on("login", onLogin);
    netlifyIdentity.on("logout", onLogout);

    return () => {
      netlifyIdentity.off("login", onLogin);
      netlifyIdentity.off("logout", onLogout);
    };
  }, []);

  // Auto-open dropdown based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith("/estimates")) setOpenMenu("estimates");
    else if (path.startsWith("/invoices")) setOpenMenu("invoices");
  }, [location.pathname]);

  const toggleMenu = (key) => {
    setOpenMenu((prev) => (prev === key ? null : key));
    if (collapsed) setCollapsed(false);
  };

  const signOut = () => {
    netlifyIdentity.logout();
    // optionally route elsewhere:
    // window.location.href = "/";
  };

  const userLabel = useMemo(() => {
    if (!email) return "Not signed in";
    return email;
  }, [email]);

  return (
  <>
    <aside className={`crm-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Top */}
      <div className="crm-top">
        ...
      </div>

      {/* Nav */}
      <nav className="crm-nav">
        ...
      </nav>

      {/* Bottom */}
      <div className="crm-bottom">
        {!collapsed && (
          <div className="crm-bottom-hint">
            Tip: Use the dropdowns to manage estimates and invoices.
          </div>
        )}
      </div>
    </aside>

    {/* ✅ Mobile Bottom Nav */}
    <div className="crm-mobile-nav" aria-label="Mobile navigation">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `crm-mobile-link ${isActive ? "active" : ""}`}
        aria-label="Dashboard"
        onClick={() => setMobileMenu(null)}
      >
        <span className="crm-mobile-icon"><FiHome /></span>
      </NavLink>

      {/* Estimates menu */}
      <div className="crm-mobile-menu">
        <button
          type="button"
          className={`crm-mobile-link ${mobileMenu === "estimates" ? "active" : ""}`}
          aria-label="Estimates menu"
          onClick={() => setMobileMenu((v) => (v === "estimates" ? null : "estimates"))}
        >
          <span className="crm-mobile-icon"><FiFileText /></span>
        </button>

        {mobileMenu === "estimates" && (
          <div className="crm-mobile-dropdown">
            <NavLink className="crm-mobile-dd-item" to="/estimates/find">
              <FiSearch /> <span>Find</span>
            </NavLink>
            <NavLink className="crm-mobile-dd-item" to="/estimates/create">
              <FiPlusCircle /> <span>Create</span>
            </NavLink>
            <NavLink className="crm-mobile-dd-item" to="/estimates/edit">
              <FiEdit /> <span>Edit</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Invoices menu */}
      <div className="crm-mobile-menu">
        <button
          type="button"
          className={`crm-mobile-link ${mobileMenu === "invoices" ? "active" : ""}`}
          aria-label="Invoices menu"
          onClick={() => setMobileMenu((v) => (v === "invoices" ? null : "invoices"))}
        >
          <span className="crm-mobile-icon"><FiDollarSign /></span>
        </button>

        {mobileMenu === "invoices" && (
          <div className="crm-mobile-dropdown">
            <NavLink className="crm-mobile-dd-item" to="/invoices/find">
              <FiSearch /> <span>Find</span>
            </NavLink>
            <NavLink className="crm-mobile-dd-item" to="/invoices/create">
              <FiPlusCircle /> <span>Create</span>
            </NavLink>
            <NavLink className="crm-mobile-dd-item" to="/invoices/edit">
              <FiEdit /> <span>Edit</span>
            </NavLink>
          </div>
        )}
      </div>
    </div>

    {/* Optional: tap-away backdrop to close dropdown */}
    {mobileMenu && <div className="crm-mobile-backdrop" onClick={() => setMobileMenu(null)} />}
  </>
);
}

function NavItem({ to, label, icon, collapsed, indent = false }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `crm-link ${isActive ? "active" : ""} ${indent ? "indent" : ""}`
      }
      title={collapsed ? label : undefined}
    >
      <span className="crm-icon">{icon}</span>
      {!collapsed && <span className="crm-link-text">{label}</span>}
    </NavLink>
  );
}

function Dropdown({ label, icon, collapsed, open, onToggle, children }) {
  return (
    <div className={`crm-group ${open ? "open" : ""}`}>
      <button
        type="button"
        className="crm-group-btn"
        onClick={onToggle}
        title={collapsed ? label : undefined}
      >
        <span className="crm-icon">{icon}</span>

        {!collapsed && (
          <>
            <span className="crm-group-label">{label}</span>
            <span className="crm-caret">
              {open ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </>
        )}
      </button>

      {!collapsed && open && (
        <div className="crm-group-children">
          {children}
        </div>
      )}
    </div>
  );
}