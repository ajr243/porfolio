# Date Night MASH

By Adrainn Coloma, Andrew Russo, and Alex Marshall.

Live browser app: https://ajr243.github.io/porfolio/date-night-mash/

Choose a total budget for two, select a setting and preset options, and play. The generator samples uniformly from all affordable combinations. Every plan contains dinner, an activity, a treat, and entertainment. Free options support a $0 budget; impossible selections produce an explanation. Prices are illustrative estimates for two, not live quotes or availability.

Includes browser-local favorites and removal, setting filters, text downloads, and a short elimination animation that respects reduced-motion settings. Favorites remain on the current browser and device; they do not sync to an account.

## Server version for class

Install Node.js (version 20 or newer), then from the repository root run:

```
node date-night-mash/server.cjs
```

Open http://localhost:8787. This version sends POST requests to `/api/generate`; the server validates inputs, enumerates affordable combinations, and returns one plan. There are no dependencies or API keys. The small local server binds to loopback for classroom demonstration.

GitHub Pages serves static files, so the published version uses the same selection algorithm in the browser. It does not run the server. A server-capable host is required for a public server-backed version. The browser selects the API when served on the local demo port 8787.
