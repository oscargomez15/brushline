import React, { useEffect, useMemo, useState } from "react";
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

function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDimension = 1400;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this photo."));
    };
    image.src = objectUrl;
  });
}

export default function HandymanEstimator({
  customer,
  initialQuote = null,
  mode = "create",
  onSaved,
  quoteJobType = "handyman",
  heading = "Handyman / Misc Estimate",
  itemExample = "Interior Painting",
  onDraftChange,
}) {
  const activeCustomer = customer || initialQuote?.customer || null;

  const [items, setItems] = useState(() => {
    if (initialQuote?.lineItems?.length) {
      return initialQuote.lineItems.map((it) => ({
        id: makeId(),
        title: it.title || "",
        desc: it.description || "",
        price: String(it.price ?? ""),
        photos: Array.isArray(it.photos) ? it.photos : [],
      }));
    }

    return [{ id: makeId(), title: "", desc: "", price: "", photos: [] }];
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    if (!onDraftChange || mode === "edit") return;
    const timeout = setTimeout(() => {
      onDraftChange({
        jobType: quoteJobType,
        customer: activeCustomer,
        lineItems: items.map((item) => ({
          title: item.title,
          description: item.desc,
          price: item.price,
          photos: item.photos,
        })),
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [activeCustomer, items, mode, onDraftChange, quoteJobType]);

  const pendingDeleteItem =
    items.find((item) => item.id === pendingDeleteId) || null;

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
      { id: makeId(), title: "", desc: "", price: "", photos: [] },
    ]);
  };

  const confirmRemoveRow = () => {
    if (!pendingDeleteId) return;

    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((x) => x.id !== pendingDeleteId)
    );
    setPendingDeleteId(null);
  };

  const updateRow = (id, patch) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const addPhotos = async (item, files) => {
    const remainingSlots = Math.max(0, 3 - (item.photos?.length || 0));
    const selected = Array.from(files || []).slice(0, remainingSlots);
    if (!selected.length) return;

    try {
      setUploadingPhotoId(item.id);
      const user = netlifyIdentity.currentUser();
      const token = user ? await user.jwt() : null;
      if (!token) throw new Error("You must be logged in.");

      const uploaded = [];
      for (const file of selected) {
        const dataUrl = await compressPhoto(file);
        const response = await fetch("/.netlify/functions/upload-estimate-photo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ dataUrl }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Failed to upload photo.");
        uploaded.push({ id: data.id, url: data.url, name: file.name });
      }

      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, photos: [...(row.photos || []), ...uploaded].slice(0, 3) }
            : row
        )
      );
    } catch (error) {
      alert(error.message || "Failed to upload photo.");
    } finally {
      setUploadingPhotoId(null);
    }
  };

  const removePhoto = (itemId, photoId) => {
    setItems((prev) =>
      prev.map((row) =>
        row.id === itemId
          ? {
              ...row,
              photos: (row.photos || []).filter(
                (photo) => (photo.id || photo.url) !== photoId
              ),
            }
          : row
      )
    );
  };

  const saveQuote = async () => {
    if (!canCreate || saving) return;

  const lineItems = items
    .map((it) => ({
      title: it.title.trim(),
      description: it.desc.trim(),
      price: safeNumber(it.price),
      excluded: false,
      photos: Array.isArray(it.photos) ? it.photos : [],
    }))
    .filter((it) => it.title && it.description && it.price > 0);

    const payload = {
      jobType: quoteJobType,

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

      localStorage.removeItem("estimateDraft");
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
    <div className="quick-estimator">
      <div className="quick-estimator-heading">
      <div className="quick-estimator-kicker">Quick Line Items</div>
      <h2>
        {mode === "edit" ? `Edit ${heading}` : heading}
      </h2>

      <p>
        Build a clear scope of work with a fixed price for each item.
      </p>
      </div>

      <div
        className="quick-items-panel"
      >
      <div className="quick-items-panel-head">
        <div>
          <h3>Work Items</h3>
          <p>{items.length} {items.length === 1 ? "item" : "items"} in this estimate</p>
        </div>
      </div>
      {items.map((it, idx) => (
        <div
          key={it.id}
          className="handyman-item-row quick-item-card"
        >
          <div className="handyman-item-main">
            <div className="quick-item-field">
              <label htmlFor={`item-title-${it.id}`}>Work title</label>
              <input
                id={`item-title-${it.id}`}
                type="text"
                value={it.title}
                placeholder={`e.g., ${itemExample}`}
                onChange={(e) => updateRow(it.id, { title: e.target.value })}
                className="dim-input handyman-title-input"
              />
            </div>

            <div className="quick-item-field">
              <label htmlFor={`item-description-${it.id}`}>Description of work</label>
              <textarea
                id={`item-description-${it.id}`}
                value={it.desc}
                placeholder="Describe the work, materials, and what is included"
                onChange={(e) => updateRow(it.id, { desc: e.target.value })}
                className="dim-input handyman-description-input"
                rows={3}
              />
            </div>

            <div className="quick-item-photos">
              {(it.photos || []).map((photo) => (
                <div className="quick-item-photo" key={photo.id || photo.url}>
                  <img src={photo.url} alt={photo.name || `${it.title || "Work item"} reference`} />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => removePhoto(it.id, photo.id || photo.url)}
                  >
                    ×
                  </button>
                </div>
              ))}

              {(it.photos?.length || 0) < 3 && (
                <label className="quick-photo-upload">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                      addPhotos(it, event.target.files);
                      event.target.value = "";
                    }}
                    disabled={uploadingPhotoId === it.id}
                  />
                  <span>{uploadingPhotoId === it.id ? "Uploading..." : "+ Add photos"}</span>
                  <small>Up to 3</small>
                </label>
              )}
            </div>

          </div>

          <div className="quick-item-field quick-item-price-field">
            <label htmlFor={`item-price-${it.id}`}>Price</label>
            <div className="quick-price-control">
              <span aria-hidden="true">$</span>
              <input
                id={`item-price-${it.id}`}
                type="text"
                value={it.price}
                placeholder="0.00"
                inputMode="decimal"
                onChange={(e) => updateRow(it.id, { price: e.target.value })}
                className="dim-input handyman-price-input"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPendingDeleteId(it.id)}
            title="Remove item"
            aria-label={`Remove ${it.title.trim() || `item ${idx + 1}`}`}
            className="handyman-remove-btn"
            disabled={items.length === 1}
          >
            ✕
          </button>
        </div>
      ))}

        <div className="quick-items-footer">
          <button type="button" className="quick-add-item-btn" onClick={addRow}>
            + Add item
          </button>

          <div className="quick-estimate-total">
            <span>Estimate total</span>
            <strong>{money(grandTotal)}</strong>
          </div>
        </div>
      </div>

      <div className="quick-estimator-actions">
        <button
          type="button"
          className="quick-create-btn"
          onClick={saveQuote}
          disabled={!canCreate || saving}
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

      {pendingDeleteItem && (
        <div
          className="handyman-delete-overlay"
          onMouseDown={() => setPendingDeleteId(null)}
        >
          <div
            className="handyman-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="handyman-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="handyman-delete-icon" aria-hidden="true">×</div>
            <h3 id="handyman-delete-title">Remove this item?</h3>
            <p>
              <strong>{pendingDeleteItem.title.trim() || "Untitled item"}</strong>{" "}
              will be removed from this estimate. This cannot be undone.
            </p>
            <div className="handyman-delete-actions">
              <button
                type="button"
                className="handyman-delete-cancel"
                onClick={() => setPendingDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="handyman-delete-confirm"
                onClick={confirmRemoveRow}
                autoFocus
              >
                Remove Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
