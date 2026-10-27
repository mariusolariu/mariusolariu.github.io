import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { CV_DOCX_NAME } from "../templates/shared.mjs";

const ROOT = new URL("../", import.meta.url);
const CV_MD = fileURLToPath(new URL("cv.md", ROOT));
const CV_DOCX = fileURLToPath(new URL(CV_DOCX_NAME, ROOT));
const REFERENCE_DOCX = fileURLToPath(new URL("templates/reference.docx", ROOT));
const PANDOC = "pandoc";
const TEMP_PREFIX = "cv-docx-";

function hasPandoc() {
  try {
    execFileSync(PANDOC, ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const plainText = (docx) => execFileSync(PANDOC, [docx, "-t", "plain"], { encoding: "utf8" });

test("shouldMatchFreshBuildWhenReadingTheWordCv", { skip: !hasPandoc() && "pandoc not installed" }, () => {
  const dir = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
  try {
    const freshDocx = join(dir, CV_DOCX_NAME);
    execFileSync(PANDOC, [CV_MD, `--reference-doc=${REFERENCE_DOCX}`, "-o", freshDocx]);
    assert.equal(plainText(CV_DOCX), plainText(freshDocx), `${CV_DOCX_NAME} is stale: run npm run cv`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
