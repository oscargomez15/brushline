import React, { useMemo, useState } from "react";
import SortableAreaCard from "./SortableAreaCard";

import netlifyIdentity from "netlify-identity-widget";
import { useNavigate } from "react-router-dom";


import { PAINT_GRADE_OPTIONS } from "../constants";
import { computeAreaCalc, computeJobTotals, EMPTY_CALC } from "../calc";
import { fmt, fmtMoney, fmtDollar, fmtHours } from "../format";

import EmptyState from "./EmptyState";
import SummarySticky from "./SummarySticky";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

  const reorderById = (items, activeId, overId) => {
  const oldIndex = items.findIndex((i) => i.id === activeId);
  const newIndex = items.findIndex((i) => i.id === overId);
  if (oldIndex === -1 || newIndex === -1) return items;

  const next = [...items];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next;
};

export const InteriorEstimator = ({customer}) => {
    const navigate = useNavigate();

    // --- Pricing inputs (strings kept raw; parsed inside calc)
      const [wallPricePerSqft, setWallPricePerSqft] = useState("1.25");
      const [ceilingPricePerSqft, setCeilingPricePerSqft] = useState("1.25");
      const [doorPrice, setDoorPrice] = useState("100");
      const [baseboardPricePerLf, setBaseboardPricePerLf] = useState("1.25");

      // Paint grade
      const [paintGrade, setPaintGrade] = useState("promar200");

      // Summary collapse
      const [showSummary, setShowSummary] = useState(false);

      // Areas (start empty — no default area)
      const [areas, setAreas] = useState([]);

      // Simple id helper (CRA-safe)
      const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const createArea = () => ({
        id: uid(),
        name: "",
        length: "",
        width: "",
        height: "",
        furnitureMove: false,
        collapsed: false,

        // doors
        doorCount: "0",
        doorWidthIn: "36",
        doorHeightIn: "80",
    
        // baseboard
        baseboardHeightChoice: "5.25",
        baseboardHeightCustomIn: "",
    
        // scope defaults (match what you had)
        paintWalls: true,
        paintCeiling: true,
        paintDoors: false,
        paintBaseboard: false,

        addons: [],
      });
    
      const addArea = () => {
      setAreas((prev) => [...prev, createArea()]);
    };
      const removeArea = (id) => setAreas((prev) => prev.filter((a) => a.id !== id));
      const updateArea = (id, key, value) =>
        setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, [key]: value } : a)));
      const toggleArea = (id) =>
        setAreas((prev) =>
          prev.map((a) => (a.id === id ? { ...a, collapsed: !a.collapsed } : a))
        );
    
      // Pricing object passed into calc engine
     const pricing = useMemo(
      () => ({
        wallRate: parseFloat(wallPricePerSqft) || 0,
        ceilingRate: parseFloat(ceilingPricePerSqft) || 0,
        doorRate: parseFloat(doorPrice) || 0,
        baseboardRate: parseFloat(baseboardPricePerLf) || 0,
      }),
      [wallPricePerSqft, ceilingPricePerSqft, doorPrice, baseboardPricePerLf]
    );
    
      // Per-area calculations (pure)
      const perArea = useMemo(
        () => areas.map((a) => computeAreaCalc(a, pricing)),
        [areas, pricing]
      );
    
      // O(1) lookup by id in render
      const perAreaById = useMemo(() => {
        const m = new Map();
        perArea.forEach((c) => m.set(c.id, c));
        return m;
      }, [perArea]);
    
      // Paint price per gallon from selected grade
      const paintPricePerGallon = useMemo(() => {
        return PAINT_GRADE_OPTIONS.find((g) => g.value === paintGrade)?.pricePerGallon || 0;
      }, [paintGrade]);
    
      // Job totals
        const { grandTotal, totalJobHours, totalJobGallons, totalPaintMaterialCost } = useMemo(
        () => computeJobTotals(perArea, paintPricePerGallon),
        [perArea, paintPricePerGallon]
        );
    
      const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );
    
    const handleDragEnd = (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
    
      setAreas((prev) => reorderById(prev, active.id, over.id));
    };

