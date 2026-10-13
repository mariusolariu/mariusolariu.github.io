# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git workflow

Always work directly on `main`: no branches, no PRs. This overrides any global "branch first" or "open a PR" workflow. The project has one contributor (Claude Code, directed by the owner), so merge conflicts can't happen. Pushing to `main` deploys straight to GitHub Pages, and CI only runs after the push, so run `npm test` before every push.

After finishing a change, always commit and push to `main` straight away; don't wait for the owner's approval.

## Commands

- `npm test`: rebuilds, then runs `node --test`. The tests read the **generated** files, so always build before testing (`npm test` already does).
- Single test: `npm run build && node --test --test-name-pattern="company link"`
- `npm run build`: regenerates `index.html` and `cv.md` from `resume.json`.
- `npm run cv`: regenerates `Marius_Olariu_CV.docx` from `cv.md` with pandoc (needs pandoc locally).

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

- CI (`.github/workflows/test.yml`) fails if `index.html` or `cv.md` differ from a fresh build. CI doesn't check the `.docx`, so run `npm run cv` yourself after content changes.
- The site must never contain the email verbatim or a `mailto:`. `script.js` builds the link from `data-email-user` and `data-email-domain`.
- Writing style: `test/content.test.mjs` has a banned-phrase list (e.g. "leverage", "robust", "passionate about", "innovative") and rejects "not just X but Y" constructions, in `resume.json` and all outputs.
- No emoji on the site or in the CV.
- Dark-mode colour tokens are defined twice in `styles.css`: once under `prefers-color-scheme` and once under `[data-theme="dark"]`. Change both. An inline `<head>` script applies the theme cookie before first paint, and its cookie name must match `script.js`.

## The Word CV

"The CV" means the Word file. The PDF and `cv.html` were removed deliberately; don't bring them back.

- It must stay ATS-safe: single column, no tables, text boxes, images or header/footer content.
- It must be **2 pages or fewer**. Check in Microsoft Word after content changes. If it goes over, ask the owner what to cut; don't trim content yourself.
