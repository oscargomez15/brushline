import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";
import "../../Styling/CustomersList.css";

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function CustomersList() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [err, setErr] = useState("");

  const loadCustomers = async (search = "") => {
    try {
      if (search) setSearching(true);
      else setLoading(true);

      setErr("");

      const user = netlifyIdentity.currentUser();
      const jwt = user ? await user.jwt() : null;

      if (!jwt) {
        throw new Error("You must be logged in.");
      }

      const url = new URL("/.netlify/functions/list-customers", window.location.origin);
      if (search.trim()) {
        url.searchParams.set("q", search.trim());
      }
      url.searchParams.set("limit", "100");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load customers");

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setErr(e.message || "Failed to load customers");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    loadCustomers("");
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadCustomers(q);
    }, 250);

    return () => clearTimeout(t);
  }, [q]);

  const rows = useMemo(() => items, [items]);

  const handleUseCustomer = (customer) => {
    localStorage.setItem(
      "estimateCustomer",
      JSON.stringify({
        customerId: customer.id || "",
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        address: customer.address || "",
        unit: customer.unit || "",
        email: customer.email || "",
        phone: customer.phone || "",
      })
    );

    localStorage.setItem("estimateStep", "jobType");
    navigate("/estimator");
  };

  if (loading) {
    return <div className="customers-page">Loading customers…</div>;
  }

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1 className="customers-title">Customers</h1>
          <p className="customers-subtitle">
            View and search saved customers for faster quote creation.
          </p>
        </div>

        <button
          type="button"
          className="customers-primary-btn"
          onClick={() => navigate("/estimates/create")}
        >
          New Estimate
        </button>
      </div>

      <div className="customers-toolbar">
        <input
          type="text"
          className="customers-search"
          placeholder="Search by name, email, phone, or address..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {err ? <div className="customers-error">Error: {err}</div> : null}

      <div className="customers-card">
        <div className="customers-table-wrap">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Address</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Last Updated</th>
                <th className="right">Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="customers-empty">
                    {searching ? "Searching..." : "No customers found."}
                  </td>
                </tr>
              ) : (
                rows.map((customer) => {
                  const initial =
                    customer?.fullName?.trim()?.[0]?.toUpperCase() ||
                    customer?.firstName?.trim()?.[0]?.toUpperCase() ||
                    "?";

                  const fullName =
                    customer.fullName ||
                    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
                    "Unnamed Customer";

                  const fullAddress = customer.unit
                    ? `${customer.address || "—"}, ${customer.unit}`
                    : customer.address || "—";

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="customers-person">
                          <div className="customers-avatar">{initial}</div>
                          <div className="customers-person-meta">
                            <div className="customers-name">{fullName}</div>
                            <div className="customers-id">{customer.id}</div>
                          </div>
                        </div>
                      </td>

                      <td>{fullAddress}</td>
                      <td>{customer.email || "—"}</td>
                      <td>{customer.phone || "—"}</td>
                      <td>{fmtDate(customer.updatedAt || customer.createdAt)}</td>

                      <td className="right">
                        <button
                          type="button"
                          className="customers-use-btn"
                          onClick={() => handleUseCustomer(customer)}
                        >
                          Use for Quote
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}