import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "node-html-parser";
import { HtmlValidate } from "html-validate";

const ROOT = new URL("../", import.meta.url);
const read = (file) => readFileSync(new URL(file, ROOT), "utf8");

const resume = JSON.parse(read("resume.json"));
const siteHtml = read("index.html");
const cvHtml = read("cv.html");
const site = parse(siteHtml);
const cv = parse(cvHtml);

const REQUIRED_SITE_SECTIONS = ["summary", "experience", "soft-skills", "skills", "education"];
const REQUIRED_CV_HEADINGS = ["Summary", "Technical Skills", "Experience", "Soft Skills", "Education"];
const CV_PDF_NAME = "Marius_Olariu_CV.pdf";
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

const textOf = (node) => node.structuredText.replace(/\s+/g, " ").trim();

test("resume.json has the basics a parser needs", () => {
  assert.equal(resume.basics.name, "Marius Olariu");
  assert.equal(resume.basics.label, "Senior Full-Stack Software Engineer");
  assert.ok(resume.basics.email.includes("@"));
  assert.ok(resume.work.length >= 6);
  for (const job of resume.work) {
    assert.ok(job.name && job.position && job.startDate, `job missing fields: ${JSON.stringify(job)}`);
    assert.ok(job.highlights.length > 0, `${job.name} has no highlights`);
    assert.ok(job["x-technologies"].length > 0, `${job.name} has no technologies`);
  }
});

test("every technology tag has exactly one emoji defined", () => {
  const emoji = resume["x-skillEmoji"];
  const seen = new Map();
  for (const [skill, glyph] of Object.entries(emoji)) {
    assert.ok(!seen.has(glyph), `emoji ${glyph} reused for ${skill} and ${seen.get(glyph)}`);
    seen.set(glyph, skill);
  }
  for (const job of resume.work) {
    for (const tech of job["x-technologies"]) {
      assert.ok(emoji[tech], `no emoji for ${tech} (${job.name})`);
    }
  }
});

test("site has the required sections and a single h1 with the name", () => {
  const h1s = site.querySelectorAll("h1");
  assert.equal(h1s.length, 1);
  assert.equal(textOf(h1s[0]), resume.basics.name);
  for (const id of REQUIRED_SITE_SECTIONS) {
    assert.ok(site.querySelector(`section#${id}`), `missing section#${id}`);
  }
});

test("site header has sticky controls: text size buttons and a CV download link", () => {
  const header = site.querySelector("header");
  assert.ok(header, "no header");
  const decrease = header.querySelector("button[data-text-size='decrease']");
  const increase = header.querySelector("button[data-text-size='increase']");
  assert.ok(decrease && increase, "text size buttons missing");
  assert.ok(decrease.getAttribute("aria-label"), "decrease button needs an aria-label");
  assert.ok(increase.getAttribute("aria-label"), "increase button needs an aria-label");
  const download = header.querySelector(`a[href='${CV_PDF_NAME}']`);
  assert.ok(download, "download link missing from header");
  assert.ok(download.hasAttribute("download"), "download link needs the download attribute");
  assert.match(textOf(download), /Download CV/);
});

test("site shows the top skills line exactly as agreed", () => {
  const top = site.querySelector("[data-top-skills]");
  assert.ok(top, "top skills element missing");
  const skills = top.querySelectorAll("li").map(textOf);
  assert.deepEqual(skills, EXPECTED_TOP_SKILLS);
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

test("every job appears on the site with its company, position, dates and tags", () => {
  const articles = site.querySelectorAll("section#experience article");
  assert.equal(articles.length, resume.work.length);
  resume.work.forEach((job, i) => {
    const text = textOf(articles[i]);
    assert.ok(text.includes(job.name), `${job.name} missing`);
    assert.ok(text.includes(job.position), `${job.position} missing`);
    const tags = articles[i].querySelectorAll("[data-skill]");
    assert.deepEqual(tags.map((t) => t.getAttribute("data-skill")), job["x-technologies"]);
    for (const tag of tags) {
      const glyph = tag.querySelector("[aria-hidden='true']");
      assert.ok(glyph, `tag ${tag.getAttribute("data-skill")} has no glyph span`);
      assert.equal(textOf(glyph), resume["x-skillEmoji"][tag.getAttribute("data-skill")]);
    }
    for (const highlight of job.highlights) {
      assert.ok(text.includes(highlight), `highlight missing for ${job.name}: ${highlight.slice(0, 40)}`);
    }
    if (job["x-moveReason"]) {
      assert.ok(text.includes(job["x-moveReason"]), `move reason missing for ${job.name}`);
    }
  });
});

test("the same skill carries the same emoji everywhere on the site", () => {
  const byGlyph = new Map();
  for (const tag of site.querySelectorAll("[data-skill]")) {
    const skill = tag.getAttribute("data-skill");
    const glyph = textOf(tag.querySelector("[aria-hidden='true']"));
    const previous = byGlyph.get(skill);
    assert.ok(!previous || previous === glyph, `${skill} shown with ${previous} and ${glyph}`);
    byGlyph.set(skill, glyph);
  }
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
  for (const doc of [site, cv]) {
    const text = textOf(doc);
    assert.ok(text.includes(resume.basics.summary), "summary missing");
    assert.ok(text.includes(resume.basics["x-rightToWork"]), "right to work missing");
    for (const edu of resume.education) {
      assert.ok(text.includes(edu.institution), `${edu.institution} missing`);
    }
  }
});

test("CV has conventional headings, no emoji and a plain technologies line per job", () => {
  const headings = cv.querySelectorAll("h2").map(textOf);
  for (const heading of REQUIRED_CV_HEADINGS) {
    assert.ok(headings.includes(heading), `CV heading ${heading} missing`);
  }
  assert.ok(!EMOJI_PATTERN.test(cvHtml), "CV must not contain emoji");
  const text = textOf(cv);
  for (const job of resume.work) {
    assert.ok(text.includes(job.name), `${job.name} missing from CV`);
    assert.ok(text.includes(`Technologies: ${job["x-technologies"].join(", ")}`), `technologies line missing for ${job.name}`);
  }
  assert.ok(text.includes(resume.basics.email), "CV must show the email in plain text for parsers");
});

test("no banned phrases or 'not just X but Y' patterns anywhere", () => {
  for (const [name, content] of [["resume.json", read("resume.json")], ["index.html", siteHtml], ["cv.html", cvHtml]]) {
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
  for (const file of ["index.html", "cv.html"]) {
    const report = await validator.validateString(read(file), file);
    const messages = report.results.flatMap((r) => r.messages.map((m) => `${file}:${m.line} ${m.ruleId}: ${m.message}`));
    assert.ok(report.valid, messages.join("\n"));
  }
});

test("CV files exist next to the page", () => {
  assert.ok(existsSync(new URL(CV_PDF_NAME, ROOT)), `${CV_PDF_NAME} missing; run npm run pdf`);
  assert.ok(existsSync(new URL(".nojekyll", ROOT)), ".nojekyll missing");
});
