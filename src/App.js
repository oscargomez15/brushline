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
import { Accessibility } from "./Pages/Accessibility";
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
import VoiceAssistantTest from "./Pages/VoiceAssistantTest/VoiceAssistantTest";

function StartEstimateRoute() {
  const navigate = useNavigate();
  const savedDraft = (() => {
    try {
      return JSON.parse(localStorage.getItem("estimateDraft") || "null");
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    localStorage.removeItem("estimateCustomer");
    localStorage.removeItem("estimateStep");
    localStorage.removeItem("jobType");
    localStorage.removeItem("estimateMethod");
  }, []);

  return (
    <StartEstimate
      initialCustomer={null}
      savedDraft={savedDraft}
      onResumeDraft={(draft) => {
        if (!draft?.customer) return;
        localStorage.setItem("estimateCustomer", JSON.stringify(draft.customer));
        localStorage.setItem("estimateStep", draft.step || "jobType");
        if (draft.jobType) localStorage.setItem("jobType", draft.jobType);
        if (draft.estimateMethod) localStorage.setItem("estimateMethod", draft.estimateMethod);
        navigate("/crm/estimator");
      }}
      onDiscardDraft={() => {
        localStorage.removeItem("estimateDraft");
        window.location.reload();
      }}
      onNext={(customerData) => {
        localStorage.removeItem("estimateDraft");
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
          <Route path="/accessibility" element={<Accessibility />} />
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
            <Route path="voice-assistant-test" element={<VoiceAssistantTest />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
