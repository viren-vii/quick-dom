export default defineBackground(() => {
  // Handle keyboard shortcuts
  browser.commands.onCommand.addListener((command) => {
    if (command === "toggle-inspector") {
      browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
        if (tabs[0]?.id) {
          browser.tabs.sendMessage(tabs[0].id, { type: "TOGGLE_INSPECTOR" });
        }
      });
    }
  });

  // Common logic to inject script and store element
  async function storeElement(tabId: number, elementId: string) {
    try {
      const injectionResults = await browser.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: (elId: string) => {
          const el = document.querySelector(`[data-quick-dom-id="${elId}"]`);
          if (el) {
            let index = 1;
            while (`temp${index}` in window) {
              index++;
            }
            const varName = `temp${index}`;
            (window as unknown as Record<string, unknown>)[varName] = el;
            console.log(`Stored Quick DOM element as: ${varName}`);
            console.dir(el);
            el.removeAttribute("data-quick-dom-id");
            return varName;
          } else {
            console.warn("Quick DOM: Element not found.");
            return null;
          }
        },
        args: [elementId],
      });

      if (
        injectionResults &&
        injectionResults[0] &&
        injectionResults[0].result
      ) {
        browser.tabs.sendMessage(tabId, {
          type: "SHOW_TOAST",
          message: `Saved element as window.${injectionResults[0].result}`,
        });
      }
    } catch (e) {
      console.error("Quick DOM Error: Failed to store global variable.", e);
    }
  }

  // Handle messages from content script (e.g. from Inspector mode click)
  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "INSPECTOR_STORE_ELEMENT" && sender.tab?.id) {
      storeElement(sender.tab.id, message.elementId);
    } else if (message.type === "INSPECTOR_OBSERVE_ELEMENT" && sender.tab?.id) {
      observeElementNode(sender.tab.id, message.elementId, message.config);
    } else if (message.type === "GET_ACTIVE_OBSERVERS" && sender.tab?.id) {
      return browser.scripting
        .executeScript({
          target: { tabId: sender.tab.id },
          world: "MAIN",
          func: () => {
            const w = window as unknown as Record<string, unknown>;
            const obs = w.quickDomObservers as Record<
              string,
              { id: string; descriptor: string }
            >;
            if (!obs) return [];
            return Object.values(obs).map((o) => ({
              id: o.id,
              descriptor: o.descriptor,
            }));
          },
        })
        .then((injectionResults) => {
          return injectionResults[0]?.result || [];
        })
        .catch((e) => {
          console.error("Quick DOM: Error fetching active observers", e);
          return [];
        });
    } else if (message.type === "STOP_OBSERVER" && sender.tab?.id) {
      browser.scripting.executeScript({
        target: { tabId: sender.tab.id },
        world: "MAIN",
        func: (obsId: string) => {
          const w = window as unknown as Record<string, unknown>;
          const obs = w.quickDomObservers as Record<
            string,
            { stop: () => void }
          >;
          if (obs && obs[obsId]) {
            if (typeof obs[obsId].stop === "function") {
              obs[obsId].stop();
            }
          }
        },
        args: [message.observerId],
      });
    }
  });

  async function observeElementNode(
    tabId: number,
    elementId: string,
    config: Record<string, boolean>
  ) {
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: ((elId: string, options: Record<string, boolean>) => {
          const element = document.querySelector(
            `[data-quick-dom-id="${elId}"]`
          );
          if (!element) {
            console.warn("Quick DOM: Element to observe not found.");
            return;
          }

          // Define extract specific data logic inline
          function getEventSpecificData(e: Event & Record<string, unknown>) {
            const data: Record<string, unknown> = {};
            if (e.clientX !== undefined) {
              data.position = { x: e.clientX, y: e.clientY };
              data.button = e.button;
            }
            if (e.key !== undefined) {
              data.key = e.key;
              data.code = e.code;
              data.ctrlKey = e.ctrlKey;
              data.shiftKey = e.shiftKey;
              data.altKey = e.altKey;
            }
            if (
              e.target &&
              (e.target as HTMLInputElement).value !== undefined
            ) {
              data.value = (e.target as HTMLInputElement).value;
            }
            if (e.touches) {
              data.touches = Array.from(e.touches as TouchList).map(
                (t: Touch) => ({
                  x: t.clientX,
                  y: t.clientY,
                })
              );
            }
            if (e.deltaY !== undefined) {
              data.delta = { x: e.deltaX, y: e.deltaY, z: e.deltaZ };
            }
            return data;
          }

          const OBSERVER_CATEGORIES: Record<string, string[]> = {
            Mouse: [
              "click",
              "dblclick",
              "mousedown",
              "mouseup",
              "mouseover",
              "mouseout",
              "mouseenter",
              "mouseleave",
              "contextmenu",
            ],
            Keyboard: ["keydown", "keyup", "keypress"],
            Form: ["input", "change", "submit", "reset", "invalid"],
            Focus: ["focus", "blur", "focusin", "focusout"],
            Touch: ["touchstart", "touchend", "touchmove", "touchcancel"],
            Drag: [
              "drag",
              "dragstart",
              "dragend",
              "dragover",
              "dragenter",
              "dragleave",
              "drop",
            ],
            Clipboard: ["copy", "cut", "paste"],
            Animation: [
              "animationstart",
              "animationend",
              "animationiteration",
              "transitionstart",
              "transitionend",
              "transitionrun",
              "transitioncancel",
            ],
            HighFrequency: ["mousemove", "scroll", "wheel"],
            Other: ["select", "load", "error", "resize"],
          };

          const eventCategoryMap: Record<string, string> = {};
          const eventTypes: string[] = [];

          Object.entries(options).forEach(([category, isEnabled]) => {
            if (isEnabled && OBSERVER_CATEGORIES[category]) {
              OBSERVER_CATEGORIES[category].forEach((evt) => {
                eventTypes.push(evt);
                eventCategoryMap[evt] = category;
              });
            }
          });

          const listeners: Array<{
            eventType: string;
            listener: EventListener;
          }> = [];

          eventTypes.forEach((eventType) => {
            const listener = (e: Event) => {
              const category = eventCategoryMap[eventType] || "Other";
              let hash = 0;
              for (let i = 0; i < category.length; i++) {
                hash = category.charCodeAt(i) + ((hash << 5) - hash);
              }
              const hue = Math.abs(hash) % 360;
              const color = `hsl(${hue}, 70%, 50%)`;

              const logData = {
                type: e.type,
                target: e.target,
                currentTarget: e.currentTarget,
                detail: (e as UIEvent).detail,
                ...getEventSpecificData(e as Event & Record<string, unknown>),
              };

              console.log(
                `%c[${category}] %c${eventType}`,
                `color: ${color}; font-weight: bold;`,
                "color: inherit; font-weight: normal;",
                logData
              );
            };
            element.addEventListener(eventType, listener);
            listeners.push({ eventType, listener });
          });

          console.log(`🔍 Started observing element:`, element);
          console.log(`📋 Monitoring ${eventTypes.length} event types`);

          const w = window as unknown as Record<string, unknown>;
          if (!w.quickDomObservers) {
            w.quickDomObservers = {} as Record<string, unknown>;
          }

          const stopObserving = function () {
            listeners.forEach(({ eventType, listener }) => {
              element.removeEventListener(eventType, listener);
            });
            console.log(`✋ Stopped observing element:`, element);
            element.removeAttribute("data-quick-dom-id");
            const obs = w.quickDomObservers as Record<string, unknown>;
            if (obs && obs[elementId]) {
              delete obs[elementId];
            }
          };

          function getSelectorForDisplay(el: Element): string {
            if (el.id) return `#${el.id}`;
            let sel = el.tagName.toLowerCase();
            if (el.className && typeof el.className === "string") {
              const classes = el.className
                .split(" ")
                .filter(Boolean)
                .map((c) => `.${c}`)
                .join("");
              if (classes) sel += classes;
            }
            return sel;
          }

          const descriptor = getSelectorForDisplay(element);

          (w.quickDomObservers as Record<string, unknown>)[elementId] = {
            id: elementId,
            descriptor,
            stop: stopObserving,
          };

          // Attach a global helper to stop all
          if (!w.stopAllQuickDomObservers) {
            w.stopAllQuickDomObservers = function () {
              const obs = (window as unknown as Record<string, unknown>)
                .quickDomObservers as Record<string, any>;
              if (obs) {
                const keys = Object.keys(obs);
                keys.forEach((key) => {
                  if (obs[key] && typeof obs[key].stop === "function") {
                    obs[key].stop();
                  }
                });
                console.log(`Stopped ${keys.length} Quick DOM observers.`);
              } else {
                console.log("No active Quick DOM observers to stop.");
              }
            };
          }
        }) as (...args: unknown[]) => void,
        args: [elementId, config],
      });

      browser.tabs.sendMessage(tabId, {
        type: "SHOW_TOAST",
        message: `Observer started! Check DevTools console.`,
      });
    } catch (e) {
      console.error("Quick DOM Error: Failed to start observer.", e);
    }
  }
});
