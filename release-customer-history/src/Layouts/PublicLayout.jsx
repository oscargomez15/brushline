import React from "react";
import { Outlet } from "react-router-dom";
import { Navigation } from "../Components/Navigation";
import { Footer } from "../Components/Footer";

export default function PublicLayout() {
  return (
    <div className="background-wrapper">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Navigation />
      <main id="main-content" className="public-with-nav" tabIndex="-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
