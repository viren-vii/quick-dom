import { tagElementWithId, generateRandomId } from "../utils/dom";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toast } from "../components/Toast";
import { ActionMenu } from "../components/ActionMenu";
import { InspectorOverlay, BoxRect } from "../components/InspectorOverlay";
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
  getOuterHTML,
  getCSSSelector,
  getJSPath,
  getStyles,
  getRelativeXPath,
  getAbsoluteXPath,
} from "../utils/dom";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    let toastRoot: ReactDOM.Root | null = null;
    let toastContainer: HTMLDivElement | null = null;

    // Inspector state
    let isInspectorActive = false;
    let menuPos: { x: number; y: number } | null = null;
    let inspectorRoot: ReactDOM.Root | null = null;
    let inspectorContainer: HTMLDivElement | null = null;
    let hoveredElement: HTMLElement | null = null;

    function showToast(message: string) {
      if (!toastContainer) {
        toastContainer = document.createElement("div");
        document.body.appendChild(toastContainer);
        toastRoot = ReactDOM.createRoot(toastContainer);
      }

      toastRoot?.render(
        <Toast
          message={message}
          onClose={() => {
            toastRoot?.unmount();
            if (toastContainer && toastContainer.parentNode) {
              toastContainer.parentNode.removeChild(toastContainer);
            }
            toastRoot = null;
            toastContainer = null;
          }}
        />
      );
    }

    function renderInspector(
      active: boolean,
      rect: BoxRect | null = null,
      tag: string | null = null,
      menuCoords: { x: number; y: number } | null = null
    ) {
      if (!inspectorContainer) {
        inspectorContainer = document.createElement("div");
        document.body.appendChild(inspectorContainer);
        inspectorRoot = ReactDOM.createRoot(inspectorContainer);
      }
      inspectorRoot?.render(
        <>
          <InspectorOverlay active={active} rect={rect} elementTag={tag} />
          {menuCoords && (
            <ActionMenu
              x={menuCoords.x}
              y={menuCoords.y}
              onClose={() => {
                menuPos = null;
                cleanupInspector();
              }}
              onAction={(actionId) => {
                if (hoveredElement) handleMenuAction(actionId, hoveredElement);
                menuPos = null;
                cleanupInspector();
              }}
              onObserve={(config) => {
                if (hoveredElement) {
                  const id = generateRandomId();
                  tagElementWithId(hoveredElement, id);
                  browser.runtime.sendMessage({
                    type: "INSPECTOR_OBSERVE_ELEMENT",
                    elementId: id,
                    config,
                  });
                }
                menuPos = null;
                cleanupInspector();
              }}
            />
          )}
        </>
      );
    }

    function cleanupInspector() {
      isInspectorActive = false;
      menuPos = null;
      hoveredElement = null;
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.body.style.cursor = "default";
      if (inspectorRoot) {
        inspectorRoot.unmount();
        inspectorContainer?.remove();
        inspectorRoot = null;
        inspectorContainer = null;
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isInspectorActive || menuPos) return;

      const target = e.target as HTMLElement;
      // Ignore our own overlay container if it somehow catches events
      if (inspectorContainer?.contains(target)) return;

      hoveredElement = target;

      const rect = target.getBoundingClientRect();
      const tagName = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : "";
      const cls =
        target.className && typeof target.className === "string"
          ? `.${target.className.split(" ")[0]}`
          : "";

      renderInspector(
        true,
        {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        `${tagName}${id}${cls}`
      );
    }

    // Capture clicks in Inspector Mode before anything else
    document.addEventListener(
      "click",
      (e) => {
        if (!isInspectorActive || !hoveredElement) return;

        if (menuPos) return; // Menu handles its own internal clicks

        e.preventDefault();
        e.stopPropagation();

        menuPos = { x: e.clientX, y: e.clientY };

        const rect = hoveredElement.getBoundingClientRect();
        const tagName = hoveredElement.tagName.toLowerCase();
        const id = hoveredElement.id ? `#${hoveredElement.id}` : "";
        const cls =
          hoveredElement.className &&
          typeof hoveredElement.className === "string"
            ? `.${hoveredElement.className.split(" ")[0]}`
            : "";

        renderInspector(
          true,
          {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          `${tagName}${id}${cls}`,
          menuPos
        );
      },
      true
    );

    function handleMenuAction(actionId: string, el: HTMLElement) {
      if (actionId === STORE_VARIABLE_MENU_ID) {
        const id = generateRandomId();
        tagElementWithId(el, id);
        browser.runtime.sendMessage({
          type: "INSPECTOR_STORE_ELEMENT",
          elementId: id,
        });
        return;
      }

      let textToCopy = "";
      let successMessage = "";

      switch (actionId) {
        case COPY_OUTER_HTML_ID:
          textToCopy = getOuterHTML(el);
          successMessage = "Copied Element (OuterHTML)";
          break;
        case COPY_SELECTOR_ID:
          textToCopy = getCSSSelector(el);
          successMessage = "Copied CSS Selector";
          break;
        case COPY_JS_PATH_ID:
          textToCopy = getJSPath(el);
          successMessage = "Copied JS Path";
          break;
        case COPY_STYLES_ID:
          textToCopy = getStyles(el);
          successMessage = "Copied Computed Styles";
          break;
        case COPY_XPATH_ID:
          textToCopy = getRelativeXPath(el);
          successMessage = "Copied XPath";
          break;
        case COPY_FULL_XPATH_ID:
          textToCopy = getAbsoluteXPath(el);
          successMessage = "Copied Full XPath";
          break;
      }

      if (textToCopy) {
        if (!document.hasFocus()) {
          fallbackCopyTextToClipboard(textToCopy, successMessage);
        } else {
          navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
              showToast(`${successMessage} to clipboard!`);
            })
            .catch((err) => {
              console.warn("Clipboard API failed, trying fallback...", err);
              fallbackCopyTextToClipboard(textToCopy, successMessage);
            });
        }
      }
    }

    // Escape to cancel inspector
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && isInspectorActive) {
          cleanupInspector();
        }
      },
      true
    );

    // Listen to messages from background
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "SHOW_TOAST") {
        showToast(message.message);
      } else if (message.type === "TOGGLE_INSPECTOR") {
        if (isInspectorActive) {
          cleanupInspector();
        } else {
          isInspectorActive = true;
          document.addEventListener("mousemove", handleMouseMove, true);
          document.body.style.cursor = "crosshair"; // Indicate mode is active
        }
      }
    });

    function fallbackCopyTextToClipboard(text: string, successMessage: string) {
      const textArea = document.createElement("textarea");
      textArea.value = text;

      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand("copy");
        if (successful) {
          showToast(`${successMessage} to clipboard!`);
        } else {
          console.error("Quick DOM: Fallback copy failed.");
        }
      } catch (err) {
        console.error("Quick DOM: Fallback copy error", err);
      }

      document.body.removeChild(textArea);
    }
  },
});
