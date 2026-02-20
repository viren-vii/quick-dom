import React, { useEffect, useRef } from "react";
import {
  STORE_VARIABLE_MENU_ID,
  COPY_OUTER_HTML_ID,
  COPY_SELECTOR_ID,
  COPY_JS_PATH_ID,
  COPY_STYLES_ID,
  COPY_XPATH_ID,
  COPY_FULL_XPATH_ID,
} from "../utils/constants";
import {
  Code,
  Copy,
  Terminal,
  MousePointer2,
  ListTree,
  FileJson2,
  Paintbrush2,
} from "lucide-react";

interface ActionMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (actionId: string) => void;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  x,
  y,
  onClose,
  onAction,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Use capture phase to bypass other listeners stopping propagation
    document.addEventListener("mousedown", handleDocumentClick, true);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose]);

  const actions = [
    {
      id: STORE_VARIABLE_MENU_ID,
      label: "Store as global var",
      icon: <Terminal size={14} />,
      color: "#60A5FA",
    },
    { type: "separator" },
    {
      id: COPY_OUTER_HTML_ID,
      label: "Copy element",
      icon: <Code size={14} />,
      color: "#94A3B8",
    },
    {
      id: COPY_SELECTOR_ID,
      label: "Copy selector",
      icon: <MousePointer2 size={14} />,
      color: "#94A3B8",
    },
    {
      id: COPY_JS_PATH_ID,
      label: "Copy JS path",
      icon: <FileJson2 size={14} />,
      color: "#94A3B8",
    },
    {
      id: COPY_STYLES_ID,
      label: "Copy styles",
      icon: <Paintbrush2 size={14} />,
      color: "#94A3B8",
    },
    {
      id: COPY_XPATH_ID,
      label: "Copy XPath",
      icon: <ListTree size={14} />,
      color: "#94A3B8",
    },
    {
      id: COPY_FULL_XPATH_ID,
      label: "Copy full XPath",
      icon: <Copy size={14} />,
      color: "#94A3B8",
    },
  ];

  // Make sure the menu doesn't overflow the viewport
  const safeX = Math.min(x, window.innerWidth - 220); // 200px menu width + padding
  const safeY = Math.min(y, window.innerHeight - 300); // 280px menu approx height

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: safeY,
        left: safeX,
        width: "200px",
        backgroundColor: "#0F172A", // Slate 900
        color: "#F8FAFC", // Slate 50
        borderRadius: "8px",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        border: "1px solid #1E293B", // Slate 800
        padding: "6px",
        zIndex: 2147483647, // Max z-index
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        animation: "quickDomMenuIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>
        {`
          @keyframes quickDomMenuIn {
            from { opacity: 0; transform: scale(0.96) translateY(-4px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}
      </style>

      <div
        style={{
          padding: "6px 10px",
          fontSize: "11px",
          fontWeight: 600,
          color: "#64748B", // Slate 500
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        Quick DOM
      </div>

      {actions.map((action, idx) => {
        if (action.type === "separator") {
          return (
            <div
              key={`sep-${idx}`}
              style={{
                height: "1px",
                backgroundColor: "#1E293B",
                margin: "4px 0",
              }}
            />
          );
        }

        return (
          <button
            key={action.id}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAction(action.id!);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "8px 10px",
              backgroundColor: "transparent",
              border: "none",
              color: "#E2E8F0", // Slate 200
              fontFamily: "inherit",
              fontSize: "inherit",
              textAlign: "left",
              cursor: "pointer",
              borderRadius: "4px",
              transition: "all 0.1s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1E293B"; // Slate 800
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#E2E8F0";
            }}
          >
            <span
              style={{
                color: action.color,
                display: "flex",
                alignItems: "center",
              }}
            >
              {action.icon}
            </span>
            {action.label}
          </button>
        );
      })}
    </div>
  );
};
