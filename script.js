document.documentElement.classList.add("has-js");

const menuToggle = document.querySelector("[data-menu-toggle]");
const navigation = document.querySelector("[data-navigation]");
const navigationLinks = navigation ? [...navigation.querySelectorAll("a")] : [];
const siteHeader = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");

if (siteHeader && hero && "IntersectionObserver" in window) {
  const headerObserver = new IntersectionObserver(
    ([entry]) => siteHeader.classList.toggle("is-scrolled", !entry.isIntersecting),
    { threshold: 0, rootMargin: `-${siteHeader.offsetHeight}px 0px 0px` },
  );

  headerObserver.observe(hero);
} else if (siteHeader) {
  siteHeader.classList.add("is-scrolled");
}

function closeMenu() {
  if (!menuToggle || !navigation) return;

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Buka menu navigasi");
  navigation.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => {
    const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";

    menuToggle.setAttribute("aria-expanded", String(willOpen));
    menuToggle.setAttribute("aria-label", willOpen ? "Tutup menu navigasi" : "Buka menu navigasi");
    navigation.classList.toggle("is-open", willOpen);
    document.body.classList.toggle("menu-open", willOpen);
  });

  navigationLinks.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.matchMedia("(min-width: 1081px)").addEventListener("change", (event) => {
    if (event.matches) closeMenu();
  });
}

const faqItems = [...document.querySelectorAll(".faq-list details")];

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;

    faqItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealElements = [...document.querySelectorAll(".reveal")];

if (reducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -5%" },
  );

  revealElements.forEach((element) => revealObserver.observe(element));
}

// Google Tag Conversion Event Tracking (contact_us)
const contactLinks = document.querySelectorAll('a[href*="wa.me"], a[href^="mailto:"], a[href^="tel:"]');
contactLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (typeof gtag === "function") {
      const isMail = link.href.startsWith("mailto:");
      const isTel = link.href.startsWith("tel:");
      gtag("event", "contact_us", {
        method: isMail ? "email" : isTel ? "phone" : "whatsapp",
        event_category: "engagement",
        event_label: link.getAttribute("aria-label") || link.textContent.trim() || link.href,
      });
    }
  });
});

