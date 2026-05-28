import React, { useMemo, useState } from "react";
import netlifyIdentity from "netlify-identity-widget";

const money = (n) =>
  (Number(n || 0) || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

function safeNumber(v) {
  const x = typeof v === "string" ? v.replace(/[^0-9.]/g, "") : v;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function makeId() {
  return crypto.randomUUID?.() || String(Date.now() + Math.random());
}

export default function HandymanEstimator({
  customer,
  initialQuote = null,
  mode = "create",
  onSaved,
}) {
  const activeCustomer = customer || initialQuote?.customer || null;

  const [items, setItems] = useState(() => {
    if (initialQuote?.lineItems?.length) {
      return initialQuote.lineItems.map((it) => ({
        id: makeId(),
        title: it.title || "",
        desc: it.description || "",
        price: String(it.price ?? ""),
      }));
    }

    return [{ id: makeId(), title: "", desc: "", price: "" }];
  });

  const [saving, setSaving] = useState(false);

  const grandTotal = useMemo(
    () => items.reduce((sum, it) => sum + safeNumber(it.price), 0),
    [items]
  );

  const canCreate = useMemo(() => {
    const hasCustomer =
      activeCustomer?.firstName?.trim() &&
      activeCustomer?.lastName?.trim() &&
      activeCustomer?.address?.trim();

  const hasValidLine = items.some(
    (it) => it.title.trim() && it.desc.trim() && safeNumber(it.price) > 0
  );

    return !!hasCustomer && hasValidLine && grandTotal > 0;
  }, [activeCustomer, items, grandTotal]);

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { id: makeId(), title: "", desc: "", price: "" },
    ]);
  };

  const removeRow = (id) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((x) => x.id !== id)));
  };

  const updateRow = (id, patch) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const saveQuote = async () => {
    if (!canCreate || saving) return;

  const lineItems = items
    .map((it) => ({
      title: it.title.trim(),
      description: it.desc.trim(),
      price: safeNumber(it.price),
      excluded: false,
    }))
    .filter((it) => it.title && it.description && it.price > 0);

    const payload = {
      jobType: "handyman",

      customerId: activeCustomer?.customerId || initialQuote?.customerId || null,
      customer: {
        firstName: activeCustomer?.firstName || "",
        lastName: activeCustomer?.lastName || "",
        address: activeCustomer?.address || "",
        unit: activeCustomer?.unit || "",
        email: activeCustomer?.email || "",
        phone: activeCustomer?.phone || "",
      },

      lineItems,
      grandTotal,
      companyName: initialQuote?.companyName || "Brushline Services",
      validForDays: initialQuote?.validForDays || 30,
      note:
        initialQuote?.note ||
        "Thanks for the opportunity — looking forward to helping with this project!",
    };

    const user = netlifyIdentity.currentUser();
    const token = user ? await user.jwt() : null;

    if (!token) {
      alert("You must be logged in.");
      return;
    }

    try {
      setSaving(true);

    if (mode === "edit" && initialQuote?.id) {
    const res = await fetch("/.netlify/functions/update-quote", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
        id: initialQuote.id,
        ...payload,
        }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data?.error || "Failed to update quote");
    }

    localStorage.removeItem("editingQuoteId");
    localStorage.removeItem("editingQuoteData");

    if (onSaved) {
        onSaved(data);
    } else {
        window.location.href = data?.url || `/quote/${initialQuote.id}`;
    }

    return;
    }

      const res = await fetch("/.netlify/functions/create-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create quote");
      }

      window.location.href = data.url;
      localStorage.removeItem("editingQuoteId");
      localStorage.removeItem("editingQuoteData");
      
    } catch (err) {
      alert(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <h2 style={{ marginBottom: 6 }}>
        {mode === "edit" ? "Edit Handyman Estimate" : "Handyman / Misc Estimate"}
      </h2>

      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Add each task and price. Total updates automatically.
      </p>

      <div
        style={{
          border: "1px solid rgba(15,23,42,.12)",
          borderRadius: 12,
          padding: 12,
        }}
      >
      {items.map((it, idx) => (
        <div
          key={it.id}
          className="handyman-item-row"
        >
          <div className="handyman-item-main">

            <input
              type="text"
              value={it.title}
              placeholder={`Title ${idx + 1} (e.g., Interior Painting)`}
              onChange={(e) => updateRow(it.id, { title: e.target.value })}
              className="dim-input handyman-title-input"
            />

            <textarea
              value={it.desc}
              placeholder="Description of work"
              onChange={(e) => updateRow(it.id, { desc: e.target.value })}
              className="dim-input handyman-description-input"
              rows={3}
            />

          </div>

          <input
            type="text"
            value={it.price}
            placeholder="$0.00"
            inputMode="decimal"
            onChange={(e) => updateRow(it.id, { price: e.target.value })}
            className="dim-input handyman-price-input"
          />

          <button
            type="button"
            onClick={() => removeRow(it.id)}
            title="Remove"
            className="handyman-remove-btn"
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
          onClick={saveQuote}
          disabled={!canCreate || saving}
          style={{ opacity: canCreate && !saving ? 1 : 0.6 }}
        >
          {saving
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
            ? "Save Changes"
            : "Create Quote"}
        </button>
      </div>
    </div>
  );
}