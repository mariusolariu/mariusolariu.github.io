import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const SCRIPT = readFileSync(new URL("script.js", ROOT), "utf8");
const SITE_HTML = readFileSync(new URL("index.html", ROOT), "utf8");

const TOTAL_ROLES = 6;
const JAVA = "Java";
const TYPESCRIPT = "TypeScript";
const AWS = "AWS";
const DATADOG = "Datadog";
const JAVA_ROLES = 5;
const JAVA_AND_TYPESCRIPT_ROLES = 1;
const NO_MATCH_TEXT = "No role used all of these";
const AND_JOINER = "and";

function openSite() {
  const dom = new JSDOM(SITE_HTML, { runScripts: "outside-only", pretendToBeVisual: true });
  const { window } = dom;
  window.Element.prototype.scrollIntoView = () => {};
  window.matchMedia = () => ({ matches: false, addEventListener() {} });
  window.eval(SCRIPT);
  const { document } = window;
  const status = document.querySelector("[data-filter-status]");
  return {
    window,
    document,
    status,
    heroChip: (skill) => document.querySelector(`[data-top-skills] [data-skill='${skill}']`),
    jobTag: (skill) => document.querySelector(`.job .tag[data-skill='${skill}']`),
    removeButton: (skill) => status.querySelector(`button[aria-label='Remove ${skill}']`),
    clearAll: () => status.querySelector("[data-clear-all]"),
    chips: () => [...status.querySelectorAll("[data-chip]")].map((chip) => chip.dataset.chip),
    count: () => status.querySelector("[data-filter-count]")?.textContent,
    dimmed: () => document.querySelectorAll(".job.is-dimmed").length,
    pressed: (skill) => [...document.querySelectorAll(`[data-skill='${skill}']`)].map((el) => el.getAttribute("aria-pressed"))
  };
}

const showing = (matching) => `Showing ${matching} of ${TOTAL_ROLES} roles using`;

test("shouldShowRolesUsingTheSkillWhenOneSelected", () => {
  const site = openSite();
  site.heroChip(JAVA).click();
  assert.equal(site.status.hidden, false);
  assert.equal(site.count(), showing(JAVA_ROLES));
  assert.deepEqual(site.chips(), [JAVA]);
  assert.equal(site.dimmed(), TOTAL_ROLES - JAVA_ROLES);
});

test("shouldShowOnlyRolesUsingBothSkillsWhenTwoSelected", () => {
  const site = openSite();
  site.heroChip(JAVA).click();
  site.heroChip(TYPESCRIPT).click();
  assert.equal(site.count(), showing(JAVA_AND_TYPESCRIPT_ROLES));
  assert.deepEqual(site.chips(), [JAVA, TYPESCRIPT]);
  assert.equal(site.dimmed(), TOTAL_ROLES - JAVA_AND_TYPESCRIPT_ROLES);
});

test("shouldJoinChipsWithAndWhenSeveralSelected", () => {
  const site = openSite();
  site.heroChip(JAVA).click();
  site.heroChip(TYPESCRIPT).click();
  assert.ok(site.status.textContent.includes(`${AND_JOINER}`));
  assert.equal(site.status.querySelectorAll("[data-joiner]").length, 1);
  assert.equal(site.status.querySelector("[data-joiner]").textContent, AND_JOINER);
});

test("shouldNotShowAndOrClearAllWhenOnlyOneSelected", () => {
  const site = openSite();
  site.heroChip(JAVA).click();
  assert.equal(site.status.querySelectorAll("[data-joiner]").length, 0);
  assert.equal(site.clearAll(), null);
});

test("shouldRemoveOneSkillWhenItsChipRemoveButtonClicked", () => {
  const site = openSite();
  site.heroChip(JAVA).click();
  site.heroChip(TYPESCRIPT).click();
  site.removeButton(JAVA).click();
  assert.deepEqual(site.chips(), [TYPESCRIPT]);
  assert.deepEqual(site.pressed(JAVA), site.pressed(JAVA).map(() => "false"));
  assert.equal(site.dimmed(), TOTAL_ROLES - 1);
});

test("shouldHideBarWhenLastSkillRemoved", () => {
  const site = openSite();
  site.heroChip(JAVA).click();
  site.removeButton(JAVA).click();
  assert.equal(site.status.hidden, true);
  assert.equal(site.dimmed(), 0);
});

test("shouldToggleSkillOffWhenSelectedTagClickedAgain", () => {
  const site = openSite();
  site.jobTag(JAVA).click();
  site.jobTag(JAVA).click();
  assert.equal(site.status.hidden, true);
});

test("shouldKeepHeroChipAndJobTagInSyncWhenSkillSelected", () => {
  const site = openSite();
  site.jobTag(AWS).click();
  assert.ok(site.pressed(AWS).length > 1);
  assert.ok(site.pressed(AWS).every((state) => state === "true"));
});

test("shouldClearAllWhenClearAllClicked", () => {
  const site = openSite();
  site.heroChip(JAVA).click();
  site.heroChip(AWS).click();
  site.clearAll().click();
  assert.equal(site.status.hidden, true);
  assert.equal(site.dimmed(), 0);
});

test("shouldClearAllWhenEscapePressed", () => {
  const site = openSite();
  site.heroChip(JAVA).click();
  site.heroChip(AWS).click();
  site.document.dispatchEvent(new site.window.KeyboardEvent("keydown", { key: "Escape" }));
  assert.equal(site.status.hidden, true);
});

test("shouldSayNoRoleUsedAllWhenCombinationMatchesNothing", () => {
  const site = openSite();
  site.heroChip(TYPESCRIPT).click();
  site.jobTag(DATADOG).click();
  assert.equal(site.count(), NO_MATCH_TEXT);
  assert.equal(site.dimmed(), TOTAL_ROLES);
  assert.deepEqual(site.chips(), [TYPESCRIPT, DATADOG]);
});
