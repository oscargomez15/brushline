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
  const [collapsed, setCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "estimates" | "invoices" | null
  const [email, setEmail] = useState("");

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
            to="/dashboard"
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
            to="/estimates/find"
            label="Find"
            icon={<FiSearch />}
            collapsed={collapsed}
            indent
            />
            <NavItem
            to="/estimates/create"
            label="Create"
            icon={<FiPlusCircle />}
            collapsed={collapsed}
            indent
            />
            <NavItem
            to="/estimates/edit"
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
                to="/invoices/find"
                label="Find"
                icon={<FiSearch />}
                collapsed={collapsed}
                indent
            />
            <NavItem
                to="/invoices/create"
                label="Create"
                icon={<FiPlusCircle />}
                collapsed={collapsed}
                indent
            />
            <NavItem
                to="/invoices/edit"
                label="Edit"
                icon={<FiEdit />}
                collapsed={collapsed}
                indent
            />
        </Dropdown>
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