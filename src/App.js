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
import { StartEstimate } from "./Pages/Estimator/Components/StartEstimate";
import CustomersList from "./Pages/Customers/CustomersList";
import EditEstimateRoute from "./Pages/Estimates/EditEstimateRoute";
import Dashboard from "./Pages/Dashboard/Dashboard";

import InvoiceEditor from "./Pages/Invoices/InvoiceEditor";
import PublicInvoicePage from "./Pages/Invoices/PublicInvoicePage";
import FindInvoices from "./Pages/Invoices/FindInvoices";

function StartEstimateRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("estimateCustomer");
    localStorage.removeItem("estimateStep");
    localStorage.removeItem("jobType");
  }, []);

  return (
    <StartEstimate
      initialCustomer={null}
      onNext={(customerData) => {
        localStorage.setItem("estimateCustomer", JSON.stringify(customerData));
        localStorage.setItem("estimateStep", "jobType");
        navigate("/crm/estimator");
      }}
    />
  );
}

function App() {
  const navigate = useNavigate();

  useEffect(() => {
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
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/painting" element={<Painting />} />
          <Route path="/drywall" element={<Drywall />} />
          <Route path="/cleaning" element={<Cleaning />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/service-area/:citySlug" element={<ServiceArea />} />
          <Route path="/quote/:id" element={<QuotePage />} />
          <Route path="/invoice/:id" element={<PublicInvoicePage />} />
        </Route>

        <Route path="/crm" element={<RequireAuth />}>
          <Route element={<CRMLayout />}>
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="estimates/find" element={<FindEstimates />} />
            <Route path="estimates/create" element={<StartEstimateRoute />} />
            <Route path="estimates/edit/:id" element={<EditEstimateRoute />} />

            <Route path="estimator" element={<Estimator />} />

            <Route path="invoices/find" element={<FindInvoices />} />
            <Route path="invoices/create" element={<InvoiceEditor />} />
            <Route path="invoices/edit/:id" element={<InvoiceEditor />} />
            <Route path="invoices/:id" element={<PublicInvoicePage />} />

            <Route path="customers" element={<CustomersList />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
