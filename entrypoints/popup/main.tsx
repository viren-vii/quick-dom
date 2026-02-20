import React from "react";
import ReactDOM from "react-dom/client";
import { MousePointer2, Command, XSquare } from "lucide-react";

const App = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "20px",
        backgroundColor: "#0F172A", // Slate 900
        color: "#F8FAFC", // Slate 50
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            backgroundColor: "#3B82F6",
            padding: "6px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MousePointer2 size={18} color="white" />
        </div>
        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
          Quick DOM
        </h1>
      </div>

      <div
        style={{
          border: "1px solid #1E293B",
          backgroundColor: "#1E293B",
          borderRadius: "8px",
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <div style={{ fontSize: "14px", color: "#E2E8F0" }}>
          <strong>1.</strong> Press the shortcut to activate Inspector Mode:
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#0F172A",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #334155",
            fontSize: "13px",
            fontFamily: "monospace",
            color: "#60A5FA",
          }}
        >
          <Command size={14} />
          Alt+Q / MacCtrl+Q
        </div>

        <div style={{ fontSize: "14px", color: "#E2E8F0", marginTop: "4px" }}>
          <strong>2.</strong> Hover over any element and <strong>Click</strong>{" "}
          to open the Action Menu.
        </div>
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#94A3B8",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <XSquare size={12} />
        Press Esc to exit Inspector Mode at any time.
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
