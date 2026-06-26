import React from "react";
import type { Hotspot } from "../../types";

interface Props {
  hotspot: Hotspot;
  onClick: (h: Hotspot) => void;
}

const statusColors: Record<Hotspot["status"], string> = {
  pending: "#6b7280",
  processing: "#f59e0b",
  completed: "#10b981",
  failed: "#ef4444",
};

const statusPulse: Record<Hotspot["status"], boolean> = {
  pending: false,
  processing: true,
  completed: false,
  failed: false,
};

const HotspotMarker: React.FC<Props> = ({ hotspot, onClick }) => {
  const color = statusColors[hotspot.status];
  const pulse = statusPulse[hotspot.status];

  return (
    <div
      onClick={() => onClick(hotspot)}
      title={hotspot.label}
      style={{
        position: "absolute",
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        transform: "translate(-50%, -50%)",
        cursor: "pointer",
        zIndex: 10,
      }}
    >
      {/* Pulse ring for processing state */}
      {pulse && (
        <div
          style={{
            position: "absolute",
            inset: "-6px",
            borderRadius: "50%",
            border: `2px solid ${color}`,
            opacity: 0.6,
            animation: "ping 1.2s ease-in-out infinite",
          }}
        />
      )}
      {/* Main pin */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: color,
          border: "2px solid white",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "white",
          }}
        />
      </div>

      {/* Label tooltip */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.75)",
          color: "white",
          fontSize: 11,
          padding: "2px 7px",
          borderRadius: 4,
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {hotspot.label}
      </div>

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default HotspotMarker;
