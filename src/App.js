import "./App.css";
import { useEffect, lazy, Suspense } from "react";
import FindPageSkeleton from "./Components/FindPageSkeleton";
import { Routes, Route, useNavigate } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";

import ScrollToTop from "./Components/ScrollToTop";
import RequireAuth from "./Components/RequireAuth";

// Layouts
import PublicLayout from "./Layouts/PublicLayout";

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


import PublicSEO from "./Components/PublicSEO";
import WebsiteAnalytics from "./Components/WebsiteAnalytics";

const HomeServices = lazy(() => import("./Pages/HomeServices"));
const CRMLayout = lazy(() => import("./Layouts/CRMLayout"));
const Estimator = lazy(() => import("./Pages/Estimator/Estimator"));
const QuotePage = lazy(() => import("./Pages/Quote/QuotePage"));
const FindEstimates = lazy(() => import("./Pages/Estimates/FindEstimates"));
const StartEstimate = lazy(() => import("./Pages/Estimator/Components/StartEstimate").then((module) => ({ default: module.StartEstimate })));
const CustomersList = lazy(() => import("./Pages/Customers/CustomersList"));
const EditEstimateRoute = lazy(() => import("./Pages/Estimates/EditEstimateRoute"));
const Dashboard = lazy(() => import("./Pages/Dashboard/Dashboard"));
const InvoiceEditor = lazy(() => import("./Pages/Invoices/InvoiceEditor"));
const PublicInvoicePage = lazy(() => import("./Pages/Invoices/PublicInvoicePage"));
const FindInvoices = lazy(() => import("./Pages/Invoices/FindInvoices"));
const VoiceAssistantTest = lazy(() => import("./Pages/VoiceAssistantTest/VoiceAssistantTest"));
const Calendar = lazy(() => import("./Pages/Calendar/Calendar"));
const Metrics = lazy(() => import("./Pages/Metrics/Metrics"));
const LeadsList = lazy(() => import("./Pages/Leads/LeadsList"));

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

      <WebsiteAnalytics />

      <Suspense fallback={<FindPageSkeleton title="Page" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/painting" element={<Painting />} />
          <Route path="/drywall" element={<Drywall />} />
          <Route path="/cleaning" element={<Cleaning />} />
          <Route path="/home-services" element={<HomeServices />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/service-area/:citySlug" element={<ServiceArea />} />
          <Route path="/quote/:id" element={<QuotePage />} />
          <Route path="/invoice/:id" element={<PublicInvoicePage />} />
          <Route path="/assistant" element={<VoiceAssistantTest publicMode />} />
        </Route>

        <Route path="/crm" element={<RequireAuth />}>
          <Route element={<CRMLayout />}>
            <Route path="calendar" element={<Calendar />} />
            <Route path="metrics" element={<Metrics />} />
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
            <Route path="leads" element={<LeadsList />} />
            <Route path="voice-assistant-test" element={<VoiceAssistantTest />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <PublicSEO />
    </>
  );
}

export default App;

