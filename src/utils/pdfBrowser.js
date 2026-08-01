export async function fetchPdf(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `Failed to prepare PDF (${response.status})`);
  }
  const blob = await response.blob();
  if (!blob.size) throw new Error("The PDF was empty. Please try again.");
  return blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
}

export function downloadPdfBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Mobile browsers may not consume the blob until after the click handler returns.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
}
