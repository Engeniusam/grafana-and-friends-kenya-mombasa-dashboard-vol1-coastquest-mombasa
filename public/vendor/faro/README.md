# Self-hosted Grafana Faro bundles

These files are unmodified IIFE bundles from npm, version **2.15.0**, served from the same origin by `server.js` at `/vendor/faro/`.

| File | Package | Source |
| --- | --- | --- |
| `faro-web-sdk.iife.js` | `@grafana/faro-web-sdk@2.15.0` | https://unpkg.com/@grafana/faro-web-sdk@2.15.0/dist/bundle/faro-web-sdk.iife.js |
| `faro-web-tracing.iife.js` | `@grafana/faro-web-tracing@2.15.0` | https://unpkg.com/@grafana/faro-web-tracing@2.15.0/dist/bundle/faro-web-tracing.iife.js |
| `faro-instrumentation-replay.iife.js` | `@grafana/faro-instrumentation-replay@2.15.0` | https://unpkg.com/@grafana/faro-instrumentation-replay@2.15.0/dist/bundle/faro-instrumentation-replay.iife.js |

The bundles expose the globals `GrafanaFaroWebSdk`, `GrafanaFaroWebTracing` and `GrafanaFaroInstrumentationReplay`, which are used by the init script in `public/index.html`.

## Updating

1. Pick a new version `X.Y.Z` and use the same version for all three packages.
2. Download each bundle, for example:

   ```sh
   cd public/vendor/faro
   for p in faro-web-sdk faro-web-tracing faro-instrumentation-replay; do
     curl -fsSL -o "$p.iife.js" "https://unpkg.com/@grafana/$p@X.Y.Z/dist/bundle/$p.iife.js"
   done
   ```

   Alternatively, run `npm pack @grafana/<package>@X.Y.Z` and copy `package/dist/bundle/<package>.iife.js` out of the tarball.
3. Update the version in this README and in the Faro comment in `public/index.html`.
4. Load the site and confirm `window.GrafanaFaroWebSdk.faro.api` is defined and that POST requests go to `faro-collector-prod-us-west-0.grafana.net`.
