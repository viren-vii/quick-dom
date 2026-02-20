import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Quick DOM",
    description:
      "Instantly store hovered or right-clicked elements as global console variables.",
    permissions: ["activeTab", "scripting"],
    icons: {
      "128": "icon.png",
    },
    commands: {
      "toggle-inspector": {
        suggested_key: {
          default: "Alt+Q",
          mac: "MacCtrl+Q",
        },
        description: "Toggle DOM Inspector Overlay",
      },
    },
  },
});
