import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import type { Tour, Hotspot, TourImage } from "../types";
import api from "../services/api";
import ImageCanvas from "../components/tour/ImageCanvas";
import HotspotPanel from "../components/tour/HotspotPanel";

const responsiveStyles = `
  .tf-editor-layout { display: flex; height: calc(100vh - 52px); }
  .tf-sidebar { width: clamp(160px, 18vw, 220px); min-width: 0; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0; }
  .tf-canvas-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
  .tf-hotspot-panel { position: fixed; right: 0; top: 0; height: 100vh; width: clamp(280px, 35vw, 380px); background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.1); display: flex; flex-direction: column; z-index: 50; }
  @media (max-width: 640px) { .tf-sidebar { width: 120px; } .tf-hotspot-panel { width: 100vw; } }
`;

const TourEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [selectedImage, setSelectedImage] = useState<TourImage | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newHotspotLabel, setNewHotspotLabel] = useState("");
  const [newHotspotContext, setNewHotspotContext] = useState("");
  const [pendingPlacement, setPendingPlacement] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/tours/${id}`).then((res) => {
      setTour(res.data.tour);
      setHotspots(res.data.hotspots);
      if (res.data.tour.images.length > 0) setSelectedImage(res.data.tour.images[0]);
      setLoading(false);
    });
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !tour) return;
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    try {
      const res = await api.post(`/upload/${tour._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      const newImages: TourImage[] = res.data.images || [res.data.image];
      setTour((prev) => prev ? { ...prev, images: [...prev.images, ...newImages] } : prev);
      setSelectedImage(newImages[0]);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Upload failed. Please try again.";
      setUploadError(msg || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remove this image and all its hotspots?")) return;
    try {
      await api.delete(`/tours/${tour!._id}/images/${imageId}`);
      // Remove image from tour
      setTour((prev) => prev ? { ...prev, images: prev.images.filter(i => i._id !== imageId) } : prev);
      // Remove all hotspots for this image
      setHotspots((prev) => prev.filter(h => h.imageId !== imageId));
      // If this was the selected image, switch to first remaining
      if (selectedImage?._id === imageId) {
        const remaining = tour!.images.filter(i => i._id !== imageId);
        setSelectedImage(remaining[0] || null);
      }
      setSelectedHotspot(null);
    } catch (err) {
      console.error("Delete image failed:", err);
    }
  };

  const handlePlaceHotspot = (x: number, y: number) => {
    setIsPlacingMode(false);
    setPendingPlacement({ x, y });
  };

  const handleConfirmHotspot = async () => {
    if (!pendingPlacement || !selectedImage || !tour) return;
    try {
      const res = await api.post("/hotspots", {
        tourId: tour._id,
        imageId: selectedImage._id,
        x: pendingPlacement.x,
        y: pendingPlacement.y,
        label: newHotspotLabel || "Hotspot",
        userContext: newHotspotContext,
      });
      setHotspots((prev) => [...prev, res.data.hotspot]);
      setPendingPlacement(null);
      setNewHotspotLabel("");
      setNewHotspotContext("");
    } catch (err) {
      console.error("Create hotspot failed:", err);
    }
  };

  const handleHotspotUpdated = useCallback((updated: Hotspot) => {
    setHotspots((prev) => prev.map((h) => (h._id === updated._id ? updated : h)));
    setSelectedHotspot((prev) => (prev?._id === updated._id ? updated : prev));
  }, []);

  const handleHotspotDeleted = useCallback((deletedId: string) => {
    setHotspots((prev) => prev.filter((h) => h._id !== deletedId));
    setSelectedHotspot(null);
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p>Loading tour...</p>
    </div>
  );

  if (!tour) return <p>Tour not found.</p>;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <style>{responsiveStyles}</style>

      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 20px", display: "flex", alignItems: "center", gap: 16, height: 52 }}>
        <Link to="/" style={{ color: "#6b7280", fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>← Dashboard</Link>
        <span style={{ color: "#e5e7eb" }}>|</span>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tour.title}</h2>
        <span style={{ fontSize: 11, background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, color: "#374151", marginLeft: "auto", whiteSpace: "nowrap", flexShrink: 0 }}>
          {tour.niche}
        </span>
      </nav>

      <div className="tf-editor-layout">
        {/* Sidebar */}
        <div className="tf-sidebar">
          <div style={{ padding: 10, borderBottom: "1px solid #f3f4f6" }}>
            <label htmlFor="img-upload" style={{ display: "block", textAlign: "center", padding: "8px 0", background: uploading ? "#d1d5db" : "#111827", color: "white", borderRadius: 6, fontSize: 12, cursor: uploading ? "not-allowed" : "pointer", fontWeight: 500 }}>
              {uploading ? "Uploading…" : "+ Add Images"}
            </label>
            <input id="img-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageUpload} style={{ display: "none" }} disabled={uploading} />
            {uploadError && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#dc2626" }}>{uploadError}</p>}
          </div>

          {tour.images.length === 0 && (
            <p style={{ padding: 12, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>Upload images to start</p>
          )}

          {tour.images.map((img) => (
            <div
              key={img._id}
              onClick={() => { setSelectedImage(img); setSelectedHotspot(null); setIsPlacingMode(false); }}
              style={{ padding: 8, borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: selectedImage?._id === img._id ? "#eff6ff" : "transparent", borderLeft: selectedImage?._id === img._id ? "3px solid #3b82f6" : "3px solid transparent" }}
            >
              {/* Image with delete button overlay */}
              <div style={{ position: "relative" }}>
                <img src={img.url} alt={img.label} style={{ width: "100%", height: 70, objectFit: "cover", borderRadius: 4, display: "block" }} />
                <button
                  onClick={(e) => handleDeleteImage(img._id, e)}
                  style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.6)", color: "white", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", lineHeight: "18px", textAlign: "center", padding: 0 }}
                >
                  ✕
                </button>
              </div>
              <p style={{ margin: "5px 0 0", fontSize: 10, color: "#374151", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {img.label || "Untitled"}
              </p>
              <p style={{ margin: 2, fontSize: 10, color: "#9ca3af" }}>
                {hotspots.filter((h) => h.imageId === img._id).length} hotspots
              </p>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div className="tf-canvas-area">
          {selectedImage && (
            <div style={{ padding: "10px 16px", background: "white", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => { setIsPlacingMode(!isPlacingMode); setPendingPlacement(null); }}
                style={{ padding: "6px 14px", border: `1.5px solid ${isPlacingMode ? "#6366f1" : "#e5e7eb"}`, background: isPlacingMode ? "#eef2ff" : "white", color: isPlacingMode ? "#4f46e5" : "#374151", borderRadius: 6, fontSize: 13, cursor: "pointer", fontWeight: isPlacingMode ? 600 : 400, whiteSpace: "nowrap" }}
              >
                {isPlacingMode ? "✕ Cancel" : "⊕ Place Hotspot"}
              </button>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                {hotspots.filter((h) => h.imageId === selectedImage._id).length} hotspots
              </span>
            </div>
          )}

          <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            {!selectedImage ? (
              <div style={{ textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
                <p>Upload an image to start building your tour</p>
              </div>
            ) : (
              <ImageCanvas
                image={selectedImage}
                hotspots={hotspots}
                onPlaceHotspot={handlePlaceHotspot}
                onHotspotClick={(h) => { setSelectedHotspot(h); setIsPlacingMode(false); }}
                isPlacingMode={isPlacingMode}
              />
            )}
          </div>

          {pendingPlacement && (
            <div style={{ padding: "12px 16px", background: "white", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <input
                value={newHotspotLabel}
                onChange={(e) => setNewHotspotLabel(e.target.value)}
                placeholder="Label (e.g. TV Area)"
                style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, width: 180, minWidth: 0 }}
                autoFocus
              />
              <input
                value={newHotspotContext}
                onChange={(e) => setNewHotspotContext(e.target.value)}
                placeholder="Context for AI (optional)"
                style={{ padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, flex: 1, minWidth: 120 }}
              />
              <button onClick={handleConfirmHotspot} style={{ background: "#111827", color: "white", border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
              <button onClick={() => setPendingPlacement(null)} style={{ background: "none", border: "1px solid #e5e7eb", padding: "7px 10px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      {selectedHotspot && (
        <HotspotPanel
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
          onUpdated={handleHotspotUpdated}
          onDeleted={handleHotspotDeleted}
          className="tf-hotspot-panel"
        />
      )}
    </div>
  );
};

export default TourEditor;