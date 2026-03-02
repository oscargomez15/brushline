// src/Pages/PaintCalculator/index.jsx
import React, { useState } from "react";
import "../../Styling/PaintCalculator.css";
import ExteriorEstimator from "./Components/ExteriorEstimator";
import { InteriorEstimator } from "./Components/InteriorEstimator";
import {StartEstimate} from "./Components/StartEstimate"

export const Estimator = () => {
    const [jobType, setJobType] = useState(() => localStorage.getItem("jobType") || "");
    const [step, setStep] = useState(() => localStorage.getItem("estimateStep") || "customer");

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

// STEP 1: customer info
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

// STEP 2: choose job type
if (step === "jobType") {
  return (
    <section className="paint-calculator-wrapper">
      <div className="content-wrapper-jobs">

          <h1>Estimate Type</h1>
          <p>Is this an interior or exterior job?</p>

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
          <InteriorEstimator customer={customer} />
        ) : (
          <ExteriorEstimator customer={customer} />
        )}
      </div>
    </div>
  </section>
  );
};

export default Estimator;
