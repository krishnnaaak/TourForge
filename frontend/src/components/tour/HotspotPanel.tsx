import React, { useState } from "react";
import type { Hotspot } from "../../types";
import useHotspotPoller from "../../hooks/useHotspotPoller";
import api from "../../services/api";

interface Props {
  hotspot: Hotspot;
  onClose: () => void;
  onUpdated: (h: Hotspot) => void;
  onDeleted: (id: string) => void;
  className?: string;
}

const StatusBadge: React.FC<{ status: Hotspot["status"]; retryCount: number }> = ({ status, retryCount }) => {
  const config = {
    pending: { label: "Ready to generate", color: "#6b7280", bg: "#f3f4f6" },
    processing: retryCount > 0
      ? { label: `Retry ${retryCount}/3`, color: "#d97706", bg: "#fffbeb" }
      : { label: "Generating AI description...", color: "#d97706", bg: "#fffbeb" },
    completed: { label: "Complete", color: "#059669", bg: "#ecfdf5" },
    failed: { label: "Used fallback response", color: "#dc2626", bg: "#fef2f2" },
  }[status];

  return (
    <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: config.bg, color: config.color, fontWeight: 500 }}>
      {status === "processing" && (
        <span style={{ marginRight: 6, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
      )}
      {config.label}
    </span>
  );
};

const HotspotPanel: React.FC<Props> = ({ hotspot: initial, onClose, onUpdated, onDeleted, className }) => {
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "accessibility" | "sales">("description");

  const { hotspot: polled } = useHotspotPoller(initial._id, initial.status);
  const hotspot = polled || initial;

  React.useEffect(() => {
    if (polled) onUpdated(polled);
  }, [polled, onUpdated]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/hotspots/${hotspot._id}/generate`);
      onUpdated(res.data.hotspot);
    } catch (err) {
      console.error("Generate failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete hotspot "${hotspot.label}"?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/hotspots/${hotspot._id}`);
      onDeleted(hotspot._id);
      onClose();
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  };

  const isActive = hotspot.status === "processing";
  const hasContent = hotspot.status === "completed" || hotspot.status === "failed";

  return (
    <div className={className} style={{ position: "fixed", right: 0, top: 0, height: "100vh", background: "white", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", zIndex: 50 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{hotspot.label}</h3>
          <div style={{ marginTop: 6 }}>
            <StatusBadge status={hotspot.status} retryCount={hotspot.retryCount} />
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280", padding: "4px 8px" }}>×</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {!hasContent && !isActive && (
          <div style={{ textAlign: "center", paddingTop: 40, color: "#6b7280" }}>
            <p style={{ fontSize: 14, marginBottom: 16 }}>Click generate to create AI descriptions for this hotspot.</p>
            {hotspot.userContext && (
              <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, fontSize: 13, textAlign: "left", marginBottom: 16 }}>
                <strong>Your context:</strong>
                <p style={{ margin: "4px 0 0", color: "#374151" }}>{hotspot.userContext}</p>
              </div>
            )}
          </div>
        )}

        {isActive && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
            <p style={{ fontSize: 14 }}>
              {hotspot.retryCount > 0
                ? `AI retry in progress (attempt ${hotspot.retryCount + 1}/3)...`
                : "Generating content with Groq AI..."}
            </p>
            {hotspot.retryCount > 0 && (
              <p style={{ fontSize: 12, color: "#9ca3af" }}>Retrying with exponential backoff.</p>
            )}
          </div>
        )}

        {hasContent && (
          <>
            {hotspot.status === "failed" && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 10, fontSize: 12, color: "#b91c1c", marginBottom: 16 }}>
                AI generation failed after 3 attempts. Showing a fallback response. You can try regenerating.
              </div>
            )}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#f3f4f6", borderRadius: 8, padding: 4 }}>
              {(["description", "accessibility", "sales"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ flex: 1, padding: "6px 4px", fontSize: 12, border: "none", borderRadius: 6, cursor: "pointer", background: activeTab === tab ? "white" : "transparent", color: activeTab === tab ? "#111827" : "#6b7280", fontWeight: activeTab === tab ? 600 : 400, boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}
                >
                  {tab === "description" ? "Description" : tab === "accessibility" ? "Access." : "Sales"}
                </button>
              ))}
            </div>
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.6, color: "#374151" }}>
              {activeTab === "description" && hotspot.description}
              {activeTab === "accessibility" && hotspot.accessibilityNotes}
              {activeTab === "sales" && hotspot.salesCopy}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: 16, borderTop: "1px solid #e5e7eb", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={handleGenerate}
          disabled={generating || isActive}
          style={{ width: "100%", padding: "10px 0", background: isActive ? "#d1d5db" : "#111827", color: "white", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: isActive ? "not-allowed" : "pointer", transition: "background 0.2s" }}
        >
          {isActive ? "Generating..." : hasContent ? "Regenerate" : "Generate AI Content"}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ width: "100%", padding: "8px 0", background: "none", border: "1px solid #fecaca", borderRadius: 8, color: "#ef4444", fontSize: 13, cursor: deleting ? "not-allowed" : "pointer" }}
        >
          {deleting ? "Deleting..." : "Delete hotspot"}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default HotspotPanel;