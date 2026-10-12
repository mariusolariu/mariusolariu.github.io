import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "node-html-parser";
import { HtmlValidate } from "html-validate";

const ROOT = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, ROOT), "utf8");

const resume = JSON.parse(read("resume.json"));
const siteHtml = read("index.html");
const cvMarkdown = read("cv.md");
const site = parse(siteHtml);

const REQUIRED_SITE_SECTIONS = ["summary", "experience", "skills", "soft-skills", "education"];
const REQUIRED_CV_HEADINGS = ["Summary", "Technical Skills", "Experience", "Soft Skills", "Education"];
const CV_DOCX_NAME = "Marius_Olariu_CV.docx";
const SITE_TITLE = "Marius Olariu CV";
const NEW_TAB_NOTICE = "(opens in a new tab)";
const EXPECTED_TOP_SKILLS = ["Java", "TypeScript", "AWS", "Spring", "Next.js", "Git"];

const BANNED_PHRASES = [
  "leverag", "spearhead", "orchestrat", "championed", "foster", "passionate about",
  "proven track record", "results-driven", "cutting-edge", "robust", "seamless", "synergy",
  "world-class", "game-changing", "state-of-the-art", "holistic", "delve", "absolutely right",
  "thought leader", "highly motivated", "exceptional problem solver", "delivering value",
  "navigating complexity", "rich tapestry", "rapidly evolving landscape", "empower", "transformative",
  "revolutionis", "innovative", "dynamic environment", "fast-paced"
];
const NOT_JUST_BUT_PATTERN = /\bnot (just|only)\b[^.]{0,60}\bbut\b/i;
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;
const EMOJI_PRESENTATION_PATTERN = /\p{Emoji_Presentation}|\uFE0F/u;

const textOf = (node) => node.structuredText.replace(/\s+/g, " ").trim();
const siteText = textOf(site);

test("resume.json has the basics a parser needs", () => {
  assert.equal(resume.basics.name, "Marius Olariu");
  assert.equal(resume.basics.label, "Senior Full-Stack Software Engineer");
  assert.ok(resume.basics.email.includes("@"));
  assert.ok(resume.work.length >= 6);
  for (const job of resume.work) {
    assert.ok(job.name && job.position && job.startDate, `job missing fields: ${JSON.stringify(job)}`);
    assert.ok(job.url?.startsWith("https://"), `${job.name} needs an https url`);
    assert.ok(job.description, `${job.name} needs a one-line description`);
    assert.ok(job.highlights.length > 0, `${job.name} has no highlights`);
    assert.ok(job["x-technologies"].length > 0, `${job.name} has no technologies`);
  }
});

test("site tab title is the name followed by CV, while the share card keeps the role", () => {
  assert.equal(textOf(site.querySelector("title")), SITE_TITLE);
  const ogTitle = site.querySelector("meta[property='og:title']").getAttribute("content");
  assert.ok(ogTitle.includes(resume.basics.label), "og:title should still carry the role for link previews");
});

test("site has the required sections in order and a single h1 with the name", () => {
  const h1s = site.querySelectorAll("h1");
  assert.equal(h1s.length, 1);
  assert.equal(textOf(h1s[0]), resume.basics.name);
  const sectionIds = site.querySelectorAll("main > section").map((s) => s.id);
  assert.deepEqual(sectionIds, REQUIRED_SITE_SECTIONS);
});

