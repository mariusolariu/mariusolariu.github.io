# mariusolariu.github.io

My CV as a website, served by GitHub Pages at <https://mariusolariu.github.io>.

`resume.json` (JSON Resume schema, with a few `x-` fields) is the single source of truth. Everything else is generated from it:

| Command | Produces |
| --- | --- |
| `npm run build` | `index.html`, `cv.html`, `cv.md` |
| `npm run pdf` | `Marius_Olariu_CV.pdf` (Chrome headless) and `Marius_Olariu_CV.docx` (pandoc) |
| `npm test` | builds, then checks content, consistency, banned phrases and HTML validity |

To change the CV: edit `resume.json`, run `npm test`, run `npm run pdf`, commit the lot.
