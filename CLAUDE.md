# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git workflow

Always work directly on `main`: no branches, no PRs. This overrides any global "branch first" or "open a PR" workflow. The project has one contributor (Claude Code, directed by the owner), so merge conflicts can't happen. Pushing to `main` deploys straight to GitHub Pages, and CI only runs after the push, so run `npm test` before every push.

After finishing a change, always commit and push to `main` straight away; don't wait for the owner's approval.

## Commands

- `npm test`: rebuilds, then runs `node --test`. The tests read the **generated** files, so always build before testing (`npm test` already does).
- Single test: `npm run build && node --test --test-name-pattern="company link"`
- `npm run build`: regenerates `index.html` and `cv.md` from `resume.json`.
- `npm run cv`: rebuilds, regenerates `Marius_Olariu_CV.docx` from `cv.md` with pandoc, then counts its pages with LibreOffice (headless) and exits 1 if the CV is over 2 pages. Needs pandoc and LibreOffice (`brew install --cask libreoffice`) locally.

## How it fits together

`resume.json` (JSON Resume schema) is the single source of truth. Prefer standard schema fields (`work[].url`, `work[].description`) over adding new `x-` fields. Generated outputs are committed, because GitHub Pages serves the repo root as-is (`.nojekyll`, no build step on Pages).

- `build.mjs` maps each output file to a renderer in `templates/`:
  - `site.mjs` renders `index.html`;
  - `cv.mjs` renders `cv.md`;
  - `shared.mjs` holds the shared date, education and escaping helpers.
- `site.mjs` content-hashes `styles.css` and `script.js` into `?v=` query strings, and takes "Last updated" from the git date of `resume.json`. Editing CSS or JS therefore changes `index.html`: rebuild and commit it.
- `cv.md` → pandoc → `.docx`, styled by `templates/reference.docx`. The README documents how that template was made.
- `script.js` is a dependency-free ES5 IIFE: text size (localStorage), theme toggle (cookie), technology-tag filter with a live status line, and email reveal.

## Constraints the tests and CI enforce

- CI (`.github/workflows/test.yml`) fails if `index.html` or `cv.md` differ from a fresh build. `test/docx.test.mjs` fails if the committed `.docx` text differs from a fresh pandoc build of `cv.md`. CI doesn't check the page count, which only `npm run cv` does.
- The site must never contain the email verbatim or a `mailto:`. `script.js` builds the link from `data-email-user` and `data-email-domain`.
- Writing style: `test/content.test.mjs` has a banned-phrase list (e.g. "leverage", "robust", "passionate about", "innovative") and rejects "not just X but Y" constructions, in `resume.json` and all outputs.
- No emoji on the site or in the CV.
- Dark-mode colour tokens are defined twice in `styles.css`: once under `prefers-color-scheme` and once under `[data-theme="dark"]`. Change both. An inline `<head>` script applies the theme cookie before first paint, and its cookie name must match `script.js`.

## Site and CV sync (hard rule)

Every change to the site's content must also reach the Word CV, unless the change only matters on the site (styling, the theme toggle, the filter).

- Finish every content change with `npm run cv`, never with only `npm run build`. Commit `index.html`, `cv.md` and `Marius_Olariu_CV.docx` together.
- `resume.json` changes reach both outputs. A change made only in `templates/site.mjs` must be mirrored in `templates/cv.mjs` when a CV reader would need it too.

## The Word CV

"The CV" means the Word file. The PDF and `cv.html` were removed deliberately; don't bring them back.

- It must stay ATS-safe: single column, no tables, text boxes, images or header/footer content.
- It must be **2 pages or fewer**. `npm run cv` checks this after every sync.
- If it overflows, stop before committing. Tell the owner the page count and ask what to trim; never trim content yourself.
- LibreOffice's count is close to Word's (Arial, A4), but not identical. When page 2 is nearly full, ask the owner to confirm the count in Word.
