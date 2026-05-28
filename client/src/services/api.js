const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── generateBlueprint ────────────────────────────────────────
export async function generateBlueprint(prompt) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
  } catch {
    throw new Error("Failed to connect to backend server.");
  }

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error || `Server error (${response.status}). Please try again.`);
  }
  return json.data;
}

// ─── downloadDocx ─────────────────────────────────────────────
// Sends ProjectData to server → receives .docx → triggers browser download
export async function downloadDocx(projectData) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/generate/docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectData),
    });
  } catch {
    throw new Error("Cannot reach the server. Make sure the backend is running.");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate document.");
  }

  // Get filename from Content-Disposition header if available
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : "project_blueprint.docx";

  // Trigger browser download
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── checkHealth ──────────────────────────────────────────────
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}