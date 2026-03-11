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
  FiChevronDown,
  FiUsers
} from "react-icons/fi";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [openMenu, setOpenMenu] = useState(null); // "estimates" | "invoices" | null
  const [email, setEmail] = useState("");
  const [mobileMenu, setMobileMenu] = useState(null); // "estimates" | "invoices" | null
  const location = useLocation();

  useEffect(() => {
    // Close any open mobile menu when route changes
    setMobileMenu(null);
  }, [location.pathname]);
  

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
    if (path.startsWith("/crm/estimates")) setOpenMenu("estimates");
    else if (path.startsWith("/crm/invoices")) setOpenMenu("invoices");
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
          <button
            type="button"
            className="crm-collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "»" : "«"}
          </button>

          <div className="crm-user">
            <div className="crm-user-avatar" aria-hidden="true">
              {email ? email[0].toUpperCase() : "?"}
            </div>
            {!collapsed && (
              <div className="crm-user-meta">
                <div className="crm-user-label">Current User</div>
                <div className="crm-user-email">{userLabel}</div>

                <button
                  type="button"
                  className="crm-signout"
                  onClick={signOut}
                  disabled={!email}
                  style={{ opacity: email ? 1 : 0.6 }}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="crm-nav">
          <NavItem
              to="/crm/dashboard"
              label="Dashboard"
              icon={<FiHome />}
              collapsed={collapsed}
          />

          <Dropdown
          label="Estimates"
          icon={<FiFileText />}
          collapsed={collapsed}
          open={openMenu === "estimates"}
          onToggle={() => toggleMenu("estimates")}
          >
              <NavItem
              to="/crm/estimates/find"
              label="Find"
              icon={<FiSearch />}
              collapsed={collapsed}
              indent
              />
              <NavItem
              to="/crm/estimates/create"
              label="Create"
              icon={<FiPlusCircle />}
              collapsed={collapsed}
              indent
              />
              <NavItem
              to="/crm/estimates/edit"
              label="Edit"
              icon={<FiEdit />}
              collapsed={collapsed}
              indent
              />
          </Dropdown>

          <Dropdown
          label="Invoices"
          icon={<FiDollarSign />}
          collapsed={collapsed}
          open={openMenu === "invoices"}
          onToggle={() => toggleMenu("invoices")}
          >
              <NavItem
                  to="/crm/invoices/find"
                  label="Find"
                  icon={<FiSearch />}
                  collapsed={collapsed}
                  indent
              />
              <NavItem
                  to="/crm/invoices/create"
                  label="Create"
                  icon={<FiPlusCircle />}
                  collapsed={collapsed}
                  indent
              />
              <NavItem
                  to="/crm/invoices/edit/:id"
                  label="Edit"
                  icon={<FiEdit />}
                  collapsed={collapsed}
                  indent
              />
          </Dropdown>

          <NavItem
            to="/crm/customers"
            label="Customers"
            icon={<FiUsers />}
            collapsed={collapsed}
          />
        </nav>

        {/* Bottom (optional) */}
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
            <NavLink className="crm-mobile-dd-item" to="/crm/estimates/find">
              <FiSearch /> <span>Find</span>
            </NavLink>
            <NavLink className="crm-mobile-dd-item" to="/crm/estimates/create">
              <FiPlusCircle /> <span>Create</span>
            </NavLink>
            <NavLink className="crm-mobile-dd-item" to="/crm/estimates/edit">
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
            <NavLink className="crm-mobile-dd-item" to="/crm/invoices/find">
              <FiSearch /> <span>Find</span>
            </NavLink>
            <NavLink className="crm-mobile-dd-item" to="/crm/invoices/create">
              <FiPlusCircle /> <span>Create</span>
            </NavLink>
            <NavLink className="crm-mobile-dd-item" to="/crm/invoices/edit/">
              <FiEdit /> <span>Edit</span>
            </NavLink>
          </div>
        )}
      </div>

      <NavLink
        to="/crm/customers"
        className={({ isActive }) => `crm-mobile-link ${isActive ? "active" : ""}`}
        aria-label="Customers"
        onClick={() => setMobileMenu(null)}
      >
        <span className="crm-mobile-icon"><FiUsers /></span>
      </NavLink>
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