# mariusolariu.github.io

My CV as a website, served by GitHub Pages at <https://mariusolariu.github.io>.

`resume.json` (JSON Resume schema, with a few `x-` fields) is the single source of truth. Everything else is generated from it:

| Command | Produces |
| --- | --- |
| `npm run build` | `index.html`, `cv.md` |
| `npm run cv` | `Marius_Olariu_CV.docx` (pandoc, styled by `templates/reference.docx`: Arial 10pt, A4, single column, no tables, so ATS parsers read it in order) |
| `npm test` | builds, then checks content, consistency, banned phrases and HTML validity |

`templates/reference.docx` started as pandoc's default (`pandoc -o reference.docx --print-default-data-file reference.docx`), with these style edits: Arial 10pt body, single line spacing, black bold headings at 18/12/10.5pt with a bottom border on Heading 2, Body Text 3pt after, Compact 1pt after, underlined #1F3A52 hyperlinks, and A4 with 1.5cm margins.

To change the CV: edit `resume.json`, run `npm test`, run `npm run cv`, check the Word file is still two pages or fewer, commit the lot.
