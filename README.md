# Dilio Browser Extension

## Installation

1. Install dependencies:

```bash
npm install
```

## Build the Extension

```bash
npm run build
```

## Load the Extension

### Chrome / Edge

1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `build` folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` from the `build` folder

## Reload After Changes

1. Run `npm run build`
2. Go to your browser's extensions page and click the reload button on the extension
