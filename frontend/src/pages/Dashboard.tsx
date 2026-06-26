import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Tour } from "../types";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const nicheLabels: Record<string, string> = {
  "real-estate": "Real Estate",
  architecture: "Architecture",
  "interior-design": "Interior Design",
  "art-gallery": "Art Gallery",
  other: "Other",
};

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNiche, setNewNiche] = useState("real-estate");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get("/tours").then((res) => {
      setTours(res.data.tours);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/tours", { title: newTitle, niche: newNiche });
      navigate(`/tour/${res.data.tour._id}`);
    } catch (err) {
      console.error(err);
      setCreating(false);
    }
  };

  const handleDeleteTour = async (tourId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Delete this tour? This will also delete all its hotspots.")) return;
    try {
      await api.delete(`/tours/${tourId}`);
      setTours((prev) => prev.filter((t) => t._id !== tourId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb" }}>
      <nav style={{
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
      }}>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" }}>TourForge</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "#6b7280" }}>Hi, {user?.name}</span>
          <button onClick={logout} style={{ fontSize: 13, padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 6, background: "white", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>My Tours</h1>
          <button
            onClick={() => setShowForm(true)}
            style={{ background: "#111827", color: "white", border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
          >
            + New Tour
          </button>
        </div>

        {showForm && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>New Tour</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Tour title (e.g. 3BHK Apartment, Sector 7)"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <select
              value={newNiche}
              onChange={(e) => setNewNiche(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, marginBottom: 16, width: "100%", boxSizing: "border-box" }}
            >
              {Object.entries(nicheLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                style={{ background: "#111827", color: "white", border: "none", padding: "9px 20px", borderRadius: 6, fontSize: 14, cursor: "pointer" }}
              >
                {creating ? "Creating..." : "Create Tour"}
              </button>
              <button
                onClick={() => { setShowForm(false); setNewTitle(""); }}
                style={{ background: "none", border: "1px solid #e5e7eb", padding: "9px 16px", borderRadius: 6, fontSize: 14, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: "#6b7280" }}>Loading tours...</p>
        ) : tours.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏠</div>
            <p style={{ fontSize: 16 }}>No tours yet. Create your first one!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {tours.map((tour) => (
              <Link key={tour._id} to={`/tour/${tour._id}`} style={{ textDecoration: "none" }}>
                <div
                  style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20, transition: "box-shadow 0.15s, border-color 0.15s", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "#9ca3af"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; }}
                >
                  <div style={{ height: 120, borderRadius: 8, background: tour.images[0] ? "none" : "#f3f4f6", marginBottom: 14, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {tour.images[0] ? (
                      <img src={tour.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 32 }}>🏠</span>
                    )}
                  </div>
                  <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 600, color: "#111827" }}>{tour.title}</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 11, background: "#f3f4f6", color: "#374151", padding: "2px 8px", borderRadius: 4 }}>
                      {nicheLabels[tour.niche]}
                    </span>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                      {tour.images.length} image{tour.images.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const url = `${window.location.origin}/view/${tour._id}`;
                      navigator.clipboard.writeText(url);
                      alert("Share link copied!");
                    }}
                    style={{ width: "100%", padding: "5px 0", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, color: "#374151", fontSize: 12, cursor: "pointer", marginBottom: 6 }}
                  >
                    🔗 Copy share link
                  </button>
                  <button
                    onClick={(e) => handleDeleteTour(tour._id, e)}
                    style={{ width: "100%", padding: "5px 0", background: "none", border: "1px solid #fecaca", borderRadius: 6, color: "#ef4444", fontSize: 12, cursor: "pointer" }}
                  >
                    Delete tour
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;