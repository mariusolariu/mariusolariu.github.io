# mariusolariu.github.io

My CV as a website, served by GitHub Pages at <https://mariusolariu.github.io>.

`resume.json` (JSON Resume schema, with a few `x-` fields) is the single source of truth. Everything else is generated from it:

| Command | Produces |
| --- | --- |
| `npm run build` | `index.html`, `cv.md` |
| `npm run cv` | `Marius_Olariu_CV.docx` (pandoc, styled by `templates/reference.docx`: Arial 10pt, A4, single column, no tables, so ATS parsers read it in order) |
| `npm test` | builds, then checks content, consistency, banned phrases and HTML validity |

To change the CV: edit `resume.json`, run `npm test`, run `npm run cv`, check the Word file is still two pages or fewer, commit the lot.
