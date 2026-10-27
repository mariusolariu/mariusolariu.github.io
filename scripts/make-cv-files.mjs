import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CV_DOCX_NAME } from "../templates/shared.mjs";

const ROOT = new URL("../", import.meta.url);
const CV_MD = fileURLToPath(new URL("cv.md", ROOT));
const CV_DOCX = fileURLToPath(new URL(CV_DOCX_NAME, ROOT));
const REFERENCE_DOCX = fileURLToPath(new URL("templates/reference.docx", ROOT));
const MAX_CV_PAGES = 2;
const SOFFICE = "soffice";
const SOFFICE_APP_PATH = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
const TEMP_PREFIX = "cv-pages-";
const PDF_PAGE_PATTERN = /\/Type\s*\/Page\b/g;

function findSoffice() {
  try {
    execFileSync("which", [SOFFICE], { stdio: "ignore" });
    return SOFFICE;
  } catch {
    if (existsSync(SOFFICE_APP_PATH)) return SOFFICE_APP_PATH;
    throw new Error("LibreOffice not found: run brew install --cask libreoffice to check the CV page count");
  }
}

function countPages(docx) {
  const dir = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
  try {
    const profile = pathToFileURL(join(dir, "profile")).href;
    execFileSync(findSoffice(), [`-env:UserInstallation=${profile}`, "--headless", "--convert-to", "pdf", "--outdir", dir, docx], { stdio: "ignore" });
    const pdf = readFileSync(join(dir, CV_DOCX_NAME.replace(/\.docx$/, ".pdf")), "latin1");
    return pdf.match(PDF_PAGE_PATTERN).length;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

execFileSync("pandoc", [CV_MD, `--reference-doc=${REFERENCE_DOCX}`, "-o", CV_DOCX], { stdio: "inherit" });
console.log(`wrote ${CV_DOCX}`);

const pages = countPages(CV_DOCX);
console.log(`CV pages: ${pages}`);
if (pages > MAX_CV_PAGES) {
  console.error(`CV is over ${MAX_CV_PAGES} pages: ask the owner what to trim`);
  process.exit(1);
}
