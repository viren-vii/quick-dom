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
        const host = document.createElement("quick-dom-root");
        host.id = "quick-dom-toast-host";
        host.style.all = "initial";
        host.style.position = "fixed";
        host.style.zIndex = "2147483647";
        host.style.top = "0";
        host.style.left = "0";
        host.style.width = "100%";
        host.style.background = "transparent";
        host.style.pointerEvents = "none"; // Let clicks pass through if anything misses Toast
        document.body.appendChild(host);

        const shadow = host.attachShadow({ mode: "open" });
        toastContainer = document.createElement("div");
        shadow.appendChild(toastContainer);
        toastRoot = ReactDOM.createRoot(toastContainer);
      }

      toastRoot?.render(
        <Toast
          message={message}
          onClose={() => {
            toastRoot?.unmount();
            if (toastContainer && toastContainer.parentNode) {
              // toastContainer's parentNode is the shadow root.
              // We should instead remove the host.
              const host = (toastContainer.parentNode as ShadowRoot).host;
              if (host && host.parentNode) {
                host.parentNode.removeChild(host);
              }
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
        const host = document.createElement("quick-dom-root");
        host.id = "quick-dom-inspector-host";
        host.style.all = "initial";
        host.style.position = "absolute";
        host.style.top = "0";
        host.style.left = "0";
        host.style.width = "100%";
        host.style.height = "100%";
        host.style.zIndex = "2147483646";
        host.style.background = "transparent";
        host.style.pointerEvents = "none"; // Crucial so we can still hover page elements
        document.body.appendChild(host);

        const shadow = host.attachShadow({ mode: "open" });
        inspectorContainer = document.createElement("div");
        inspectorContainer.style.pointerEvents = "auto"; // Re-enable pointer events for UI menu

        shadow.appendChild(inspectorContainer);
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
              onHighlight={(id) => {
                if (id) {
                  const el = document.querySelector(
                    `[data-quick-dom-id="${id}"]`
                  );
                  if (el) {
                    const r = el.getBoundingClientRect();
                    renderInspector(
                      true,
                      r,
                      el.tagName.toLowerCase(),
                      menuCoords
                    );
                  }
                } else {
                  if (hoveredElement) {
                    const r = hoveredElement.getBoundingClientRect();
                    renderInspector(
                      true,
                      r,
                      hoveredElement.tagName.toLowerCase(),
                      menuCoords
                    );
                  } else {
                    renderInspector(false, null, null, menuCoords);
                  }
                }
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
        if (inspectorContainer && inspectorContainer.parentNode) {
          const host = (inspectorContainer.parentNode as ShadowRoot).host;
          if (host && host.parentNode) {
            host.parentNode.removeChild(host);
          }
        }
        inspectorRoot = null;
        inspectorContainer = null;
      }
    }

    function handleMouseMove(e: MouseEvent) {
      if (!isInspectorActive || menuPos) return;

      const target = e.target as HTMLElement;
      // Ignore our own overlay container if it somehow catches events
      if (
        target.id === "quick-dom-inspector-host" ||
        (inspectorContainer && e.composedPath().includes(inspectorContainer)) ||
        target.id === "quick-dom-toast-host"
      ) {
        return;
      }

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
