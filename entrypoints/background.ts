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
    }
  });

  async function observeElementNode(
    tabId: number,
    elementId: string,
    config: { includeMouseMove: boolean; includeScroll: boolean }
  ) {
    try {
      await browser.scripting.executeScript({
        target: { tabId },
        world: "MAIN",
        func: ((
          elId: string,
          options: { includeMouseMove: boolean; includeScroll: boolean }
        ) => {
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

          const { includeMouseMove = false, includeScroll = false } = options;
          const eventTypes = [
            "click",
            "dblclick",
            "mousedown",
            "mouseup",
            "mouseover",
            "mouseout",
            "mouseenter",
            "mouseleave",
            "contextmenu",
            "touchstart",
            "touchend",
            "touchmove",
            "touchcancel",
            "keydown",
            "keyup",
            "keypress",
            "focus",
            "blur",
            "focusin",
            "focusout",
            "input",
            "change",
            "submit",
            "reset",
            "invalid",
            "drag",
            "dragstart",
            "dragend",
            "dragover",
            "dragenter",
            "dragleave",
            "drop",
            "copy",
            "cut",
            "paste",
            "animationstart",
            "animationend",
            "animationiteration",
            "transitionstart",
            "transitionend",
            "transitionrun",
            "transitioncancel",
            "wheel",
            "select",
            "load",
            "error",
            "resize",
          ];

          if (includeMouseMove) eventTypes.push("mousemove");
          if (includeScroll) eventTypes.push("scroll");

          const listeners: Array<{
            eventType: string;
            listener: EventListener;
          }> = [];

          eventTypes.forEach((eventType) => {
            const listener = (e: Event) => {
              console.log(`[${new Date().toISOString()}] Event: ${eventType}`, {
                type: e.type,
                target: e.target,
                currentTarget: e.currentTarget,
                detail: (e as UIEvent).detail,
                ...getEventSpecificData(e as Event & Record<string, unknown>),
              });
            };
            element.addEventListener(eventType, listener);
            listeners.push({ eventType, listener });
          });

          console.log(`🔍 Started observing element:`, element);
          console.log(`📋 Monitoring ${eventTypes.length} event types`);

          const w = window as unknown as Record<string, unknown>;
          if (!w.quickDomObservers) {
            w.quickDomObservers = [];
          }

          const stopObserving = function () {
            listeners.forEach(({ eventType, listener }) => {
              element.removeEventListener(eventType, listener);
            });
            console.log(`✋ Stopped observing element:`, element);
          };

          (w.quickDomObservers as Array<() => void>).push(stopObserving);

          // Attach a global helper to stop all
          if (!w.stopAllQuickDomObservers) {
            w.stopAllQuickDomObservers = function () {
              const obs = (window as unknown as Record<string, unknown>)
                .quickDomObservers as Array<() => void>;
              if (obs && obs.length > 0) {
                obs.forEach((stop) => stop());
                console.log(`Stopped ${obs.length} Quick DOM observers.`);
                (
                  window as unknown as Record<string, unknown>
                ).quickDomObservers = [];
              } else {
                console.log("No active Quick DOM observers to stop.");
              }
            };
          }

          // Clean up the tracking attribute
          element.removeAttribute("data-quick-dom-id");
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
