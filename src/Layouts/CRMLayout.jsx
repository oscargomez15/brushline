import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import "../Styling/Sidebar.css";

export default function CRMLayout() {
  return (
    <div className="crm-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" className="crm-main" tabIndex="-1">
        <Outlet />
      </main>
    </div>
  );
}
