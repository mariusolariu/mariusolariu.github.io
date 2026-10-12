import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { CV_DOCX_NAME, dateRange, educationLine, escapeHtml as h, profileByNetwork } from "./shared.mjs";

const SITE_DESCRIPTION = "CV of Marius Olariu, Senior Full-Stack Software Engineer in London. Java, Spring Boot, TypeScript, Next.js and AWS.";
const ASSET_HASH_LENGTH = 8;
const THEME_COOKIE_NAME = "theme";
const NEW_TAB_NOTICE = "(opens in a new tab)";
const DOWNLOAD_LABEL = "Download CV (Word)";

function assetUrl(file) {
  const content = readFileSync(new URL(`../${file}`, import.meta.url));
  const hash = createHash("sha256").update(content).digest("hex").slice(0, ASSET_HASH_LENGTH);
  return `${file}?v=${hash}`;
}

const UPDATED_LABEL = lastResumeChange().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

function lastResumeChange() {
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cs", "--", "resume.json"], { encoding: "utf8" }).trim();
    if (iso) return new Date(iso);
  } catch (error) {
    /* not a git checkout: fall back to today */
  }
  return new Date();
}

function renderTags(job) {
  const tags = job["x-technologies"].map((skill) => `
        <li><button type="button" class="tag" data-skill="${h(skill)}" aria-pressed="false" title="Show every role where I used ${h(skill)}">${h(skill)}</button></li>`);
  return `<ul class="tags">${tags.join("")}
      </ul>`;
}

function renderPositions(job) {
  if (!job["x-positions"]) return "";
  const items = job["x-positions"].map((p) => `
        <li>${h(p.position)}, ${dateRange(p.startDate, p.endDate)}</li>`);
  return `<ul class="positions">${items.join("")}
      </ul>`;
}

function renderCompanyLink(job) {
  return `<a class="company" href="${h(job.url)}" target="_blank" rel="noopener noreferrer">${h(job.name)}<span aria-hidden="true">&nbsp;&#8599;</span><span class="visually-hidden"> ${NEW_TAB_NOTICE}</span></a>`;
}

function renderJob(job) {
  const highlights = job.highlights.map((line) => `
        <li>${h(line)}</li>`).join("");
  return `
    <article class="job">
      <h3>${h(job.position)}</h3>
      <p class="meta">${renderCompanyLink(job)} · ${h(job.location)} · <time datetime="${h(job.startDate)}">${h(dateRange(job.startDate, job.endDate))}</time></p>
      <p class="company-description">${h(job.description)}</p>
      ${renderPositions(job)}
      ${renderTags(job)}
      <ul class="highlights">${highlights}
      </ul>
    </article>`;
}

function renderSoftSkills(items) {
  return items.map((item) => `
      <li><strong>${h(item.name)}</strong> ${h(item.evidence)}</li>`).join("");
}

function renderSkillGroups(groups) {
  return groups.map((group) => `
      <div class="skill-group">
        <dt>${h(group.name)}</dt>
        <dd>${group.keywords.map(h).join(", ")}</dd>
      </div>`).join("");
}

