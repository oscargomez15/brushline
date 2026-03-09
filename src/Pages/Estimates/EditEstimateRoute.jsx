import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import netlifyIdentity from "netlify-identity-widget";

export default function EditEstimateRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [err, setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const user = netlifyIdentity.currentUser();
        const jwt = user ? await user.jwt() : null;
        if (!jwt) throw new Error("You must be logged in.");

        const res = await fetch(`/.netlify/functions/get-quote?id=${encodeURIComponent(id)}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load quote");

        const quote = data?.quote ?? data;

        localStorage.setItem("editingQuoteId", quote.id);
        localStorage.setItem("estimateCustomer", JSON.stringify({
          customerId: quote.customerId || "",
          firstName: quote.customer?.firstName || "",
          lastName: quote.customer?.lastName || "",
          address: quote.customer?.address || "",
          unit: quote.customer?.unit || "",
          email: quote.customer?.email || "",
          phone: quote.customer?.phone || "",
        }));

        localStorage.setItem("editingQuoteId", quote.id);

        localStorage.setItem(
        "estimateCustomer",
        JSON.stringify({
            customerId: quote.customerId || "",
            firstName: quote.customer?.firstName || "",
            lastName: quote.customer?.lastName || "",
            address: quote.customer?.address || "",
            unit: quote.customer?.unit || "",
            email: quote.customer?.email || "",
            phone: quote.customer?.phone || "",
        })
        );

        localStorage.setItem("jobType", quote.jobType || "");
        localStorage.setItem("editingQuoteData", JSON.stringify(quote));
        localStorage.setItem("estimateStep", "calculator");

        console.log("quote loaded in EditEstimateRoute:", quote);
        console.log("quote estimatorData:", quote?.estimatorData);
        console.log("quote areas:", quote?.estimatorData?.areas);

        localStorage.setItem("editingQuoteData", JSON.stringify(quote));

        console.log(
        "editingQuoteData saved to localStorage:",
        localStorage.getItem("editingQuoteData")
        );

        navigate("/estimator", {
        replace: true,
        state: { editingQuoteData: quote },
        });
      } catch (e) {
        setErr(e.message);
      }
    };

    run();
  }, [id, navigate]);

  return <div>{err ? `Error: ${err}` : "Loading quote..."}</div>;
}