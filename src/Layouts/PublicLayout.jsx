import React from "react";
import { Outlet } from "react-router-dom";
import { Navigation } from "../Components/Navigation";
import { Footer } from "../Components/Footer";

export default function PublicLayout() {
  return (
    <div className="background-wrapper">
      <Navigation />
      <div className="public-with-nav">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}