export function renderSite(resume) {
  const { basics } = resume;
  const linkedin = profileByNetwork(resume, "LinkedIn");
  const github = profileByNetwork(resume, "GitHub");
  const [emailUser, emailDomain] = basics.email.split("@");
  const topSkills = basics["x-topSkills"].map((skill) => `<li>${h(skill)}</li>`).join("");
  const education = resume.education.map((entry) => `
      <li>${h(educationLine(entry))}</li>`).join("");
  const volunteering = resume.volunteer.map((v) => `${v.position} at ${v.organization}, ${dateRange(v.startDate, v.endDate)}. ${v.summary}`).join(" ");

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${h(basics.name)} CV</title>
  <meta name="description" content="${h(SITE_DESCRIPTION)}">
  <meta name="author" content="${h(basics.name)}">
  <meta name="color-scheme" content="light dark">
  <link rel="canonical" href="${h(basics.url)}/">
  <link rel="alternate" type="application/json" href="resume.json" title="JSON Resume">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23244A63'/%3E%3Ctext x='16' y='22' text-anchor='middle' font-family='system-ui' font-size='17' font-weight='700' fill='white'%3EMO%3C/text%3E%3C/svg%3E">
  <script>var themeCookie = document.cookie.match(/(?:^|; )${THEME_COOKIE_NAME}=(dark|light)/); if (themeCookie) document.documentElement.dataset.theme = themeCookie[1];</script>
  <link rel="stylesheet" href="${assetUrl("styles.css")}">
  <meta property="og:title" content="Marius Olariu, Senior Full-Stack Software Engineer">
  <meta property="og:description" content="${h(SITE_DESCRIPTION)}">
  <meta property="og:type" content="profile">
  <meta property="og:url" content="${h(basics.url)}/">
</head>
<body>
  <a class="skip-link" href="#summary">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner">
      <a class="site-header__name" href="#top">${h(basics.name)}</a>
      <div class="site-header__controls">
        <div class="text-size" role="group" aria-label="Text size">
          <button type="button" data-text-size="decrease" aria-label="Decrease text size">A&minus;</button>
          <button type="button" data-text-size="increase" aria-label="Increase text size">A+</button>
        </div>
        <button type="button" class="theme-toggle" data-theme-toggle aria-label="Switch to dark mode" aria-pressed="false"><span aria-hidden="true" data-theme-glyph>&#9790;</span> <span data-theme-label>Dark mode</span></button>
        <a class="button" href="${CV_DOCX_NAME}" download>${DOWNLOAD_LABEL} <span aria-hidden="true">&#8595;</span></a>
      </div>
    </div>
  </header>

  <main id="top">
    <section id="summary" class="hero" aria-labelledby="hero-title">
      <p class="kicker">${h(basics.label)}</p>
      <h1 id="hero-title">${h(basics.name)}</h1>
      <p class="facts">${h(basics.location.city)}, UK · ${h(basics["x-rightToWork"])}</p>
      <p class="summary">${h(basics.summary)}</p>
      <p class="top-skills__label">Top skills</p>
      <ul class="top-skills" data-top-skills>${topSkills}</ul>
      <p class="differentiator">${h(basics["x-differentiator"])}</p>
      <ul class="contact">
        <li><a href="${h(linkedin.url)}" rel="me">LinkedIn</a></li>
        <li><a href="${h(github.url)}" rel="me">GitHub</a></li>
        <li><span class="email" data-email-user="${h(emailUser)}" data-email-domain="${h(emailDomain)}">Email</span></li>
      </ul>
    </section>

    <section id="experience" aria-labelledby="experience-title">
      <h2 id="experience-title">Experience</h2>
      <p class="filter-status" data-filter-status aria-live="polite" hidden></p>
      ${resume.work.map(renderJob).join("\n")}
    </section>

    <section id="skills" aria-labelledby="skills-title">
      <h2 id="skills-title">Technical skills</h2>
      <dl class="skill-groups">${renderSkillGroups(resume.skills)}
      </dl>
    </section>

    <section id="soft-skills" aria-labelledby="soft-skills-title">
      <h2 id="soft-skills-title">Soft skills</h2>
      <ul class="soft-skills">${renderSoftSkills(resume["x-softSkills"])}
      </ul>
    </section>

    <section id="education" aria-labelledby="education-title">
      <h2 id="education-title">Education</h2>
      <ul class="education">${education}
      </ul>
      <p class="also">Outside work: ${h(volunteering)}</p>
    </section>
  </main>

  <footer class="site-footer">
    <p>${h(basics.name)} · <a href="${h(linkedin.url)}">LinkedIn</a> · <a href="${h(github.url)}">GitHub</a> · <a href="${CV_DOCX_NAME}" download>${DOWNLOAD_LABEL}</a> · <a href="resume.json">resume.json</a></p>
    <p>Last updated ${h(UPDATED_LABEL)}.</p>
  </footer>

  <script src="${assetUrl("script.js")}"></script>
</body>
</html>
`;
}
