# Kirjastokaveri Frontend Shell

This package contains the Vite/React TypeScript shell for Kirjastokaveri. The current branch focuses on scaffolding shared layouts, context providers, and service placeholders so later feature branches can plug into a consistent foundation.

## Getting Started

```bash
npm install
npm run dev
```

The dev server relies on the standard Vite defaults. Configure the backend URL via `VITE_API_BASE_URL` in `frontend/.env.local` if you need to proxy real services.

## Available Scripts

```bash
npm run dev     # Start Vite in development mode
npm run build   # Type-check and produce a production build
npm run preview # Serve the built assets locally
npm run lint    # Run eslint over the entire project
```

## Shell Highlights

- Layout primitives (`MainLayout`, `PageHero`, `PageSection`) coordinate page chrome via an outlet context (`usePageLayout`).
- Routing lives in `src/App.tsx` with nested layouts for authenticated and public pages.
- Auth and location providers expose basic stub actions so UI work can proceed before backend integration closes.

## Temporary Service Stubs

The shell uses lightweight placeholder services under `src/services`:

- `httpClient` wraps `fetch` with a base URL, JSON defaults, and a timeout guard.
- `authService` returns demo data for login/logout/getCurrentUser.
- `locationService` exposes `fetchNearbyLibraries`, which currently returns an empty list but establishes the expected response shape.

Re-export everything through `src/services/index.ts` for simple imports.

## Hooks

- `useNearbyLibraries` bridges the location context with `fetchNearbyLibraries`. Call `loadNearbyLibraries` after you have coordinates; it will request permission automatically if the location is missing.
- `src/hooks/index.ts` re-exports shared hooks so feature code can import from `@/hooks` once path aliases land.

These hooks surface `isLoading` and `error` to encourage user feedback even while the implementation is mocked.

## Next Steps

- Replace stubbed service calls with real backend endpoints once available.
- Add coverage (Vitest/RTL) around the layout and provider logic.
- Introduce shadcn/ui primitives and theme switching before shipping public UI preview.
