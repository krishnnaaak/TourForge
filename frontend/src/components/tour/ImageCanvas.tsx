import React, { useRef, useState } from "react";
import type { TourImage, Hotspot } from "../../types";
import HotspotMarker from "./HotspotMarker";

interface Props {
  image: TourImage;
  hotspots: Hotspot[];
  onPlaceHotspot: (x: number, y: number) => void;
  onHotspotClick: (h: Hotspot) => void;
  isPlacingMode: boolean;
}

const ImageCanvas: React.FC<Props> = ({
  image,
  hotspots,
  onPlaceHotspot,
  onHotspotClick,
  isPlacingMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const imageHotspots = hotspots.filter((h) => h.imageId === image._id);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingMode || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp to image bounds
    const clampedX = Math.max(2, Math.min(98, x));
    const clampedY = Math.max(2, Math.min(98, y));

    onPlaceHotspot(clampedX, clampedY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlacingMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setCursor({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCursor(null)}
      style={{
        position: "relative",
        display: "inline-block",
        cursor: isPlacingMode ? "crosshair" : "default",
        userSelect: "none",
        maxWidth: "100%",
      }}
    >
      <img
        src={image.url}
        alt={image.label || "Tour image"}
        style={{
          display: "block",
          maxWidth: "100%",
          maxHeight: "70vh",
          objectFit: "contain",
          borderRadius: 8,
        }}
        draggable={false}
      />

      {/* Ghost cursor while placing */}
      {isPlacingMode && cursor && (
        <div
          style={{
            position: "absolute",
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: "translate(-50%, -50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            border: "2px dashed #6366f1",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Render hotspot markers */}
      {imageHotspots.map((h) => (
        <HotspotMarker key={h._id} hotspot={h} onClick={onHotspotClick} />
      ))}

      {/* Placing mode banner */}
      {isPlacingMode && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(99,102,241,0.9)",
            color: "white",
            fontSize: 12,
            padding: "5px 14px",
            borderRadius: 20,
            pointerEvents: "none",
          }}
        >
          Click anywhere on the image to place a hotspot
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;
