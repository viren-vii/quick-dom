import React, { useEffect, useState } from "react";
import { Terminal, X } from "lucide-react";

interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger initial slide-up animation
    const showTimeout = setTimeout(() => setIsVisible(true), 10);

    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for transition before removing
    }, 4000);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        backgroundColor: "#0F172A", // Slate 900
        color: "#F8FAFC", // Slate 50
        padding: "16px 20px",
        borderRadius: "8px",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
        border: "1px solid #1E293B", // Slate 800
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "13px",
        fontWeight: "500",
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        opacity: isVisible ? 1 : 0,
        transition:
          "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-in-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1E293B", // Slate 800
          border: "1px solid #334155", // Slate 700
          borderRadius: "6px",
          padding: "6px",
        }}
      >
        <Terminal size={14} color="#E2E8F0" />
      </div>
      <div
        style={{
          marginRight: "16px",
          letterSpacing: "0.2px",
          color: "#E2E8F0",
        }}
      >
        {message}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: "none",
          border: "none",
          color: "#94A3B8",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "4px",
          transition: "background-color 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#334155";
          e.currentTarget.style.color = "#F8FAFC";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#94A3B8";
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