function detectPackageKey(areas) {
  const hasWalls = areas.some((a) => a.paintWalls);
  const hasCeilings = areas.some((a) => a.paintCeiling);
  const hasBaseboards = areas.some((a) => a.paintBaseboard);
  const hasDoors = areas.some((a) => a.paintDoors);

  if (hasWalls && hasCeilings && hasBaseboards && hasDoors) return "full";
  if (hasWalls && hasCeilings && !hasBaseboards && !hasDoors) return "walls_ceilings";
  if (hasWalls && !hasCeilings && !hasBaseboards && !hasDoors) return "walls_only";

  return "custom";
}

  const applyPackageToAreas = (areas, key) => {
    return areas.map((a) => {
      if (key === "walls_only") {
        return { ...a, paintWalls: true, paintCeiling: false, paintBaseboard: false, paintDoors: false };
      }
      if (key === "walls_ceilings") {
        return { ...a, paintWalls: true, paintCeiling: true, paintBaseboard: false, paintDoors: false };
      }
      // full
      return { ...a, paintWalls: true, paintCeiling: true, paintBaseboard: true, paintDoors: true };
    });
  };

  // Uses YOUR existing calc functions (computeAreaCalc + computeJobTotals)
  const computeGrandTotalForAreas = (areasVariant) => {
    const perAreaVariant = areasVariant.map((a) => computeAreaCalc(a, pricing));
    const totals = computeJobTotals(perAreaVariant, paintPricePerGallon);
    return totals.grandTotal;
  };

  const buildScopeItems = (areas) => {
    return areas.map((a, idx) => {
      const areaName = (a.name || "").trim() || `Area ${idx + 1}`;

      const scope = [];

      if (a.paintWalls) scope.push("Walls");
      if (a.paintCeiling) scope.push("Ceilings");
      if (a.paintDoors) scope.push("Doors");
      if (a.paintBaseboard) scope.push("Baseboards");

      const extras = (a.addons || [])
      .filter(x => (x.label || "").trim())
      .map(x => ({
        label: x.label.trim(),
        price: Number(x.price) || 0,
      }));


      return {
        areaId: a.id,
        areaName,
        scope, // array of strings
        extras,
      };
    });
  };

  const selectedPackageKey = detectPackageKey(areas);
  const upgradesNeedDoors = selectedPackageKey !== "full";
  const upgradesNeedBaseboards = selectedPackageKey !== "full";

  const handleGenerateQuote = async () => {
    const user = netlifyIdentity.currentUser();
    const token = user ? await user.jwt() : null;

  if (!token) {
    alert("You must be logged in to generate a quote.");
    return;
  }
  const scopeItems = buildScopeItems(areas);

  const packageDefs = [
    { key: "walls_only", label: "Walls Only" },
    { key: "walls_ceilings", label: "Walls + Ceilings" },
    { key: "full", label: "Walls + Ceilings + Baseboards + Doors" },
  ];

  const scopePackages = packageDefs.map((p) => {
    const areasForPkg = applyPackageToAreas(areas, p.key);
    const pkgTotal = computeGrandTotalForAreas(areasForPkg);
    return { key: p.key, label: p.label, total: pkgTotal };
  });

  // Build your payload from your existing totals
  const payload = {
    jobType: "interior",
    grandTotal,
    totalGallons: totalJobGallons,

    companyName: "Brushline Services",
    validForDays: 30,

    customerId: customer?.customerId || null,
    customer: {
      firstName: customer?.firstName || "",
      lastName: customer?.lastName || "",
      address: customer?.address || "",
      unit: customer?.unit || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
    },

    note: "Thanks for having us out — excited about this project!",
    scopeItems,

    selectedPackageKey,
    scopePackages,
  };

  const res = await fetch("/.netlify/functions/create-quote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // ✅ Identity JWT
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data?.error || "Failed to create quote");
    return;
  }

  navigate(data.url);
};

  return (
    <div>
    <h1>Interior Estimator</h1>
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
    
            {/* prevent Enter submitting */}
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
                    forceDoorInputs={upgradesNeedDoors}
                    forceBaseboardInputs={upgradesNeedBaseboards}
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
            </form>
            <button type="button" className="generate-btn add" onClick={handleGenerateQuote}>
            Generate Client Quote
            </button>
    </div>
  )
}
export default InteriorEstimator;