test("site header has sticky controls: text size buttons, theme toggle and a Word CV download", () => {
  const header = site.querySelector("header");
  assert.ok(header, "no header");
  const decrease = header.querySelector("button[data-text-size='decrease']");
  const increase = header.querySelector("button[data-text-size='increase']");
  assert.ok(decrease && increase, "text size buttons missing");
  assert.ok(decrease.getAttribute("aria-label"), "decrease button needs an aria-label");
  assert.ok(increase.getAttribute("aria-label"), "increase button needs an aria-label");
  const download = header.querySelector(`a[href='${CV_DOCX_NAME}']`);
  assert.ok(download, "Word download link missing from header");
  assert.ok(download.hasAttribute("download"), "download link needs the download attribute");
  assert.match(textOf(download), /Download CV/);
  assert.match(textOf(download), /Word/, "the label should say the file is a Word document");
  const toggle = header.querySelector("button[data-theme-toggle]");
  assert.ok(toggle, "theme toggle missing from header");
  assert.ok(toggle.getAttribute("aria-label"), "theme toggle needs an aria-label");
  assert.ok(toggle.hasAttribute("aria-pressed"), "theme toggle needs aria-pressed");
  assert.ok(read("styles.css").includes('[data-theme="dark"]'), "stylesheet lacks the manual dark theme selector");
  assert.ok(toggle.querySelector("[data-theme-label]"), "theme toggle needs a visible text label");
  assert.match(siteHtml, /<script>[^<]*document\.cookie[^<]*dataset\.theme[^<]*<\/script>/, "head must apply the theme cookie before first paint");
  assert.ok(siteHtml.includes('<script src="script.js?v='), "script.js must be cache-busted with a content hash");
  assert.ok(siteHtml.includes('href="styles.css?v='), "styles.css must be cache-busted with a content hash");
});

test("every download link on the site serves the Word CV and none serves a PDF", () => {
  const downloads = site.querySelectorAll("a[download]");
  assert.ok(downloads.length >= 2, "expected download links in header and footer");
  for (const link of downloads) {
    assert.equal(link.getAttribute("href"), CV_DOCX_NAME);
  }
  assert.ok(!siteHtml.includes(".pdf"), "site must not link a PDF");
});

test("site shows the top skills line exactly as agreed", () => {
  const top = site.querySelector("[data-top-skills]");
  assert.ok(top, "top skills element missing");
  const skills = top.querySelectorAll("li").map(textOf);
  assert.deepEqual(skills, EXPECTED_TOP_SKILLS);
});

test("site and CV state the work preference", () => {
  const availability = resume.basics["x-availability"];
  assert.ok(availability, "x-availability missing from resume.json");
  assert.ok(siteText.includes(availability), "availability missing from site");
  assert.ok(cvMarkdown.includes(availability), "availability missing from cv.md");
});

test("site links to LinkedIn and GitHub and does not expose a plain mailto", () => {
  const hrefs = site.querySelectorAll("a").map((a) => a.getAttribute("href"));
  for (const profile of resume.basics.profiles) {
    assert.ok(hrefs.includes(profile.url), `missing link to ${profile.network}`);
  }
  assert.ok(!siteHtml.includes("mailto:"), "email must be revealed by script, not a static mailto");
  assert.ok(!siteHtml.includes(resume.basics.email), "email must not appear verbatim in the HTML");
  assert.ok(site.querySelector("[data-email-user][data-email-domain]"), "obfuscated email parts missing");
});

test("every job appears on the site with its company link, description, dates and tags", () => {
  const articles = site.querySelectorAll("section#experience article");
  assert.equal(articles.length, resume.work.length);
  resume.work.forEach((job, i) => {
    const article = articles[i];
    const text = textOf(article);
    assert.ok(text.includes(job.position), `${job.position} missing`);
    assert.ok(text.includes(job.description), `description missing for ${job.name}`);
    const company = article.querySelector(`a[href='${job.url}']`);
    assert.ok(company, `${job.name} is not linked to ${job.url}`);
    assert.ok(textOf(company).includes(job.name), `link to ${job.url} does not name ${job.name}`);
    assert.equal(company.getAttribute("target"), "_blank", `${job.name} link should open a new tab`);
    assert.match(company.getAttribute("rel") ?? "", /\bnoopener\b/, `${job.name} link needs rel=noopener`);
    assert.ok(textOf(company).includes(NEW_TAB_NOTICE), `${job.name} link must announce the new tab`);
    const tags = article.querySelectorAll("[data-skill]");
    assert.deepEqual(tags.map((t) => t.getAttribute("data-skill")), job["x-technologies"]);
    assert.deepEqual(tags.map(textOf), job["x-technologies"], `${job.name} tags should show the plain technology name`);
    for (const highlight of job.highlights) {
      assert.ok(text.includes(highlight), `highlight missing for ${job.name}: ${highlight.slice(0, 40)}`);
    }
    if (job["x-moveReason"]) {
      assert.ok(text.includes(job["x-moveReason"]), `move reason missing for ${job.name}`);
    }
  });
});

