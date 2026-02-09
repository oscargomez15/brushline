// src/Pages/PaintCalculator/index.jsx
import React, { useState } from "react";
import "../../Styling/PaintCalculator.css";
import ExteriorEstimator from "./Components/ExteriorEstimator";
import { InteriorEstimator } from "./Components/InteriorEstimator";
import { IdentityControls } from "../../Components/IdentityControls";

export const Estimator = () => {
    const [jobType, setJobType] = useState(() => localStorage.getItem("jobType") || "");

    const chooseJobType = (type) => {
      setJobType(type);
      localStorage.setItem("jobType", type);
    };

if (!jobType) {
  return (
    <section className="paint-calculator-wrapper">
      <div className="content-wrapper-jobs">
        <IdentityControls />

        <div className="jobtype-card">
          <h1>Start an Estimate</h1>
          <p>Is this an interior or exterior job?</p>

          <div className="jobtype-actions">
            <button
              type="button"
              className="job-type-opt"
              onClick={() => chooseJobType("interior")}
            >
              Interior
            </button>

            <button
              type="button"
              className="job-type-opt"
              onClick={() => chooseJobType("exterior")}
            >
              Exterior
            </button>
          </div>
        </div>
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
          }}
        >
          Change Job Type
        </button>
        <IdentityControls />

        <div className="sub-heading">
        {jobType === "interior" ? (
        <>
        <InteriorEstimator/>
          {/* <h1>Interior Estimator</h1>
          <p>This tool is to be used exclusively by Authorized Employees.</p>

          <div className="price-inputs">
            <h2>Price</h2>
            <p>Price set is standard rate. Price will change based on some of the conditions.</p>

            <div className="price-input-items">
              <label>
                <span>Wall ($)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="dim-input"
                  value={wallPricePerSqft}
                  onChange={(e) => setWallPricePerSqft(e.target.value)}
                />
              </label>

              <label>
                <span>Ceiling ($)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="dim-input"
                  value={ceilingPricePerSqft}
                  onChange={(e) => setCeilingPricePerSqft(e.target.value)}
                />
              </label>

              <label>
                <span>Baseboard ($/LF)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="dim-input"
                  value={baseboardPricePerLf}
                  onChange={(e) => setBaseboardPricePerLf(e.target.value)}
                />
              </label>

              <label>
                <span>Door Price ($)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  className="dim-input"
                  value={doorPrice}
                  onChange={(e) => setDoorPrice(e.target.value)}
                />
              </label>

              <label>
                <span>Paint Grade (SW)</span>
                <select
                  className="dim-input"
                  value={paintGrade}
                  onChange={(e) => setPaintGrade(e.target.value)}
                >
                  {PAINT_GRADE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        <form className="paint-calculator-form" onSubmit={(e) => e.preventDefault()}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={areas.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
          {areas.length === 0 ? (
            <EmptyState />
          ) : (
            areas.map((area) => {
              const calc = perAreaById.get(area.id) ?? EMPTY_CALC;

              return (
              <SortableAreaCard
                key={area.id}
                id={area.id}               // 👈 REQUIRED
                area={area}
                calc={calc}
                onToggle={() => toggleArea(area.id)}
                onRemove={() => removeArea(area.id)}
                onUpdate={(key, value) => updateArea(area.id, key, value)}
                fmt={fmt}
                fmtMoney={fmtMoney}
                fmtDollar={fmtDollar}
                fmtHours={fmtHours}
              />
              );
            })
          )}
          </SortableContext>
          </DndContext>

          <button type="button" onClick={addArea} className="add-area-btn add">
            + Add Area
          </button>

          <SummarySticky
            showSummary={showSummary}
            setShowSummary={setShowSummary}
            grandTotal={grandTotal}
            totalJobHours={totalJobHours}
            totalJobGallons={totalJobGallons}
            paintGrade={paintGrade}
            totalPaintMaterialCost={totalPaintMaterialCost}
            fmtMoney={fmtMoney}
            fmtHours={fmtHours}
          />
        </form> */}

        </> ) : (
          <div className="jobtype-card">
            <ExteriorEstimator/>

            <button type="button" className="add-area-btn add" onClick={() => chooseJobType("interior")}>
              Switch to Interior
            </button>
          </div>
        )}

      </div>
    </div>
    </section>
  );
};

export default Estimator;
