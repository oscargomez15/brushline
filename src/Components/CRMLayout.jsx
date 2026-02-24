import React from "react";
import Sidebar from "./Sidebar";
import "../Styling/Sidebar.css";

export default function CRMLayout({ children }) {
  return (
    <div className="crm-shell">
      <Sidebar />
      <main className="crm-main">{children}</main>
    </div>
  );
}