test("experience has a polite live region for the technology filter status", () => {
  const status = site.querySelector("section#experience [data-filter-status]");
  assert.ok(status, "filter status element missing");
  assert.equal(status.getAttribute("aria-live"), "polite");
  assert.ok(status.hasAttribute("hidden"), "filter status starts hidden until a technology is chosen");
});

test("site shows no emoji", () => {
  assert.ok(!EMOJI_PRESENTATION_PATTERN.test(siteText), "site must not contain emoji");
});

test("site shows each soft skill with its evidence", () => {
  const section = site.querySelector("section#soft-skills");
  const text = textOf(section);
  for (const item of resume["x-softSkills"]) {
    assert.ok(text.includes(item.name), `${item.name} missing`);
    assert.ok(text.includes(item.evidence), `evidence for ${item.name} missing`);
  }
});

test("site and CV share the summary, right to work and education", () => {
  for (const text of [siteText, cvMarkdown]) {
    assert.ok(text.includes(resume.basics.summary), "summary missing");
    assert.ok(text.includes(resume.basics["x-rightToWork"]), "right to work missing");
    for (const edu of resume.education) {
      assert.ok(text.includes(edu.institution), `${edu.institution} missing`);
    }
  }
});

test("CV has conventional headings, linked companies, no emoji and a plain technologies line per job", () => {
  const headings = cvMarkdown.split("\n").filter((line) => line.startsWith("## ")).map((line) => line.slice(3));
  for (const heading of REQUIRED_CV_HEADINGS) {
    assert.ok(headings.includes(heading), `CV heading ${heading} missing`);
  }
  assert.ok(!EMOJI_PATTERN.test(cvMarkdown), "CV must not contain emoji");
  for (const job of resume.work) {
    assert.ok(cvMarkdown.includes(`[${job.name}](${job.url})`), `${job.name} is not linked in the CV`);
    assert.ok(cvMarkdown.includes(job.description), `description missing from CV for ${job.name}`);
    assert.ok(cvMarkdown.includes(`Technologies: ${job["x-technologies"].join(", ")}`), `technologies line missing for ${job.name}`);
  }
  assert.ok(cvMarkdown.includes(resume.basics.email), "CV must show the email in plain text for parsers");
});

test("no banned phrases or 'not just X but Y' patterns anywhere", () => {
  for (const [name, content] of [["resume.json", read("resume.json")], ["index.html", siteHtml], ["cv.md", cvMarkdown]]) {
    const lower = content.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      assert.ok(!lower.includes(phrase), `${name} contains banned phrase "${phrase}"`);
    }
    assert.ok(!NOT_JUST_BUT_PATTERN.test(content), `${name} contains a 'not just X but Y' construction`);
  }
});

test("generated HTML validates", async () => {
  const validator = new HtmlValidate({
    extends: ["html-validate:recommended"],
    rules: { "no-inline-style": "off", "require-sri": "off" }
  });
  const report = await validator.validateString(siteHtml, "index.html");
  const messages = report.results.flatMap((r) => r.messages.map((m) => `index.html:${m.line} ${m.ruleId}: ${m.message}`));
  assert.ok(report.valid, messages.join("\n"));
});

test("the Word CV exists next to the page and no PDF or HTML CV is left behind", () => {
  assert.ok(existsSync(new URL(CV_DOCX_NAME, ROOT)), `${CV_DOCX_NAME} missing; run npm run cv`);
  assert.ok(!existsSync(new URL("Marius_Olariu_CV.pdf", ROOT)), "the PDF was dropped; delete it");
  assert.ok(!existsSync(new URL("cv.html", ROOT)), "cv.html was dropped; delete it");
  assert.ok(existsSync(new URL(".nojekyll", ROOT)), ".nojekyll missing");
});
