// Shared admin panel interactivity
document.addEventListener("DOMContentLoaded", () => {
    // --- Theme toggle ---
    // toggles .dark on <html>. Persisted to localStorage. The saved value is
    // applied by a small head script before first paint (no flash); here we
    // just wire the button.
    const themeButtons = document.querySelectorAll("[data-theme-toggle]");
    themeButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const isDark = document.documentElement.classList.contains("dark");
            const next = isDark ? "light" : "dark";
            document.documentElement.classList.toggle("dark", next === "dark");
            localStorage.setItem("theme", next);
        });
    });

    // Sidebar toggle (mobile + collapsible)
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebar-overlay");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebarCollapse = document.getElementById("sidebar-collapse");

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener("click", () => {
            sidebar.classList.toggle("-translate-x-full");
            if (sidebarOverlay) sidebarOverlay.classList.toggle("hidden");
        });
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", () => {
            sidebar.classList.add("-translate-x-full");
            sidebarOverlay.classList.add("hidden");
        });
    }
    if (sidebarCollapse && sidebar) {
        sidebarCollapse.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });
    }

    // --- Toggle switches (data-toggle) ---
    // Flips a switch between "on" (colored bg + knob right) and "off"
    // (gray bg + knob left). The "on" color is read from data-on and
    // defaults to bg-indigo-600.
    const setToggle = (toggle, on) => {
        const onColor = toggle.dataset.on || "bg-indigo-600";
        const knob = toggle.querySelector("span");
        toggle.classList.toggle(onColor, on);
        toggle.classList.toggle("bg-gray-200", !on);
        if (knob) {
            const rightClass = knob.classList.contains("right-0.5")
                ? "right-0.5"
                : "right-1";
            const leftClass = knob.classList.contains("left-0.5")
                ? "left-0.5"
                : "left-1";
            knob.classList.remove("right-1", "right-0.5", "left-1", "left-0.5");
            knob.classList.add(on ? rightClass : leftClass);
        }
    };

    document.querySelectorAll("[data-toggle]").forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const onColor = toggle.dataset.on || "bg-indigo-600";
            setToggle(toggle, !toggle.classList.contains(onColor));
        });
    });

    // --- Pricing billing toggle (data-billing-toggle) ---
    // Swaps each plan's price and /mo vs /yr suffix between monthly and
    // yearly, and flips the switch. Price spans carry data-monthly /
    // data-yearly; suffix spans carry data-suffix-mo / data-suffix-yr;
    // optional helper lines carry data-helper and are hidden when yearly.
    document.querySelectorAll("[data-billing-toggle]").forEach((toggle) => {
        toggle.addEventListener("click", () => {
            const onColor = toggle.dataset.on || "bg-indigo-600";
            const isYearly = toggle.classList.contains(onColor);
            const group = toggle.closest("[data-billing-group]") || document;
            group.querySelectorAll("[data-monthly]").forEach((el) => {
                el.textContent = isYearly
                    ? el.dataset.yearly
                    : el.dataset.monthly;
            });
            group.querySelectorAll("[data-suffix-mo]").forEach((el) => {
                el.textContent = isYearly
                    ? el.dataset.suffixYr
                    : el.dataset.suffixMo;
            });
            group.querySelectorAll("[data-helper]").forEach((el) => {
                el.classList.toggle("hidden", isYearly);
            });
            setToggle(toggle, !isYearly);
        });
    });

    // --- Tabs (data-tab) ---
    // Switches active styling and the visible panel within a
    // [data-tab-group]. Panels are matched by data-tab-panel value.
    document.querySelectorAll("[data-tab]").forEach((tab) => {
        tab.addEventListener("click", () => {
            const group = tab.closest("[data-tab-group]");
            if (!group) return;
            group.querySelectorAll("[data-tab]").forEach((t) => {
                t.classList.remove(
                    "border-indigo-600",
                    "text-indigo-600",
                    "font-semibold",
                );
                t.classList.add(
                    "border-transparent",
                    "text-gray-500",
                    "font-medium",
                );
            });
            tab.classList.add(
                "border-indigo-600",
                "text-indigo-600",
                "font-semibold",
            );
            tab.classList.remove(
                "border-transparent",
                "text-gray-500",
                "font-medium",
            );
            group.querySelectorAll("[data-tab-panel]").forEach((panel) => {
                panel.classList.toggle(
                    "hidden",
                    panel.dataset.tabPanel !== tab.dataset.tab,
                );
            });
        });
    });

    // --- Collapsible groups (data-collapse) ---
    // Toggles .hidden on the target (a [data-collapse-target] inside the
    // group, or the header's next sibling) and rotates the chevron.
    document.querySelectorAll("[data-collapse]").forEach((header) => {
        header.addEventListener("click", () => {
            const group = header.closest("[data-collapse-group]");
            const target = group
                ? group.querySelector("[data-collapse-target]")
                : header.nextElementSibling;
            if (target) target.classList.toggle("hidden");
            const chevron = header.querySelector("svg.ml-auto, [data-chevron]");
            if (chevron) chevron.classList.toggle("rotate-180");
        });
    });

    // --- Dropdowns (data-dropdown) ---
    // Toggles .hidden on the target element (referenced by id) and closes
    // on outside click. Opening one menu closes the others.
    // A [data-user-chevron] icon inside the trigger rotates while open.
    const setDropdown = (trigger, open) => {
        const target = document.getElementById(trigger.dataset.dropdown);
        if (!target) return;
        target.classList.toggle("hidden", !open);
        const chevron = trigger.querySelector("[data-user-chevron]");
        if (chevron) chevron.classList.toggle("rotate-180", open);
    };
    const closeAllDropdowns = () => {
        document.querySelectorAll("[data-dropdown]").forEach((trigger) => {
            setDropdown(trigger, false);
        });
    };
    document.querySelectorAll("[data-dropdown]").forEach((trigger) => {
        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const wasOpen = !document
                .getElementById(trigger.dataset.dropdown)
                .classList.contains("hidden");
            closeAllDropdowns();
            if (!wasOpen) setDropdown(trigger, true);
        });
    });
    document.addEventListener("click", (e) => {
        if (!e.target.closest("[data-dropdown]")) closeAllDropdowns();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAllDropdowns();
    });

    // --- Table search (data-table-search) ---
    // Filters <tbody> rows by text content (case-insensitive). The input's
    // data-table-search value is a CSS selector for the table to filter.
    document.querySelectorAll("[data-table-search]").forEach((input) => {
        input.addEventListener("input", () => {
            const table = document.querySelector(input.dataset.tableSearch);
            if (!table) return;
            const query = input.value.toLowerCase();
            table.querySelectorAll("tbody tr").forEach((row) => {
                row.classList.toggle(
                    "hidden",
                    !row.textContent.toLowerCase().includes(query),
                );
            });
        });
    });

    // --- Filter toggle (data-filter-toggle) ---
    // Toggles a highlighted "active" state on the button.
    document.querySelectorAll("[data-filter-toggle]").forEach((btn) => {
        btn.addEventListener("click", () => {
            btn.classList.toggle("bg-indigo-600");
            btn.classList.toggle("text-white");
            btn.classList.toggle("border-indigo-600");
            btn.classList.toggle("text-gray-700");
        });
    });

    // --- Toast dismiss (data-dismiss) ---
    // Hides the closest [data-toast] card.
    document.querySelectorAll("[data-dismiss]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const toast = btn.closest("[data-toast]");
            if (toast) toast.classList.add("hidden");
        });
    });

    // --- Pagination (data-page) ---
    // Sets the clicked page button active and clears its siblings within a
    // [data-page-group]. prev/next step the active page without going out
    // of range.
    const setActivePage = (group, btn) => {
        group.querySelectorAll("[data-page]").forEach((b) => {
            b.classList.remove("bg-indigo-600", "text-white", "font-semibold");
            b.classList.add("text-gray-600", "font-medium");
        });
        btn.classList.add("bg-indigo-600", "text-white", "font-semibold");
        btn.classList.remove("text-gray-600", "font-medium");
    };

    const allPages = (group) =>
        Array.from(group.querySelectorAll("[data-page]")).filter(
            (b) => b.dataset.page !== "prev" && b.dataset.page !== "next",
        );

    document.querySelectorAll("[data-page-group]").forEach((group) => {
        group.querySelectorAll("[data-page]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const pages = allPages(group);
                if (btn.dataset.page === "prev") {
                    const activeIdx = pages.findIndex((b) =>
                        b.classList.contains("bg-indigo-600"),
                    );
                    if (activeIdx > 0)
                        setActivePage(group, pages[activeIdx - 1]);
                    return;
                }
                if (btn.dataset.page === "next") {
                    const activeIdx = pages.findIndex((b) =>
                        b.classList.contains("bg-indigo-600"),
                    );
                    if (activeIdx >= 0 && activeIdx < pages.length - 1)
                        setActivePage(group, pages[activeIdx + 1]);
                    return;
                }
                setActivePage(group, btn);
            });
        });
    });
});
