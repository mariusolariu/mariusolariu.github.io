import { readFileSync, writeFileSync } from "node:fs";
import { renderSite } from "./templates/site.mjs";
import { renderCvMarkdown } from "./templates/cv.mjs";

const RESUME_FILE = new URL("./resume.json", import.meta.url);
const OUTPUTS = {
  "index.html": renderSite,
  "cv.md": renderCvMarkdown
};

const stripTrailingWhitespace = (text) => text.replace(/[ \t]+$/gm, "");

const resume = JSON.parse(readFileSync(RESUME_FILE, "utf8"));

for (const [file, render] of Object.entries(OUTPUTS)) {
  writeFileSync(new URL(`./${file}`, import.meta.url), stripTrailingWhitespace(render(resume)));
  console.log(`wrote ${file}`);
}
