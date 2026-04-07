



function normalizeForSearch(str) {
  const s = String(str || "")
    .toLowerCase()
    .trim();
  try {
    return s.normalize("NFD").replace(/\p{M}/gu, "");
  } catch {
    try {
      return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch {
      return s;
    }
  }
}


function optionMatchesQuery(optionText, queryRaw) {
  const q = normalizeForSearch(queryRaw);
  if (!q) return true;
  const t = normalizeForSearch(optionText);
  return q.split(/\s+/).filter(Boolean).every((w) => t.includes(w));
}

export function initRfqCustomSelects(root = document) {
  const form = root.querySelector(".isg-rfq-form");
  if (!form) return () => {};

  const labels = form.querySelectorAll("label.isg-field--select");
  if (!labels.length) return () => {};

  const disposers = [];

  labels.forEach((label) => {
    const select = label.querySelector("select.isg-field__control");
    if (!select || label.dataset.isgCustomSelectInit === "1") return;

    const wrapper = document.createElement("span");
    wrapper.className = "isg-custom-select";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "isg-custom-select__trigger";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-haspopup", "listbox");

    const valueEl = document.createElement("span");
    valueEl.className = "isg-custom-select__value";

    const chevron = document.createElement("span");
    chevron.className = "isg-custom-select__chevron";
    chevron.setAttribute("aria-hidden", "true");

    trigger.append(valueEl, chevron);

    const panel = document.createElement("div");
    panel.className = "isg-custom-select__panel";
    panel.hidden = true;

    const searchWrap = document.createElement("div");
    searchWrap.className = "isg-custom-select__search-wrap";

    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.className = "isg-custom-select__search";
    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("spellcheck", "false");
    searchInput.setAttribute("enterkeyhint", "search");
    const fieldKicker =
      label.querySelector(".isg-field__label-text")?.textContent?.trim() || "";
    searchInput.setAttribute(
      "aria-label",
      fieldKicker ? `Search: ${fieldKicker}` : "Search options"
    );
    searchInput.placeholder = "Type to filter…";

    searchWrap.appendChild(searchInput);

    const optionsRoot = document.createElement("div");
    optionsRoot.className = "isg-custom-select__options";
    optionsRoot.setAttribute("role", "listbox");

    
    const optionEls = [];

    select.querySelectorAll("option").forEach((opt) => {
      const isEmptyPlaceholder = opt.value === "" && opt.hasAttribute("disabled");
      if (isEmptyPlaceholder) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "isg-custom-select__option";
      btn.setAttribute("role", "option");
      btn.dataset.value = opt.value;
      const txt = opt.textContent.replace(/\s+/g, " ").trim();
      btn.textContent = txt;
      if (opt.disabled) btn.disabled = true;
      optionsRoot.appendChild(btn);
      optionEls.push(btn);
    });

    const emptyMsg = document.createElement("div");
    emptyMsg.className = "isg-custom-select__empty";
    emptyMsg.hidden = true;
    emptyMsg.setAttribute("role", "status");
    emptyMsg.textContent = "No matches";
    optionsRoot.appendChild(emptyMsg);

    panel.append(searchWrap, optionsRoot);

    select.classList.remove("isg-field__control");
    select.classList.add("isg-custom-select__native");
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");

    select.before(wrapper);
    wrapper.append(trigger, panel, select);

    function applyFilter(queryRaw) {
      let visible = 0;
      optionEls.forEach((btn) => {
        const match = optionMatchesQuery(btn.textContent, queryRaw);
        btn.classList.toggle("isg-custom-select__option--filtered-out", !match);
        if (match) visible += 1;
      });
      const q = queryRaw.trim();
      emptyMsg.hidden = visible > 0 || q.length === 0;
    }

    function syncTrigger() {
      const sel = select.selectedOptions[0];
      if (!sel || sel.value === "") {
        valueEl.textContent = "";
        valueEl.classList.add("isg-custom-select__value--placeholder");
      } else {
        valueEl.textContent = sel.textContent.replace(/\s+/g, " ").trim();
        valueEl.classList.remove("isg-custom-select__value--placeholder");
      }
    }

    function highlightOptions() {
      const v = select.value;
      optionEls.forEach((btn) => {
        const on = !btn.disabled && btn.dataset.value === v;
        btn.classList.toggle("isg-custom-select__option--selected", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    let isOpen = false;
    
    let suppressFocusOutUntil = 0;

    function focusSearch() {
      try {
        searchInput.focus({ preventScroll: true });
      } catch {
        searchInput.focus();
      }
    }

    function setOpen(open) {
      isOpen = open;
      panel.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      wrapper.classList.toggle("isg-custom-select--open", open);
      if (open) {
        suppressFocusOutUntil = performance.now() + 250;
        searchInput.value = "";
        applyFilter("");
        highlightOptions();
        requestAnimationFrame(() => {
          requestAnimationFrame(focusSearch);
        });
      } else {
        searchInput.value = "";
        applyFilter("");
      }
    }

    syncTrigger();

    const onTriggerClick = (e) => {
      e.preventDefault();
      setOpen(!isOpen);
    };

    const onPanelClick = (e) => {
      const btn = e.target.closest(".isg-custom-select__option");
      if (
        !btn ||
        btn.disabled ||
        btn.classList.contains("isg-custom-select__option--filtered-out")
      ) {
        return;
      }
      select.value = btn.dataset.value;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncTrigger();
      setOpen(false);
      trigger.focus();
    };

    const onSelectChange = () => syncTrigger();

    const onSearchInput = () => applyFilter(searchInput.value);

    const onSearchKeydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        trigger.focus();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
      }
    };

    
    const onDocClick = (e) => {
      if (!isOpen) return;
      if (!wrapper.contains(e.target)) setOpen(false);
    };

    const onDocKeyDown = (e) => {
      if (e.key !== "Escape" || !isOpen) return;
      if (document.activeElement === searchInput) return;
      e.preventDefault();
      setOpen(false);
      trigger.focus();
    };

    const onWrapperFocusOut = () => {
      if (!isOpen || performance.now() < suppressFocusOutUntil) return;
      requestAnimationFrame(() => {
        if (!isOpen || performance.now() < suppressFocusOutUntil) return;
        if (!wrapper.contains(document.activeElement)) setOpen(false);
      });
    };

    trigger.addEventListener("click", onTriggerClick);
    panel.addEventListener("click", onPanelClick);
    select.addEventListener("change", onSelectChange);
    searchInput.addEventListener("input", onSearchInput);
    searchInput.addEventListener("keydown", onSearchKeydown);
    wrapper.addEventListener("focusout", onWrapperFocusOut);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onDocKeyDown);

    label.dataset.isgCustomSelectInit = "1";

    disposers.push(() => {
      trigger.removeEventListener("click", onTriggerClick);
      panel.removeEventListener("click", onPanelClick);
      select.removeEventListener("change", onSelectChange);
      searchInput.removeEventListener("input", onSearchInput);
      searchInput.removeEventListener("keydown", onSearchKeydown);
      wrapper.removeEventListener("focusout", onWrapperFocusOut);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onDocKeyDown);
      delete label.dataset.isgCustomSelectInit;
      if (wrapper.parentElement === label) {
        label.insertBefore(select, wrapper);
        select.classList.add("isg-field__control");
        select.classList.remove("isg-custom-select__native");
        select.removeAttribute("aria-hidden");
        select.removeAttribute("tabindex");
        wrapper.remove();
      }
    });
  });

  return () => disposers.forEach((fn) => fn());
}
