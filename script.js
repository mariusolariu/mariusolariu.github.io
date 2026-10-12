(function () {
  "use strict";

  var TEXT_SIZE_KEY = "textSizePercent";
  var TEXT_SIZE_STEP = 12.5;
  var TEXT_SIZE_MIN = 87.5;
  var TEXT_SIZE_MAX = 200;
  var TEXT_SIZE_DEFAULT = 100;
  var BASE_FONT_SIZE_PERCENT = 112.5;

  var ACTIVE_TAG_CLASS = "is-active";
  var DIMMED_JOB_CLASS = "is-dimmed";

  function readStoredTextSize() {
    try {
      var stored = parseFloat(window.localStorage.getItem(TEXT_SIZE_KEY));
      return isNaN(stored) ? TEXT_SIZE_DEFAULT : stored;
    } catch (error) {
      return TEXT_SIZE_DEFAULT;
    }
  }

  function storeTextSize(percent) {
    try {
      window.localStorage.setItem(TEXT_SIZE_KEY, String(percent));
    } catch (error) {
      /* storage unavailable: the size still applies for this page view */
    }
  }

  function setupTextSize() {
    var decrease = document.querySelector("[data-text-size='decrease']");
    var increase = document.querySelector("[data-text-size='increase']");
    if (!decrease || !increase) return;

    var percent = clamp(readStoredTextSize());

    function clamp(value) {
      return Math.min(TEXT_SIZE_MAX, Math.max(TEXT_SIZE_MIN, value));
    }

    function apply() {
      document.documentElement.style.fontSize = (BASE_FONT_SIZE_PERCENT * percent / 100) + "%";
      decrease.disabled = percent <= TEXT_SIZE_MIN;
      increase.disabled = percent >= TEXT_SIZE_MAX;
      decrease.setAttribute("aria-label", "Decrease text size, currently " + percent + "%");
      increase.setAttribute("aria-label", "Increase text size, currently " + percent + "%");
    }

    function change(delta) {
      percent = clamp(percent + delta);
      storeTextSize(percent);
      apply();
    }

    decrease.addEventListener("click", function () { change(-TEXT_SIZE_STEP); });
    increase.addEventListener("click", function () { change(TEXT_SIZE_STEP); });
    apply();
  }

  function setupSkillHighlight() {
    var tags = Array.prototype.slice.call(document.querySelectorAll(".tag[data-skill]"));
    var jobs = Array.prototype.slice.call(document.querySelectorAll(".job"));
    if (!tags.length) return;
    var activeSkill = null;

    function render() {
      tags.forEach(function (tag) {
        var isActive = tag.getAttribute("data-skill") === activeSkill;
        tag.classList.toggle(ACTIVE_TAG_CLASS, isActive);
        tag.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      jobs.forEach(function (job) {
        var usesSkill = activeSkill === null || job.querySelector(".tag[data-skill='" + activeSkill + "']") !== null;
        job.classList.toggle(DIMMED_JOB_CLASS, !usesSkill);
      });
    }

    tags.forEach(function (tag) {
      tag.addEventListener("click", function () {
        var skill = tag.getAttribute("data-skill");
        activeSkill = activeSkill === skill ? null : skill;
        render();
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && activeSkill !== null) {
        activeSkill = null;
        render();
      }
    });
  }

  function setupEmail() {
    var holder = document.querySelector("[data-email-user][data-email-domain]");
    if (!holder) return;
    var address = holder.getAttribute("data-email-user") + "@" + holder.getAttribute("data-email-domain");
    var link = document.createElement("a");
    link.href = "mailto:" + address;
    link.textContent = address;
    holder.replaceWith(link);
  }

  setupTextSize();
  setupSkillHighlight();
  setupEmail();
})();
