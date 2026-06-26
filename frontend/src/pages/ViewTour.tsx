import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Tour, Hotspot } from "../types";
const BASE = import.meta.env.VITE_API_URL || "";

const ViewTour: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedImage, setSelectedImage] = useState<{ _id: string; url: string; label: string } | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BASE}/api/tours/public/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        setTour(data.tour);
        setHotspots(data.hotspots);
        if (data.tour.images.length > 0) setSelectedImage(data.tour.images[0]);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load tour."); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f" }}>
      <p style={{ color: "#9ca3af" }}>Loading tour...</p>
    </div>
  );

  if (error || !tour) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0f0f" }}>
      <p style={{ color: "#ef4444" }}>{error || "Tour not found."}</p>
    </div>
  );

  const imageHotspots = hotspots.filter(h => h.imageId === selectedImage?._id);

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f0f", color: "white", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{tour.title}</h1>
          <span style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{tour.niche?.replace("-", " ")}</span>
        </div>
        <span style={{ fontSize: 11, color: "#4b5563", background: "#1a1a1a", padding: "4px 10px", borderRadius: 20 }}>
          TourForge
        </span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Image thumbnails sidebar */}
        <div style={{ width: 100, background: "#141414", borderRight: "1px solid #1f1f1f", overflowY: "auto", flexShrink: 0 }}>
          {tour.images.map((img) => (
            <div
              key={img._id}
              onClick={() => { setSelectedImage(img); setActiveHotspot(null); }}
              style={{ padding: 6, cursor: "pointer", borderLeft: selectedImage?._id === img._id ? "2px solid #6366f1" : "2px solid transparent", background: selectedImage?._id === img._id ? "#1e1e2e" : "transparent" }}
            >
              <img src={img.url} alt={img.label} style={{ width: "100%", height: 60, objectFit: "cover", borderRadius: 4 }} />
              <p style={{ margin: "4px 0 0", fontSize: 9, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {img.label || "Room"}
              </p>
            </div>
          ))}
        </div>

        {/* Main image with hotspots */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "auto" }}>
          {selectedImage && (
            <div style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
              <img
                src={selectedImage.url}
                alt={selectedImage.label}
                style={{ display: "block", maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 8 }}
              />
              {imageHotspots.map((h) => (
                <div
                  key={h._id}
                  onClick={() => setActiveHotspot(activeHotspot?._id === h._id ? null : h)}
                  style={{ position: "absolute", left: `${h.x}%`, top: `${h.y}%`, transform: "translate(-50%, -50%)", cursor: "pointer", zIndex: 10 }}
                >
                  {/* Pulse ring */}
                  <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid #6366f1", opacity: 0.5, animation: "ping 1.5s ease-in-out infinite" }} />
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: activeHotspot?._id === h._id ? "#6366f1" : "#4f46e5", border: "2px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
                  </div>
                  {/* Label */}
                  <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.85)", color: "white", fontSize: 10, padding: "2px 7px", borderRadius: 4, whiteSpace: "nowrap", pointerEvents: "none" }}>
                    {h.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hotspot info panel */}
        {activeHotspot && (
          <div style={{ width: 300, background: "#141414", borderLeft: "1px solid #1f1f1f", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #1f1f1f", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{activeHotspot.label}</h3>
              <button onClick={() => setActiveHotspot(null)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: 18, flex: 1, overflowY: "auto" }}>
              {activeHotspot.description && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.06em" }}>About</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>{activeHotspot.description}</p>
                </div>
              )}
              {activeHotspot.salesCopy && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.06em" }}>Highlights</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>{activeHotspot.salesCopy}</p>
                </div>
              )}
              {activeHotspot.accessibilityNotes && (
                <div>
                  <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Accessibility</p>
                  <p style={{ margin: 0, fontSize: 13, color: "#d1d5db", lineHeight: 1.6 }}>{activeHotspot.accessibilityNotes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes ping { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.6);opacity:0} }`}</style>
    </div>
  );
};

export default ViewTour;