# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-20

### Added

- **Active Event Observers**: Added a comprehensive element event observer that intercepts and logs interactions to the Chrome DevTools console. Contains categorical filtering for Mouse, Keyboard, Form, Touch, Animation, High-Frequency, and Custom events.
- **Manage Observers UI**: Added an inline accordion list in the Action Menu configuration panel to track, locate (via hover highlights), and delete active observers directly from the page view.
- **Custom DOM Action Menu**: Press the configured globally registered shortcut (`Alt+Q` or `MacCtrl+Q`) to activate Inspector Mode. The element under the mouse is highlighted dynamically, and a click opens the DOM Action Menu right over the node.
- **Copy Utilities**: Added utilities to copy elements as OuterHTML, unique CSS Selectors, JS paths, computed CSS styles, and relative/absolute XPath paths.
- **Global Variable Storing**: Standard right-click browser menu and custom Action Menu option added to capture arbitrary page DOM nodes and safely inject them into the `window` context recursively as `tempX` for instant variable debugging.
- **Toasts Notification UI**: Added transient styled React toast notifications that overlay the webpage natively whenever copy or store actions are fired.

### Fixed

- Fixed an issue where Vite's object spread inline ESBuild polyfilling clashed with `chrome.scripting.executeScript` context isolation, throwing unrecoverable `ReferenceError` exceptions in the page's MAIN execution world during Observer registration.
- Addressed a missing implementation of the `sendResponse` framework callback requirement for retrieving asynchronous cross-script payloads (fetching active observers) from `wxt/browser` inside the standard MV3 `onMessage` listener pipeline.

### Changed

- Replaced the default browser action popup with custom branding describing the keyboard shortcut functionality to increase usability initially out of the box.
- Updated the primary asset iconography globally in `package.json` to leverage custom SVGs.
