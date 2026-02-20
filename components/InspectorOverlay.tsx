import React from "react";

export interface BoxRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface InspectorOverlayProps {
  active: boolean;
  rect: BoxRect | null;
  elementTag: string | null;
}

export const InspectorOverlay: React.FC<InspectorOverlayProps> = ({
  active,
  rect,
  elementTag,
}) => {
  if (!active || !rect) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        border: "2px solid #3B82F6",
        pointerEvents: "none",
        zIndex: 2147483646,
        transition: "all 0.05s linear",
        boxSizing: "border-box",
      }}
    >
      {elementTag && (
        <div
          style={{
            position: "absolute",
            top: "-24px",
            left: "-2px",
            backgroundColor: "#3B82F6",
            color: "white",
            padding: "2px 6px",
            fontSize: "12px",
            fontFamily: "monospace",
            borderRadius: "4px 4px 0 0",
            whiteSpace: "nowrap",
          }}
        >
          {elementTag}
        </div>
      )}
    </div>
  );
};
