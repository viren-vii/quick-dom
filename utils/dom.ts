import { QUICK_DOM_ID_ATTR } from "./constants";

export function tagElementWithId(element: Element, id: string): void {
  element.setAttribute(QUICK_DOM_ID_ATTR, id);
}

export function generateRandomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Phase 4: DevTools parity Copy Functions

export function getOuterHTML(element: Element): string {
  return element.outerHTML;
}

export function getCSSSelector(element: Element): string {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }

  if (element.tagName === "BODY") return "body";

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();

    if (current.id) {
      selector = `#${CSS.escape(current.id)}`;
      parts.unshift(selector);
      break;
    } else {
      let sibling = current.previousElementSibling;
      let nth = 1;
      while (sibling) {
        if (sibling.nodeName.toLowerCase() === selector) {
          nth++;
        }
        sibling = sibling.previousElementSibling;
      }
      if (
        nth !== 1 ||
        (current.nextElementSibling &&
          current.nextElementSibling.nodeName.toLowerCase() === selector)
      ) {
        selector += `:nth-of-type(${nth})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(" > ");
}

export function getJSPath(element: Element): string {
  return `document.querySelector('${getCSSSelector(element).replace(/'/g, "\\'")}')`;
}

export function getStyles(element: Element): string {
  const styles = window.getComputedStyle(element);
  let cssText = "";
  // Convert map to standard CSS declaration block format
  for (let i = 0; i < styles.length; i++) {
    const prop = styles[i];
    const val = styles.getPropertyValue(prop);
    cssText += `${prop}: ${val};\n`;
  }
  return cssText;
}

export function getRelativeXPath(element: Element): string {
  if (element.id) {
    return `//${element.nodeName.toLowerCase()}[@id="${element.id}"]`;
  }
  if (element === document.body) {
    return "//body";
  }

  let ix = 0;
  const siblings = element.parentNode?.childNodes;
  if (!siblings) return "";

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      const parentPath = getRelativeXPath(element.parentNode as Element);
      return `${parentPath}/${element.nodeName.toLowerCase()}[${ix + 1}]`;
    }
    if (
      sibling.nodeType === Node.ELEMENT_NODE &&
      sibling.nodeName === element.nodeName
    ) {
      ix++;
    }
  }
  return "";
}

export function getAbsoluteXPath(element: Element): string {
  if (element.tagName === "HTML") return "/html";
  if (element === document.body) return "/html/body";

  let ix = 0;
  const siblings = element.parentNode?.childNodes;
  if (!siblings) return "";

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      const parentPath = getAbsoluteXPath(element.parentNode as Element);
      return `${parentPath}/${element.nodeName.toLowerCase()}[${ix + 1}]`;
    }
    if (
      sibling.nodeType === Node.ELEMENT_NODE &&
      sibling.nodeName === element.nodeName
    ) {
      ix++;
    }
  }
  return "";
}
