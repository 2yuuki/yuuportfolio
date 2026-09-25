(() => {
  document.querySelectorAll('a[href$="contact-form"], a[href$="/contact-form"]').forEach((link) => {
    link.href = 'mailto:yuuki24.work@gmail.com';
    link.removeAttribute('rel');
  });

  document.documentElement.classList.toggle(
    'feature-home-page',
    Boolean(document.querySelector('.featured-showcase'))
  );

  const workPage = document.querySelector('main.cargo-work-template');
  const intro = workPage?.querySelector(':scope > column-set:first-of-type');
  const processBook = workPage?.querySelector(':scope > .process-book-section');
  if (intro && processBook) {
    const sections = Array.from(workPage.querySelectorAll(':scope > column-set'));
    const findSection = (pattern) => sections.find((section) => pattern.test(section.textContent));
    const anchor = findSection(/How It Works/i)
      || findSection(/Overview/i)
      || findSection(/The Insight|Narrative|Execution & Role/i);
    if (anchor) anchor.after(processBook);
  }

  const ownScript = document.currentScript?.src;
  if (ownScript && !document.querySelector('script[data-yuu-language-loader]')) {
    const languageScript = document.createElement('script');
    languageScript.src = new URL('language-toggle.js', ownScript).href;
    languageScript.defer = true;
    languageScript.dataset.yuuLanguageLoader = '';
    document.head.append(languageScript);
  }

  if (
    ownScript &&
    document.querySelector('.process-book-frame iframe[src*=".pdf"]') &&
    !document.querySelector('script[data-yuu-process-book-loader]')
  ) {
    const processBookScript = document.createElement('script');
    processBookScript.src = new URL('process-book-viewer.js', ownScript).href;
    processBookScript.defer = true;
    processBookScript.dataset.yuuProcessBookLoader = '';
    document.head.append(processBookScript);
  }

  const MOBILE_QUERY = "(max-width: 768px)";
  let activeOverlay = null;
  let opener = null;

  const makeAbsolute = (element, attribute, baseUrl) => {
    const value = element.getAttribute(attribute);
    if (!value || value.startsWith("#")) return;

    try {
      element.setAttribute(attribute, new URL(value, baseUrl).href);
    } catch {
      // Keep non-URL values unchanged.
    }
  };

  const closeOverlay = () => {
    if (!activeOverlay) return;

    activeOverlay.remove();
    activeOverlay = null;
    document.body.classList.remove("has-mobile-info-overlay");
    opener?.focus();
    opener = null;
  };

  const openOverlay = async (menuLink) => {
    if (activeOverlay) return;

    opener = menuLink;
    const overlay = document.createElement("div");
    overlay.className = "mobile-info-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Portfolio information and work index");
    overlay.innerHTML = '<span class="mobile-info-overlay__loading">Loading...</span>';

    document.body.append(overlay);
    document.body.classList.add("has-mobile-info-overlay");
    activeOverlay = overlay;

    try {
      const response = await fetch(menuLink.href);
      if (!response.ok) throw new Error(`Unable to load menu: ${response.status}`);

      const html = await response.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const infoPage = parsed.querySelector("#W0609300057");
      if (!infoPage) throw new Error("Mobile info page is missing.");

      infoPage.querySelectorAll("[href]").forEach((element) => {
        makeAbsolute(element, "href", response.url);
      });
      infoPage.querySelectorAll("[src]").forEach((element) => {
        makeAbsolute(element, "src", response.url);
      });

      const closeLink = infoPage.querySelector('[rel="close-overlay"]');
      if (closeLink) closeLink.setAttribute("href", "#");

      overlay.replaceChildren(infoPage);
      closeLink?.focus();
    } catch {
      closeOverlay();
      window.location.href = menuLink.href;
    }
  };

  document.addEventListener("click", (event) => {
    const menuLink = event.target.closest(".mobile-header__menu");
    if (menuLink && window.matchMedia(MOBILE_QUERY).matches) {
      event.preventDefault();
      openOverlay(menuLink);
      return;
    }

    if (event.target.closest('.mobile-info-overlay [rel="close-overlay"]')) {
      event.preventDefault();
      closeOverlay();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeOverlay) closeOverlay();
  });
})();
