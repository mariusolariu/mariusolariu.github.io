(function () {
  "use strict";

  var TEXT_SIZE_KEY = "textSizePercent";
  var TEXT_SIZE_STEP = 12.5;
  var TEXT_SIZE_MIN = 87.5;
  var TEXT_SIZE_MAX = 200;
  var TEXT_SIZE_DEFAULT = 100;
  var BASE_FONT_SIZE_PERCENT = 112.5;

  var THEME_COOKIE_NAME = "theme";
  var THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
  var THEME_DARK = "dark";
  var THEME_LIGHT = "light";
  var THEME_GLYPHS = { dark: "\u2600", light: "\u263E" };
  var THEME_LABELS = { dark: "Light mode", light: "Dark mode" };
  var DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

  var ACTIVE_TAG_CLASS = "is-active";
  var DIMMED_JOB_CLASS = "is-dimmed";
  var CLEAR_ALL_LABEL = "Clear all";
  var NO_MATCH_TEXT = "No role used all of these";
  var AND_JOINER = "and";
  var REMOVE_SYMBOL = "\u00D7";
  var FILTER_CHIP_CLASS = "filter-chip";
  var FILTER_CHIP_REMOVE_CLASS = "filter-chip__remove";
  var FILTER_CLEAR_CLASS = "filter-clear";

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
    var triggers = Array.prototype.slice.call(document.querySelectorAll("[data-skill]"));
    var jobs = Array.prototype.slice.call(document.querySelectorAll(".job"));
    var status = document.querySelector("[data-filter-status]");
    var experience = document.getElementById("experience");
    if (!triggers.length || !status || !experience) return;
    var activeSkills = [];
    var lastClickedTrigger = null;

    function jobUsesSkill(job, skill) {
      return job.querySelector("[data-skill='" + skill + "']") !== null;
    }

    function createButton(label, className) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = label;
      return button;
    }

    function createChip(skill) {
      var chip = document.createElement("span");
      chip.className = FILTER_CHIP_CLASS;
      chip.setAttribute("data-chip", skill);
      var label = document.createElement("span");
      label.textContent = skill;
      var remove = createButton(REMOVE_SYMBOL, FILTER_CHIP_REMOVE_CLASS);
      remove.setAttribute("aria-label", "Remove " + skill);
      remove.addEventListener("click", function () { removeSkill(skill); });
      chip.appendChild(label);
      chip.appendChild(remove);
      return chip;
    }

    function renderStatus(matching) {
      status.textContent = "";
      var count = document.createElement("span");
      count.setAttribute("data-filter-count", "");
      count.textContent = matching === 0
        ? NO_MATCH_TEXT
        : "Showing " + matching + " of " + jobs.length + " roles using";
      status.appendChild(count);
      activeSkills.forEach(function (skill, index) {
        if (index > 0) {
          var joiner = document.createElement("span");
          joiner.setAttribute("data-joiner", "");
          joiner.textContent = AND_JOINER;
          status.appendChild(joiner);
        }
        status.appendChild(createChip(skill));
      });
      if (activeSkills.length > 1) {
        var clearAll = createButton(CLEAR_ALL_LABEL, FILTER_CLEAR_CLASS);
        clearAll.setAttribute("data-clear-all", "");
        clearAll.addEventListener("click", function () {
          clearFilter();
          if (lastClickedTrigger) lastClickedTrigger.focus();
        });
        status.appendChild(clearAll);
      }
    }

    function render() {
      triggers.forEach(function (trigger) {
        var isActive = activeSkills.indexOf(trigger.getAttribute("data-skill")) !== -1;
        trigger.classList.toggle(ACTIVE_TAG_CLASS, isActive);
        trigger.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      var matching = 0;
      jobs.forEach(function (job) {
        var usesAll = activeSkills.every(function (skill) { return jobUsesSkill(job, skill); });
        if (usesAll) matching++;
        job.classList.toggle(DIMMED_JOB_CLASS, !usesAll);
      });
      status.hidden = activeSkills.length === 0;
      if (activeSkills.length === 0) {
        status.textContent = "";
      } else {
        renderStatus(matching);
      }
    }

    function clearFilter() {
      activeSkills = [];
      render();
    }

    function removeSkill(skill) {
      var index = activeSkills.indexOf(skill);
      activeSkills.splice(index, 1);
      render();
      var nextRemove = status.querySelectorAll("." + FILTER_CHIP_REMOVE_CLASS)[Math.min(index, activeSkills.length - 1)];
      if (nextRemove) {
        nextRemove.focus();
      } else if (lastClickedTrigger) {
        lastClickedTrigger.focus();
      }
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var skill = trigger.getAttribute("data-skill");
        lastClickedTrigger = trigger;
        var index = activeSkills.indexOf(skill);
        if (index === -1) {
          activeSkills.push(skill);
        } else {
          activeSkills.splice(index, 1);
        }
        render();
        if (index === -1 && trigger.closest("[data-top-skills]")) experience.scrollIntoView();
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && activeSkills.length > 0) clearFilter();
    });
  }

  function readThemeCookie() {
    var match = document.cookie.match(new RegExp("(?:^|; )" + THEME_COOKIE_NAME + "=(dark|light)"));
    return match ? match[1] : null;
  }

  function writeThemeCookie(theme) {
    document.cookie = THEME_COOKIE_NAME + "=" + theme + "; max-age=" + THEME_COOKIE_MAX_AGE_SECONDS + "; path=/; SameSite=Lax";
  }

  function setupThemeToggle() {
    var toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;
    var glyph = toggle.querySelector("[data-theme-glyph]");
    var label = toggle.querySelector("[data-theme-label]");

    var stored = readThemeCookie();
    if (stored) document.documentElement.dataset.theme = stored;

    function effectiveTheme() {
      var chosen = document.documentElement.dataset.theme;
      if (chosen) return chosen;
      return window.matchMedia(DARK_SCHEME_QUERY).matches ? THEME_DARK : THEME_LIGHT;
    }

    function render() {
      var current = effectiveTheme();
      var isDark = current === THEME_DARK;
      glyph.textContent = isDark ? THEME_GLYPHS.dark : THEME_GLYPHS.light;
      label.textContent = THEME_LABELS[current];
      toggle.setAttribute("aria-label", "Switch to " + THEME_LABELS[current].toLowerCase());
      toggle.setAttribute("aria-pressed", isDark ? "true" : "false");
    }

    toggle.addEventListener("click", function () {
      var next = effectiveTheme() === THEME_DARK ? THEME_LIGHT : THEME_DARK;
      document.documentElement.dataset.theme = next;
      writeThemeCookie(next);
      render();
    });

    window.matchMedia(DARK_SCHEME_QUERY).addEventListener("change", render);
    render();
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
  setupThemeToggle();
  setupEmail();
})();
