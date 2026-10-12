import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../", import.meta.url);
const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
];
const CV_HTML = fileURLToPath(new URL("cv.html", ROOT));
const CV_MD = fileURLToPath(new URL("cv.md", ROOT));
const CV_PDF = fileURLToPath(new URL("Marius_Olariu_CV.pdf", ROOT));
const CV_DOCX = fileURLToPath(new URL("Marius_Olariu_CV.docx", ROOT));

const chrome = CHROME_CANDIDATES.find(existsSync);
if (!chrome) throw new Error("No Chrome or Chromium binary found; cannot print the PDF");

execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  `--print-to-pdf=${CV_PDF}`,
  `file://${CV_HTML}`
], { stdio: "pipe" });
console.log(`wrote ${CV_PDF}`);

try {
  execFileSync("pandoc", [CV_MD, "-o", CV_DOCX], { stdio: "pipe" });
  console.log(`wrote ${CV_DOCX}`);
} catch (error) {
  console.warn("pandoc not available or failed; DOCX skipped:", error.message);
}
