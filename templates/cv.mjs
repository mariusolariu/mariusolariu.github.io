import { dateRange, educationLine, escapeHtml as h, profileByNetwork } from "./shared.mjs";

const CV_STYLES = `
    :root { color-scheme: light; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 9.5pt; line-height: 1.3; color: #202124; max-width: 180mm; margin: 0 auto; padding: 12mm 0; }
    h1 { font-size: 20pt; margin: 0 0 2pt; }
    h2 { font-size: 12pt; margin: 10pt 0 3pt; padding-bottom: 2pt; border-bottom: 1px solid #202124; }
    h3 { font-size: 10.5pt; margin: 7pt 0 1pt; }
    p, li { margin: 0 0 2pt; }
    ul { padding-left: 14pt; margin: 2pt 0 4pt; }
    .title { font-size: 12pt; font-weight: 600; margin-bottom: 3pt; }
    .contact, .meta, .tech { font-size: 9.5pt; color: #333; }
    .move { font-size: 9.5pt; }
    a { color: #244A63; }
    @page { size: A4; margin: 10mm 12mm; }
    @media print { body { padding: 0; max-width: none; } h3 { page-break-after: avoid; } }
`;

function renderJobHtml(job) {
  const highlights = job.highlights.map((line) => `
      <li>${h(line)}</li>`).join("");
  const positions = job["x-positions"]
    ? `<p class="meta">${job["x-positions"].map((p) => `${h(p.position)}, ${dateRange(p.startDate, p.endDate)}`).join("; ")}</p>`
    : "";
  const move = job["x-moveReason"] ? `
    <p class="move"><em>${h(job["x-moveReason"])}</em></p>` : "";
  return `
  <div class="job">
    <h3>${h(job.position)}, ${h(job.name)}</h3>
    <p class="meta">${h(job.location)} | ${h(dateRange(job.startDate, job.endDate, job["x-durationLabel"]))}</p>
    ${positions}
    <p class="tech">Technologies: ${job["x-technologies"].map(h).join(", ")}</p>
    <ul>${highlights}
    </ul>${move}
  </div>`;
}

export function renderCv(resume) {
  const { basics } = resume;
  const linkedin = profileByNetwork(resume, "LinkedIn");
  const github = profileByNetwork(resume, "GitHub");
  const skills = resume.skills.map((group) => `
      <li><strong>${h(group.name)}:</strong> ${group.keywords.map(h).join(", ")}</li>`).join("");
  const softSkills = resume["x-softSkills"].map((item) => `
      <li><strong>${h(item.name)}.</strong> ${h(item.evidence)}</li>`).join("");
  const education = resume.education.map((entry) => `
      <li>${h(educationLine(entry))}</li>`).join("");
  const volunteering = resume.volunteer.map((v) => `
      <li>${h(v.position)}, ${h(v.organization)}, ${h(dateRange(v.startDate, v.endDate))}. ${h(v.summary)}</li>`).join("");
  const languages = resume.languages.map((l) => `${l.language} (${l.fluency.toLowerCase()})`).join(", ");

  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${h(basics.name)} CV</title>
  <meta name="author" content="${h(basics.name)}">
  <style>${CV_STYLES}</style>
</head>
<body>
  <h1>${h(basics.name)}</h1>
  <p class="title">${h(basics.label)}</p>
  <p class="contact">${h(basics.location.city)}, UK | ${h(basics["x-rightToWork"])} | ${h(basics.email)} | <a href="${h(linkedin.url)}">${h(linkedin.url.replace("https://www.", ""))}</a> | <a href="${h(github.url)}">${h(github.url.replace("https://", ""))}</a></p>

  <h2>Summary</h2>
  <p>${h(basics.summary)}</p>
  <p>${h(basics["x-differentiator"])}</p>

  <h2>Technical Skills</h2>
  <ul>${skills}
  </ul>

  <h2>Experience</h2>${resume.work.map(renderJobHtml).join("\n")}

  <h2>Soft Skills</h2>
  <ul>${softSkills}
  </ul>

  <h2>Education</h2>
  <ul>${education}${volunteering}
      <li>Languages: ${h(languages)}</li>
  </ul>
</body>
</html>
`;
}

export function renderCvMarkdown(resume) {
  const { basics } = resume;
  const linkedin = profileByNetwork(resume, "LinkedIn");
  const github = profileByNetwork(resume, "GitHub");
  const lines = [];
  lines.push(`# ${basics.name}`, "", `**${basics.label}**`, "",
    `${basics.location.city}, UK | ${basics["x-rightToWork"]} | ${basics.email} | ${linkedin.url} | ${github.url}`, "",
    "## Summary", "", basics.summary, "", basics["x-differentiator"], "",
    "## Technical Skills", "");
  for (const group of resume.skills) lines.push(`- **${group.name}:** ${group.keywords.join(", ")}`);
  lines.push("", "## Experience", "");
  for (const job of resume.work) {
    lines.push(`### ${job.position}, ${job.name}`, "",
      `${job.location} | ${dateRange(job.startDate, job.endDate, job["x-durationLabel"])}`, "");
    if (job["x-positions"]) {
      lines.push(job["x-positions"].map((p) => `${p.position}, ${dateRange(p.startDate, p.endDate)}`).join("; "), "");
    }
    lines.push(`Technologies: ${job["x-technologies"].join(", ")}`, "");
    for (const line of job.highlights) lines.push(`- ${line}`);
    if (job["x-moveReason"]) lines.push("", `*${job["x-moveReason"]}*`);
    lines.push("");
  }
  lines.push("## Soft Skills", "");
  for (const item of resume["x-softSkills"]) lines.push(`- **${item.name}.** ${item.evidence}`);
  lines.push("", "## Education", "");
  for (const entry of resume.education) lines.push(`- ${educationLine(entry)}`);
  for (const v of resume.volunteer) lines.push(`- ${v.position}, ${v.organization}, ${dateRange(v.startDate, v.endDate)}. ${v.summary}`);
  lines.push(`- Languages: ${resume.languages.map((l) => `${l.language} (${l.fluency.toLowerCase()})`).join(", ")}`, "");
  return lines.join("\n");
}
