import React, { useMemo, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";

const money = (n) =>
  (Number(n || 0) || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });

function safeNumber(v) {
  const x = typeof v === "string" ? v.replace(/[^0-9.]/g, "") : v;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

export default function HandymanEstimator({ customer }) {
  const [items, setItems] = useState([
    { id: crypto.randomUUID?.() || String(Date.now()), desc: "", price: "" },
  ]);

  const grandTotal = useMemo(
    () => items.reduce((sum, it) => sum + safeNumber(it.price), 0),
    [items]
  );

  const canCreate = useMemo(() => {
    const hasCustomer =
      customer?.firstName?.trim() && customer?.lastName?.trim() && customer?.address?.trim();

    const hasValidLine = items.some((it) => it.desc.trim() && safeNumber(it.price) > 0);

    return !!hasCustomer && hasValidLine && grandTotal > 0;
  }, [customer, items, grandTotal]);

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID?.() || String(Date.now() + Math.random()), desc: "", price: "" },
    ]);
  };

  const removeRow = (id) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((x) => x.id !== id)));
  };

  const updateRow = (id, patch) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

    const createQuote = async () => {
    if (!canCreate) return;

    const lineItems = items
        .map((it) => ({
        description: it.desc.trim(),
        price: safeNumber(it.price),
        }))
        .filter((it) => it.description && it.price > 0);

    const payload = {
        jobType: "handyman",
        customer,
        lineItems,
        grandTotal,
        companyName: "Brushline Services",
        validForDays: 30,
        note: "Thanks for the opportunity — looking forward to helping with this project!",
    };

    const user = netlifyIdentity.currentUser();
    const token = user ? await user.jwt() : null; // ✅ same as InteriorEstimator

    if (!token) {
        alert("You must be logged in to create a quote.");
        return;
    }

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

    window.location.href = data.url;
    };

  return (
    <div style={{ width: "100%" }}>
      <h2 style={{ marginBottom: 6 }}>Handyman / Misc Estimate</h2>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Add each task and price. Total updates automatically.
      </p>

      <div style={{ border: "1px solid rgba(15,23,42,.12)", borderRadius: 12, padding: 12 }}>
        {items.map((it, idx) => (
          <div
            key={it.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 44px",
              gap: 10,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <input
              type="text"
              value={it.desc}
              placeholder={`Item ${idx + 1} (e.g., Install ceiling fan)`}
              onChange={(e) => updateRow(it.id, { desc: e.target.value })}
              className="dim-input"
            />

            <input
              type="text"
              value={it.price}
              placeholder="$0.00"
              inputMode="decimal"
              onChange={(e) => updateRow(it.id, { price: e.target.value })}
              className="dim-input"
            />

            <button
              type="button"
              onClick={() => removeRow(it.id)}
              title="Remove"
              style={{
                height: 42,
                borderRadius: 10,
                border: "1px solid rgba(15,23,42,.18)",
                background: "white",
                cursor: "pointer",
              }}
              disabled={items.length === 1}
            >
              ✕
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
          <button type="button" className="add-area-btn" onClick={addRow}>
            + Add item
          </button>

          <div style={{ marginLeft: "auto", fontWeight: 800 }}>
            Total: {money(grandTotal)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
        <button
          type="button"
          className="add-area-btn add"
          onClick={createQuote}
          disabled={!canCreate}
          style={{ opacity: canCreate ? 1 : 0.6 }}
        >
          Create Quote
        </button>
      </div>
    </div>
  );
}