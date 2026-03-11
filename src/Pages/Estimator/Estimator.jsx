import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../Styling/PaintCalculator.css";
import ExteriorEstimator from "./Components/ExteriorEstimator";
import { InteriorEstimator } from "./Components/InteriorEstimator";
import { StartEstimate } from "./Components/StartEstimate";
import HandymanEstimator from "./Components/HandymanEstimator";

export const Estimator = () => {
  const location = useLocation();
  const [jobType, setJobType] = useState(() => localStorage.getItem("jobType") || "");
  const [step, setStep] = useState(() => localStorage.getItem("estimateStep") || "customer");

  const [editingQuoteData, setEditingQuoteData] = useState(
    location.state?.editingQuoteData || null
  );

  useEffect(() => {
    if (location.state?.editingQuoteData) {
      setEditingQuoteData(location.state.editingQuoteData);
      return;
    }

    try {
      const savedId = localStorage.getItem("editingQuoteId");
      const saved = JSON.parse(localStorage.getItem("editingQuoteData") || "null");

      if (savedId && saved && saved.id === savedId) {
        setEditingQuoteData(saved);
        console.log("editingQuoteData loaded in Estimator:", saved);
      } else {
        setEditingQuoteData(null);
      }
    } catch {
      setEditingQuoteData(null);
    }
  }, [location.state]);

  const interiorInitialAreas =
    editingQuoteData?.jobType === "interior"
      ? editingQuoteData?.estimatorData?.areas || []
      : [];

  const interiorInitialPricing =
    editingQuoteData?.jobType === "interior"
      ? editingQuoteData?.estimatorData?.pricing || null
      : null;

  const interiorInitialPaintGrade =
    editingQuoteData?.jobType === "interior"
      ? editingQuoteData?.estimatorData?.paintGrade || null
      : null;

  const isEditing = Boolean(editingQuoteData?.id);

  const [customer, setCustomer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("estimateCustomer") || "null");
    } catch {
      return null;
    }
  });

  const getInitials = (cust) => {
    const f = (cust?.firstName || "").trim();
    const l = (cust?.lastName || "").trim();
    const first = f ? f[0].toUpperCase() : "";
    const last = l ? l[0].toUpperCase() : "";
    return (first + last) || "?";
  };

  const editCustomer = () => {
    setStep("customer");
    localStorage.setItem("estimateStep", "customer");
  };

  if (step === "calculator" && (!customer || !jobType)) {
    setStep(customer ? "jobType" : "customer");
    localStorage.setItem("estimateStep", customer ? "jobType" : "customer");
  }

  const chooseJobType = (type) => {
    setEditingQuoteData(null);
    localStorage.removeItem("editingQuoteId");
    localStorage.removeItem("editingQuoteData");

    setJobType(type);
    localStorage.setItem("jobType", type);

    setStep("calculator");
    localStorage.setItem("estimateStep", "calculator");
  };

  const handleCustomerNext = (cust) => {
    setCustomer(cust);
    localStorage.setItem("estimateCustomer", JSON.stringify(cust));

    setStep("jobType");
    localStorage.setItem("estimateStep", "jobType");
  };

  if (step === "customer") {
    return (
      <section className="paint-calculator-wrapper">
        <div className="content-wrapper-jobs">
          <div className="jobtype-card">
            <StartEstimate
              initialCustomer={customer}
              onNext={handleCustomerNext}
            />
          </div>
        </div>
      </section>
    );
  }

  if (step === "jobType") {
    return (
      <section className="paint-calculator-wrapper">
        <div className="content-wrapper-jobs">
          <h1>Estimate Type</h1>
          <p>What type of job are we estimating today?</p>

          <div className="jobtype-actions">
            <button
              type="button"
              className="job-type-opt"
              onClick={() => chooseJobType("interior")}
            >
              Interior Paint
            </button>

            <button
              type="button"
              className="job-type-opt"
              onClick={() => chooseJobType("exterior")}
            >
              Exterior Paint
            </button>

            <button
              type="button"
              className="job-type-opt"
              onClick={() => chooseJobType("handyman")}
            >
              Handyman / Misc
            </button>
          </div>

          <button
            type="button"
            className="collapse-area-btn"
            onClick={() => {
              setStep("customer");
              localStorage.setItem("estimateStep", "customer");
            }}
            style={{ marginTop: 12 }}
          >
            Back
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="paint-calculator-wrapper">
      <div className="content-wrapper">
        <button
          type="button"
          className="collapse-area-btn"
          onClick={() => {
            setEditingQuoteData(null);
            localStorage.removeItem("editingQuoteId");
            localStorage.removeItem("editingQuoteData");

            setJobType("");
            localStorage.removeItem("jobType");

            setStep("jobType");
            localStorage.setItem("estimateStep", "jobType");
          }}
        >
          Change Job Type
        </button>

        <button
          type="button"
          className="collapse-area-btn"
          onClick={() => {
            setStep("customer");
            localStorage.setItem("estimateStep", "customer");
          }}
          style={{ marginLeft: 8 }}
        >
          Change Customer
        </button>

        {customer && (
          <button
            type="button"
            className="customer-pill"
            onClick={editCustomer}
            title="Click to edit customer"
          >
            <div className="customer-avatar" aria-hidden="true">
              {getInitials(customer)}
            </div>

            <div className="customer-info">
              <strong>
                {customer.firstName} {customer.lastName}
              </strong>
              <span>{customer.address}</span>
              <small className="customer-edit-hint">Click to edit</small>
            </div>
          </button>
        )}

        <div className="sub-heading">
          {jobType === "interior" ? (
            <InteriorEstimator
              key={editingQuoteData?.id ? `edit-${editingQuoteData.id}` : "new-interior"}
              customer={customer}
              initialAreas={interiorInitialAreas}
              initialPricing={interiorInitialPricing}
              initialPaintGrade={interiorInitialPaintGrade}
            />
          ) : jobType === "exterior" ? (
            <ExteriorEstimator customer={customer} />
          ) : (
            <HandymanEstimator
              key={editingQuoteData?.id ? `edit-${editingQuoteData.id}` : "new-handyman"}
              customer={customer}
              initialQuote={editingQuoteData?.jobType === "handyman" ? editingQuoteData : null}
              mode={isEditing && editingQuoteData?.jobType === "handyman" ? "edit" : "create"}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default Estimator;