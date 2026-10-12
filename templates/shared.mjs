const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PRESENT_LABEL = "Present";
const EN_DASH = "–";

export const CV_PDF_NAME = "Marius_Olariu_CV.pdf";
export const CV_DOCX_NAME = "Marius_Olariu_CV.docx";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatMonth(isoDate) {
  if (!isoDate) return PRESENT_LABEL;
  const [year, month] = isoDate.split("-");
  return month ? `${MONTHS[Number(month) - 1]} ${year}` : year;
}

export function dateRange(start, end, durationLabel) {
  const range = `${formatMonth(start)} ${EN_DASH} ${formatMonth(end)}`;
  return durationLabel ? `${range} (${durationLabel})` : range;
}

export function profileByNetwork(resume, network) {
  return resume.basics.profiles.find((profile) => profile.network === network);
}

export function educationLine(entry) {
  const qualification = entry.studyType === "Exchange" || entry.studyType === "Executive programme"
    ? entry.area
    : `${entry.studyType} ${entry.area}`;
  const score = entry.score ? `, ${entry.score.toLowerCase()}` : "";
  return `${qualification}, ${entry.institution}${score} (${formatMonth(entry.endDate)})`;
}
