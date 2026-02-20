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
    }
  });
});
