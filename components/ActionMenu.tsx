import React, { useEffect, useRef, useState } from "react";
import { browser } from "wxt/browser";
import {
  STORE_VARIABLE_MENU_ID,
  OBSERVE_ELEMENT_ID,
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
  Eye,
  ChevronLeft,
  Info,
  List,
  Trash2,
} from "lucide-react";

interface ActionMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onAction: (actionId: string) => void;
  onObserve: (config: Record<string, boolean>) => void;
  onHighlight?: (id: string | null) => void;
}

export const CATEGORY_INFO: Record<string, { desc: string; example: string }> =
  {
    Mouse: {
      desc: "Standard mouse interactions.",
      example: "Clicking, double-clicking, right-clicking.",
    },
    Keyboard: {
      desc: "Keyboard inputs.",
      example: "Pressing or releasing a key.",
    },
    Form: {
      desc: "Form element changes.",
      example: "Typing in an input, submitting a form.",
    },
    Focus: {
      desc: "Focus state changes.",
      example: "Clicking into or tabbing out of an element.",
    },
    Touch: {
      desc: "Touchscreen gestures.",
      example: "Tapping or swiping on a mobile device.",
    },
    Drag: {
      desc: "Drag and drop interactions.",
      example: "Dragging an element or dropping it.",
    },
    Clipboard: {
      desc: "Clipboard actions.",
      example: "Copying, cutting, or pasting text.",
    },
    Animation: {
      desc: "CSS animations & transitions.",
      example: "An animation starting or ending.",
    },
    HighFrequency: {
      desc: "Rapidly firing events.",
      example: "Moving the mouse or scrolling.",
    },
    Other: {
      desc: "Miscellaneous events.",
      example: "Element resizing, loading, or errors.",
    },
  };

