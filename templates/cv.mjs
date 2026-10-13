import { dateRange, educationLine, profileByNetwork } from "./shared.mjs";

export function renderCvMarkdown(resume) {
  const { basics } = resume;
  const linkedin = profileByNetwork(resume, "LinkedIn");
  const github = profileByNetwork(resume, "GitHub");
  const lines = [];
  lines.push(`# ${basics.name}`, "", `**${basics.label}**`, "",
    `${basics.location.city}, UK | ${basics["x-rightToWork"]} | ${basics.email} | ${linkedin.url} | ${github.url}`, "",
    "## Summary", "", basics.summary, "",
    "## Technical Skills", "");
  for (const group of resume.skills) lines.push(`- **${group.name}:** ${group.keywords.join(", ")}`);
  lines.push("", "## Experience", "");
  for (const job of resume.work) {
    lines.push(`### ${job.position}, [${job.name}](${job.url})`, "",
      `${job.description} | ${job.location} | ${dateRange(job.startDate, job.endDate)}`, "");
    if (job["x-positions"]) {
      lines.push(job["x-positions"].map((p) => `${p.position}, ${dateRange(p.startDate, p.endDate)}`).join("; "), "");
    }
    lines.push(`Technologies: ${job["x-technologies"].join(", ")}`, "");
    for (const line of job.highlights) lines.push(`- ${line}`);
    lines.push("");
  }
  lines.push("## Soft Skills", "");
  for (const item of resume["x-softSkills"]) lines.push(`- **${item.name}.** ${item.evidence}`);
  lines.push("", "## Education", "");
  for (const entry of resume.education) lines.push(`- ${educationLine(entry)}`);
  for (const v of resume.volunteer) lines.push(`- ${v.position}, ${v.organization}, ${dateRange(v.startDate, v.endDate)}. ${v.summary}`);
  lines.push("");
  return lines.join("\n");
}
