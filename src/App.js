import "./App.css";
import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";

import ScrollToTop from "./Components/ScrollToTop";
import RequireAuth from "./Components/RequireAuth";

// Layouts
import PublicLayout from "./Layouts/PublicLayout";
import CRMLayout from "./Layouts/CRMLayout";

// Pages
import { Home } from "./Pages/Home";
import { Painting } from "./Pages/Painting";
import { Drywall } from "./Pages/Drywall";
import { Cleaning } from "./Pages/Cleaning";
import { Privacy } from "./Pages/Privacy";
import ServiceArea from "./Pages/ServiceArea";
import { Login } from "./Pages/Login";
import { NotFound } from "./Pages/NotFound";

import { Estimator } from "./Pages/Estimator/Estimator";
import QuotePage from "./Pages/Quote/QuotePage";
import FindEstimates from "./Pages/Estimates/FindEstimates";

// (Optional placeholders for now)
const Dashboard = () => <div>Dashboard (coming next)</div>;
const EstimatesEdit = () => <div>Edit Estimate</div>;
const InvoicesFind = () => <div>Find Invoices</div>;
const InvoicesCreate = () => <div>Create Invoice</div>;
const InvoicesEdit = () => <div>Edit Invoice</div>;

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    netlifyIdentity.init();

    const hash = window.location.hash || "";
    if (hash.includes("invite_token")) netlifyIdentity.open("signup");
    if (hash.includes("recovery_token")) netlifyIdentity.open("login");

    const onLogout = () => navigate("/", { replace: true });
    netlifyIdentity.on("logout", onLogout);
    return () => netlifyIdentity.off("logout", onLogout);
  }, [navigate]);

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* PUBLIC SITE */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Home />} />
          <Route path="/painting" element={<Painting />} />
          <Route path="/drywall" element={<Drywall />} />
          <Route path="/cleaning" element={<Cleaning />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/service-area/:citySlug" element={<ServiceArea />} />

          {/* Quote page is public */}
          <Route path="/quote/:id" element={<QuotePage />} />
        </Route>

        {/* CRM / PROTECTED APP */}
        <Route element={<RequireAuth />}>
          <Route element={<CRMLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Estimates */}
            <Route path="/estimates/find" element={<FindEstimates />} />
            <Route path="/estimates/create" element={<Estimator />} />
            <Route path="/estimates/edit" element={<EstimatesEdit />} />

            {/* Keep your old estimator route if you want */}
            <Route path="/estimator" element={<Estimator />} />

            {/* Invoices */}
            <Route path="/invoices/find" element={<InvoicesFind />} />
            <Route path="/invoices/create" element={<InvoicesCreate />} />
            <Route path="/invoices/edit" element={<InvoicesEdit />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;