export const ActionMenu: React.FC<ActionMenuProps> = ({
  x,
  y,
  onClose,
  onAction,
  onObserve,
  onHighlight,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"main" | "config" | "manage">("main");
  const [activeObservers, setActiveObservers] = useState<
    { id: string; descriptor: string }[]
  >([]);
  const [isLoadingObservers, setIsLoadingObservers] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>({
    Mouse: true,
    Keyboard: true,
    Form: true,
    Focus: true,
    Touch: true,
    Drag: true,
    Clipboard: true,
    Animation: true,
    HighFrequency: false,
    Other: true,
  });

  // Close on outside click or Escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (menuRef.current && !e.composedPath().includes(menuRef.current)) {
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

  const fetchObservers = async () => {
    setIsLoadingObservers(true);
    try {
      const response = await browser.runtime.sendMessage({
        type: "GET_ACTIVE_OBSERVERS",
      });
      if (response && Array.isArray(response)) {
        setActiveObservers(response);
      }
    } catch (err) {
      console.error("Quick DOM: Failed to fetch observers", err);
    } finally {
      setIsLoadingObservers(false);
    }
  };

  const handleDeleteObserver = async (id: string) => {
    try {
      await browser.runtime.sendMessage({
        type: "STOP_OBSERVER",
        observerId: id,
      });
      setActiveObservers((prev) => prev.filter((o) => o.id !== id));
      if (onHighlight) onHighlight(null);
    } catch (e) {
      console.error("Quick DOM: Failed to delete observer", e);
    }
  };

  const actions = [
    {
      id: STORE_VARIABLE_MENU_ID,
      label: "Store as global var",
      icon: <Terminal size={14} />,
      color: "#60A5FA",
    },
    {
      id: OBSERVE_ELEMENT_ID,
      label: "Observe Element",
      icon: <Eye size={14} />,
      color: "#A78BFA",
    },
    { type: "separator" },
    {
      id: "manage_observers",
      label: "Manage Observers",
      icon: <List size={14} />,
      color: "#F472B6",
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
        isolation: "isolate",
        opacity: 1,
        backdropFilter: "blur(10px)",
      }}
    >
      <style>
        {`
          @keyframes quickDomMenuIn {
            from { opacity: 0; transform: scale(0.96) translateY(-4px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          .qd-toggle {
            appearance: none;
            width: 28px;
            height: 16px;
            background: #334155;
            border-radius: 16px;
            position: relative;
            cursor: pointer;
            outline: none;
            transition: background 0.2s;
            flex-shrink: 0;
          }
          .qd-toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 12px;
            height: 12px;
            background: #F8FAFC;
            border-radius: 50%;
            transition: transform 0.2s;
          }
          .qd-toggle:checked {
            background: #60A5FA;
          }
          .qd-toggle:checked::after {
            transform: translateX(12px);
          }
          .qd-tooltip-container {
            position: relative;
            display: flex;
            align-items: center;
          }
          .qd-tooltip-icon {
            color: #64748B;
          }
          .qd-tooltip-container:hover .qd-tooltip-icon {
            color: #94A3B8;
          }
          .qd-tooltip {
            visibility: hidden;
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 170px;
            background-color: #0F172A;
            color: #E2E8F0;
            text-align: left;
            border-radius: 4px;
            padding: 8px;
            border: 1px solid #334155;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
            z-index: 2147483647;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
            font-size: 11px;
            line-height: 1.4;
          }
          .qd-tooltip-container:hover .qd-tooltip {
            visibility: visible;
            opacity: 1;
          }
        `}
      </style>

      {view === "main" ? (
        <>
          <div
            style={{
              padding: "6px 10px",
              fontSize: "11px",
              fontWeight: 600,
              color: "#64748B",
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
                  if (action.id === OBSERVE_ELEMENT_ID) {
                    setView("config");
                    return;
                  }
                  if (action.id === "manage_observers") {
                    setView("manage");
                    fetchObservers();
                    return;
                  }
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
        </>
      ) : (
        <div
          style={{
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingBottom: "6px",
              borderBottom: "1px solid #1E293B",
            }}
          >
            <button
              onClick={() => setView("main")}
              style={{
                background: "transparent",
                border: "none",
                color: "#94A3B8",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#F8FAFC",
                marginLeft: "4px",
              }}
            >
              Observer Options
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              paddingRight: "4px",
            }}
          >
            {Object.keys(categories).map((categoryName) => (
              <label
                key={categoryName}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span style={{ color: "#E2E8F0" }}>{categoryName}</span>
                  <div className="qd-tooltip-container">
                    <Info size={12} className="qd-tooltip-icon" />
                    <div className="qd-tooltip">
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: "4px",
                          color: "#F8FAFC",
                        }}
                      >
                        {categoryName} Events
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        {CATEGORY_INFO[categoryName]?.desc}
                      </div>
                      <div style={{ color: "#94A3B8" }}>
                        <i>e.g., {CATEGORY_INFO[categoryName]?.example}</i>
                      </div>
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="qd-toggle"
                  checked={categories[categoryName]}
                  onChange={(e) =>
                    setCategories((prev) => ({
                      ...prev,
                      [categoryName]: e.target.checked,
                    }))
                  }
                />
              </label>
            ))}
          </div>

          <button
            onClick={() => onObserve(categories)}
            style={{
              marginTop: "4px",
              padding: "8px",
              background: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              width: "100%",
            }}
          >
            <Eye size={14} /> Start Observing
          </button>
        </div>
      )}

      {view === "manage" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            padding: "4px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              color: "#94A3B8",
              marginBottom: "4px",
            }}
            onClick={() => {
              setView("main");
              if (onHighlight) onHighlight(null);
            }}
          >
            <ChevronLeft size={16} />
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#F8FAFC",
                marginLeft: "4px",
              }}
            >
              Active Observers
            </span>
          </div>

          <div
            style={{
              maxHeight: "220px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {isLoadingObservers ? (
              <div
                style={{
                  color: "#94A3B8",
                  fontSize: "12px",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                Loading...
              </div>
            ) : activeObservers.length === 0 ? (
              <div
                style={{
                  color: "#94A3B8",
                  fontSize: "12px",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                No active observers found.
              </div>
            ) : (
              activeObservers.map((obs) => (
                <div
                  key={obs.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px",
                    backgroundColor: "#1E293B",
                    borderRadius: "4px",
                    fontSize: "12px",
                  }}
                  onMouseEnter={() => onHighlight && onHighlight(obs.id)}
                  onMouseLeave={() => onHighlight && onHighlight(null)}
                >
                  <span
                    style={{
                      color: "#E2E8F0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "135px",
                      fontFamily: "monospace",
                      fontSize: "11px",
                    }}
                    title={obs.descriptor}
                  >
                    {obs.descriptor}
                  </span>
                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#EF4444",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={() => handleDeleteObserver(obs.id)}
                    title="Stop Observer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
