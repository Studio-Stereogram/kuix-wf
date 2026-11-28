# KUIX scene builder

A small tool for composing splat backdrops: pick primitives, place and colour them, tune the look, choose a halo, and export the scene as JSON for the site (or a PNG).

It lives in the same repository as the site and uses the site's own splat engine (`lib/splats`, `components/splats`) and `node_modules`, so a scene looks the same here as on the page.

## Run it

From the repository root:

```bash
npm install
npx next dev builder -p 3200
```

Then open http://localhost:3200.

## Build it

From the repository root:

```bash
npx next build builder
```

The static site lands in `builder/out`.

## Deploy

Vercel project `kuix-scene-builder` (same repository):

- Root directory: `builder`, with files outside it included
- Framework: Next.js
- Install: `cd .. && npm ci`
- Build: `cd .. && npx next build builder`

## What a scene is

Plain data, defined in `lib/splats/spec.ts`:
- the shapes, each with form, palette, position, size, rotation and scatter
- the splat budget, wind, drift and accent
- the look settings

**Primitives** (`lib/splats/sdf.ts`): cube, donut, torus, pyramid, cylinder, capsule, octahedron.

**Halos** (`lib/splats/halos.ts`):
- **Push** disperses the shapes around the pointer.
- **Loupe** draws the area under the pointer in higher definition, without moving anything.
