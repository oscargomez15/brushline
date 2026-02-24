import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Components/Sidebar";
import "../Styling/Sidebar.css";

export default function CRMLayout() {
  return (
    <div className="crm-shell">
      <Sidebar />
      <main className="crm-main">
        <Outlet />
      </main>
    </div>
  );
}