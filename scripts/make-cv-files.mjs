import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CV_DOCX_NAME } from "../templates/shared.mjs";

const ROOT = new URL("../", import.meta.url);
const CV_MD = fileURLToPath(new URL("cv.md", ROOT));
const CV_DOCX = fileURLToPath(new URL(CV_DOCX_NAME, ROOT));
const REFERENCE_DOCX = fileURLToPath(new URL("templates/reference.docx", ROOT));

execFileSync("pandoc", [CV_MD, `--reference-doc=${REFERENCE_DOCX}`, "-o", CV_DOCX], { stdio: "inherit" });
console.log(`wrote ${CV_DOCX}`);
