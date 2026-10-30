# Tidepool

Calming mini games for Night, installed on the phone as a web app. `PLAN.md` is the source of truth.

- Live app: https://dnpart.github.io/tidepool/
- Install on Android: open the link in Chrome, tap ⋮, then Install app (or Add to Home screen).
- Every push to `main` tests, builds and deploys automatically (`.github/workflows/deploy.yml`).

## Develop

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests
npm run build   # type-check and production build
npm run icons   # re-render PNG icons from public/icon.svg
```
