const JOB_TYPE_LABELS = {
  interior: "Interior Painting",
  exterior: "Exterior Painting",
  drywall: "Drywall Installation / Repair",
  handyman: "Multiple Services",
};

export function getJobTypeLabel(value, fallback = "Service") {
  const key = String(value || "").trim().toLowerCase();
  return JOB_TYPE_LABELS[key] || (value ? String(value) : fallback);
}
