# KUIX website

The KUIX agency site: Next.js 15 (App Router, static export), React 19, three.js through React Three Fiber, GSAP (SplitText) and Lenis for smooth scrolling.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # writes the finished static site to ./out
npm run start    # serves ./out locally
```

Node 20 or newer.

## Put it on GitHub and Vercel

1. Create an empty repository on GitHub.
2. In this folder:

   ```bash
   git init
   git add .
   git commit -m "KUIX website"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

3. On vercel.com choose **Add New → Project**, pick the repository and press **Deploy**. Vercel recognises Next.js by itself. There are no settings and no environment variables to fill in.

Every later push to `main` deploys again. Without Git, `npx vercel` in this folder deploys it directly.

## UI tokens

All design values live in **`app/tokens.css`**: colours, the two page tones, fonts, the type scale, layout spacing, easing and the grain texture. `app/globals.css` only reads those variables, so a change in the tokens file carries through the site.

| Group | Tokens |
| --- | --- |
| Colour | `--ink` `--paper` `--accent` `--blue` `--orange` `--violet` |
| Tone (set per section) | `--fg` `--bg` `--muted` `--line` `--accent-ink` |
| Fonts | `--font-sans` (headings) `--font-tech` (body, labels, buttons) |
| Type scale | `--h1` `--h2` `--h3` `--h4` `--desc` `--shead-desc` `--body` `--label` `--nav` `--cta`, with `-lh` and `-ls` for the headings |
| Layout | `--gutter` `--bleed` `--header-h` `--pad-top` |
| Motion | `--ease` |
| Texture | `--grain-d` `--grain-l` |

The WebGL background keeps its own copy of the two page colours in `content/scenes.ts` and `lib/scene.ts`. Change those together with `--ink` and `--paper`.

## Where things are

- `app/` holds the routes (home, services, industries, case-studies, culture, contact), the fonts and the two stylesheets.
- `content/copy.ts` holds every piece of text on the site.
- `content/pages.ts` lists the sections of each page in order. Reorder an array to reorder a page; the section numbers follow.
- `content/scenes.ts` gives each section its background colours and tone. `components/gl/Stage.tsx` blends between neighbouring sections as you scroll and sets `data-tone` on `<html>`.
- `components/blocks/` has one file per section (Hero, Approach, Process, ProcessCircles, Services, WorkTable, Industries, Culture, Testimonials, Contact). Shared pieces such as the section header, buttons, icons and gradient placeholders are in `parts.tsx`.
- `components/motion/` has the reveal helpers: `MaskText` (heading letters and text lines), `Reveal` (fade a layer in) and `Parallax` (images sliding inside their frames).
- `components/shell/` is the frame that stays mounted between pages: header, logo, cursor, smooth scroll, page transitions.
- `public/` holds the logo SVG files.

Reduced motion is respected: no smooth scroll, reveals show at once, pinned sections jump straight to their settled state.

## Before going live

- **Jokker** (headings) is the trial build, `app/fonts/JokkerVF-TRIAL.woff2`. It needs a licence for a public site, and the trial file should not sit in a public repository. Replace the file and the path in `app/layout.tsx` when the licensed font arrives.
- Images are grainy gradient placeholders (`Grad` and `Placeholder` in `components/blocks/parts.tsx`) until photography arrives.
- The partner logos in the hero and the case study rows are placeholders.
- The contact form does not send anywhere yet.
