import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "../../Styling/PaintCalculator.css";
import ExteriorEstimator from "./Components/ExteriorEstimator";
import { InteriorEstimator } from "./Components/InteriorEstimator";
import { StartEstimate } from "./Components/StartEstimate";
import HandymanEstimator from "./Components/HandymanEstimator";
import { FiArrowRight, FiHome, FiLayers, FiSun, FiTool } from "react-icons/fi";

const readEstimateDraft = () => {
  try {
    return JSON.parse(localStorage.getItem("estimateDraft") || "null");
  } catch {
    return null;
  }
};

export const Estimator = () => {
  const location = useLocation();
  const [draftData, setDraftData] = useState(readEstimateDraft);
  const [jobType, setJobType] = useState(() => localStorage.getItem("jobType") || "");
  const [step, setStep] = useState(() => localStorage.getItem("estimateStep") || "customer");
  const [estimateMethod, setEstimateMethod] = useState(
    () => localStorage.getItem("estimateMethod") || ""
  );
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState("");

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

  useEffect(() => {
    if (!editingQuoteData?.id) return;
    if (!["interior", "exterior"].includes(editingQuoteData.jobType)) return;

    const method = editingQuoteData.estimatorData ? "detailed" : "quick";
    setJobType(editingQuoteData.jobType);
    setEstimateMethod(method);
    setStep("calculator");
    localStorage.setItem("jobType", editingQuoteData.jobType);
    localStorage.setItem("estimateMethod", method);
    localStorage.setItem("estimateStep", "calculator");
  }, [editingQuoteData]);

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

  useEffect(() => {
    if (!customer || isEditing) return;

    const nextDraft = {
      ...(draftData || {}),
      customer,
      jobType,
      estimateMethod,
      step,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("estimateDraft", JSON.stringify(nextDraft));
    setDraftData(nextDraft);
    // Component-specific calculator data is merged through handleDraftChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, jobType, estimateMethod, step, isEditing]);

  const handleDraftChange = useCallback((calculatorData) => {
    if (isEditing) return;
    setDraftData((previous) => {
      const next = {
        ...(previous || {}),
        customer,
        jobType,
        estimateMethod,
        step,
        calculatorData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("estimateDraft", JSON.stringify(next));
      return next;
    });
  }, [customer, estimateMethod, isEditing, jobType, step]);

  const saveDraftNow = () => {
    if (!customer || isEditing) return;

    const nextDraft = {
      ...(draftData || {}),
      customer,
      jobType,
      estimateMethod,
      step,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("estimateDraft", JSON.stringify(nextDraft));
    setDraftData(nextDraft);
    setDraftSavedMessage("Draft saved. You can safely come back later.");
    window.setTimeout(() => setDraftSavedMessage(""), 3500);
  };

  const getInitials = (cust) => {
    const f = (cust?.firstName || "").trim();
    const l = (cust?.lastName || "").trim();
    const first = f ? f[0].toUpperCase() : "";
    const last = l ? l[0].toUpperCase() : "";
    return (first + last) || "?";
  };

  const editCustomer = () => {
    setCustomerModalOpen(true);
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

    setEstimateMethod(["handyman", "drywall"].includes(type) ? "quick" : "");
    if (["handyman", "drywall"].includes(type)) {
      localStorage.setItem("estimateMethod", "quick");
      setStep("calculator");
      localStorage.setItem("estimateStep", "calculator");
    } else {
      localStorage.removeItem("estimateMethod");
      setStep("estimateMethod");
      localStorage.setItem("estimateStep", "estimateMethod");
    }
  };

  const chooseEstimateMethod = (method) => {
    setEstimateMethod(method);
    localStorage.setItem("estimateMethod", method);
    setStep("calculator");
    localStorage.setItem("estimateStep", "calculator");
  };

  const handleCustomerNext = (cust) => {
    setCustomer(cust);
    localStorage.setItem("estimateCustomer", JSON.stringify(cust));

    setStep("jobType");
    localStorage.setItem("estimateStep", "jobType");
  };

  const handleCustomerChange = (cust) => {
    setCustomer(cust);
    localStorage.setItem("estimateCustomer", JSON.stringify(cust));
    setCustomerModalOpen(false);
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
        <div className="content-wrapper-jobs estimate-type-screen">
          <div className="estimate-type-heading">
            <span className="estimate-type-kicker">New estimate</span>
            <h1>What are we working on?</h1>
            <p>Choose a service to open the right estimating workspace.</p>
          </div>

          <div className="jobtype-actions">
            <button
              type="button"
              className="job-type-opt job-type-interior"
              onClick={() => chooseJobType("interior")}
            >
              <span className="job-type-icon"><FiHome aria-hidden="true" /></span>
              <span className="job-type-copy">
                <strong>Interior Painting</strong>
                <small>Rooms, ceilings, trim, doors, and complete interiors.</small>
              </span>
              <FiArrowRight className="job-type-arrow" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="job-type-opt job-type-exterior"
              onClick={() => chooseJobType("exterior")}
            >
              <span className="job-type-icon"><FiSun aria-hidden="true" /></span>
              <span className="job-type-copy">
                <strong>Exterior Painting</strong>
                <small>Walls, stucco, soffits, fascia, trim, and doors.</small>
              </span>
              <FiArrowRight className="job-type-arrow" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="job-type-opt job-type-drywall"
              onClick={() => chooseJobType("drywall")}
            >
              <span className="job-type-icon"><FiLayers aria-hidden="true" /></span>
              <span className="job-type-copy">
                <strong>Drywall Installation / Repair</strong>
                <small>Installation, patches, finishing, and texture matching.</small>
              </span>
              <FiArrowRight className="job-type-arrow" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="job-type-opt job-type-handyman"
              onClick={() => chooseJobType("handyman")}
            >
              <span className="job-type-icon"><FiTool aria-hidden="true" /></span>
              <span className="job-type-copy">
                <strong>Multiple Services</strong>
                <small>Combine repairs, installations, and custom work in one estimate.</small>
              </span>
              <FiArrowRight className="job-type-arrow" aria-hidden="true" />
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

  if (step === "estimateMethod" && (jobType === "interior" || jobType === "exterior")) {
    const paintingLabel = jobType === "interior" ? "Interior Painting" : "Exterior Painting";

    return (
      <section className="paint-calculator-wrapper">
        <div className="content-wrapper-jobs">
          <h1>How would you like to estimate?</h1>
          <p>Choose the level of detail that fits this {paintingLabel.toLowerCase()} project.</p>

          <div className="estimate-method-grid">
            <button
              type="button"
              className="estimate-method-card"
              onClick={() => chooseEstimateMethod("detailed")}
            >
              <span className="estimate-method-kicker">Measurement based</span>
              <strong>Detailed Calculator</strong>
              <span>
                Calculate pricing from walls, dimensions, surfaces, and production details.
              </span>
            </button>

            <button
              type="button"
              className="estimate-method-card"
              onClick={() => chooseEstimateMethod("quick")}
            >
              <span className="estimate-method-kicker">Simple and flexible</span>
              <strong>Quick Line Items</strong>
              <span>
                Add your own work descriptions and prices without measuring every wall.
              </span>
            </button>
          </div>

          <button
            type="button"
            className="collapse-area-btn"
            onClick={() => {
              setJobType("");
              localStorage.removeItem("jobType");
              setStep("jobType");
              localStorage.setItem("estimateStep", "jobType");
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
        <div className="estimator-draft-toolbar">
          <button
            type="button"
            className="collapse-area-btn"
            onClick={() => {
              setEditingQuoteData(null);
              localStorage.removeItem("editingQuoteId");
              localStorage.removeItem("editingQuoteData");

              setJobType("");
              localStorage.removeItem("jobType");
              setEstimateMethod("");
              localStorage.removeItem("estimateMethod");

              setStep("jobType");
              localStorage.setItem("estimateStep", "jobType");
            }}
          >
            Change Job Type
          </button>

          {!isEditing && (
            <button
              type="button"
              className="save-estimate-draft-btn"
              onClick={saveDraftNow}
            >
              Save Draft
            </button>
          )}
        </div>

        {draftSavedMessage && (
          <div className="estimate-draft-saved" role="status" aria-live="polite">
            {draftSavedMessage}
          </div>
        )}

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
          {jobType === "interior" && estimateMethod === "quick" ? (
            <HandymanEstimator
              key={editingQuoteData?.id ? `edit-${editingQuoteData.id}` : "new-interior-quick"}
              customer={customer}
              initialQuote={
                editingQuoteData?.jobType === "interior"
                  ? editingQuoteData
                  : draftData?.jobType === "interior"
                    ? draftData.calculatorData
                    : null
              }
              mode={isEditing && editingQuoteData?.jobType === "interior" ? "edit" : "create"}
              onDraftChange={handleDraftChange}
              quoteJobType="interior"
              heading="Interior Painting Estimate"
              itemExample="Walls, ceilings, trim, or complete rooms"
            />
          ) : jobType === "interior" ? (
            <InteriorEstimator
              key={editingQuoteData?.id ? `edit-${editingQuoteData.id}` : "new-interior"}
              customer={customer}
              initialAreas={interiorInitialAreas}
              initialPricing={interiorInitialPricing}
              initialPaintGrade={interiorInitialPaintGrade}
              draftData={!isEditing && draftData?.jobType === "interior" ? draftData.calculatorData : null}
              onDraftChange={handleDraftChange}
            />
          ) : jobType === "exterior" && estimateMethod === "quick" ? (
            <HandymanEstimator
              key={editingQuoteData?.id ? `edit-${editingQuoteData.id}` : "new-exterior-quick"}
              customer={customer}
              initialQuote={
                editingQuoteData?.jobType === "exterior"
                  ? editingQuoteData
                  : draftData?.jobType === "exterior"
                    ? draftData.calculatorData
                    : null
              }
              mode={isEditing && editingQuoteData?.jobType === "exterior" ? "edit" : "create"}
              onDraftChange={handleDraftChange}
              quoteJobType="exterior"
              heading="Exterior Painting Estimate"
              itemExample="Siding, trim, doors, or preparation"
            />
          ) : jobType === "exterior" ? (
            <ExteriorEstimator
              key={editingQuoteData?.id ? `edit-${editingQuoteData.id}` : "new-exterior"}
              customer={customer}
              existingQuote={
                editingQuoteData?.jobType === "exterior"
                  ? editingQuoteData
                  : draftData?.jobType === "exterior"
                    ? draftData.calculatorData
                    : null
              }
              mode={
                isEditing && editingQuoteData?.jobType === "exterior" ? "edit" : "create"
              }
              onDraftChange={handleDraftChange}
            />
          ) : jobType === "drywall" ? (
            <HandymanEstimator
              key={editingQuoteData?.id ? `edit-${editingQuoteData.id}` : "new-drywall"}
              customer={customer}
              initialQuote={
                editingQuoteData?.jobType === "drywall"
                  ? editingQuoteData
                  : draftData?.jobType === "drywall"
                    ? draftData.calculatorData
                    : null
              }
              mode={isEditing && editingQuoteData?.jobType === "drywall" ? "edit" : "create"}
              onDraftChange={handleDraftChange}
              quoteJobType="drywall"
              heading="Drywall Installation / Repair Estimate"
              itemExample="Drywall installation, repairs, finishing, or texture matching"
            />
          ) : (
            <HandymanEstimator
              key={editingQuoteData?.id ? `edit-${editingQuoteData.id}` : "new-handyman"}
              customer={customer}
              initialQuote={
                editingQuoteData?.jobType === "handyman"
                  ? editingQuoteData
                  : draftData?.jobType === "handyman"
                    ? draftData.calculatorData
                    : null
              }
              mode={isEditing && editingQuoteData?.jobType === "handyman" ? "edit" : "create"}
              onDraftChange={handleDraftChange}
            />
          )}
        </div>

        {customerModalOpen && (
          <div
            className="estimate-customer-modal-backdrop"
            onMouseDown={() => setCustomerModalOpen(false)}
          >
            <div
              className="estimate-customer-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="change-estimate-customer-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="estimate-customer-modal-head">
                <div>
                  <h2 id="change-estimate-customer-title">Change Customer</h2>
                  <p>Create a new customer or select one already in your CRM.</p>
                </div>
                <button
                  type="button"
                  className="estimate-customer-modal-close"
                  aria-label="Close customer selection"
                  onClick={() => setCustomerModalOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="estimate-customer-modal-body">
                <StartEstimate initialCustomer={null} onNext={handleCustomerChange} />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Estimator;
