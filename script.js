document.documentElement.classList.add("has-js");

// Three independent landing-page compositions with shareable URLs.
const variantPicker = document.querySelector("[data-variant-picker]");
const variantButtons = variantPicker ? [...variantPicker.querySelectorAll("[data-variant]")] : [];
const variantNotes = {
  counsel: "Analisis yang teliti, strategi yang terarah, dan pendampingan sepanjang proses penyelesaian sengketa Anda.",
  registry: "Dokumen dibaca teliti. Risiko dijelaskan sejak awal.",
  brief: "Strategi hukum yang tenang untuk perkara yang tidak sederhana.",
};

const variantAnchors = {
  counsel: {
    beranda: "#beranda",
    layanan: "#layanan",
    "jenis-sengketa": "#jenis-sengketa",
    tahapan: "#tahapan",
    faq: "#faq",
    artikel: "#artikel",
  },
  registry: {
    beranda: "#registry-beranda",
    layanan: "#registry-layanan",
    "jenis-sengketa": "#registry-jenis-sengketa",
    tahapan: "#registry-path",
    faq: "#registry-faq",
    artikel: "#registry-artikel",
  },
  brief: {
    beranda: "#brief-beranda",
    layanan: "#brief-layanan",
    "jenis-sengketa": "#brief-jenis-sengketa",
    tahapan: "#brief-tahapan",
    faq: "#brief-faq",
    artikel: "#brief-artikel",
  },
};

function setLandingVariant(nextVariant, { persist = true, updateUrl = true } = {}) {
  const variant = Object.prototype.hasOwnProperty.call(variantNotes, nextVariant) ? nextVariant : "counsel";

  document.body.classList.remove("variant-counsel", "variant-registry", "variant-brief");
  document.body.classList.add(`variant-${variant}`);

  variantButtons.forEach((button) => {
    const isActive = button.dataset.variant === variant;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.querySelectorAll("[data-variant-note]").forEach((note) => {
    note.textContent = variantNotes[variant];
  });

  const anchors = variantAnchors[variant];
  document.querySelector("[data-brand-link]")?.setAttribute("href", anchors.beranda);
  document.querySelectorAll("[data-nav-key]").forEach((link) => {
    const target = anchors[link.dataset.navKey];
    if (target) link.setAttribute("href", target);
  });

  if (persist) {
    try {
      window.localStorage.setItem("navins-landing-variant", variant);
    } catch {
      // Private browsing can disable storage; the page still works per visit.
    }
  }

  if (updateUrl && window.history?.replaceState) {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", variant);
    url.hash = "";
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

if (variantPicker) {
  const queryVariant = new URLSearchParams(window.location.search).get("variant");
  let storedVariant = null;

  try {
    storedVariant = window.localStorage.getItem("navins-landing-variant");
  } catch {
    storedVariant = null;
  }

  setLandingVariant(queryVariant || storedVariant || "counsel", { persist: false, updateUrl: false });
  variantButtons.forEach((button) => {
    button.addEventListener("click", () => setLandingVariant(button.dataset.variant));
  });
}

const menuToggle = document.querySelector("[data-menu-toggle]");
const navigation = document.querySelector("[data-navigation]");
const navigationLinks = navigation ? [...navigation.querySelectorAll("a")] : [];
const siteHeader = document.querySelector("[data-header]");
const hero = document.querySelector(".hero");

const heroSlideshow = document.querySelector("[data-hero-slideshow]");

if (heroSlideshow) {
  const slides = [...heroSlideshow.querySelectorAll("[data-hero-slide]")];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeSlide = 0;
  let timer;

  const showSlide = (index) => {
    activeSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === activeSlide);
      slide.setAttribute("aria-hidden", slideIndex === activeSlide ? "false" : "true");
    });

  };

  const restartTimer = () => {
    window.clearInterval(timer);
    if (!prefersReducedMotion && slides.length > 1) {
      timer = window.setInterval(() => showSlide(activeSlide + 1), 6500);
    }
  };

  showSlide(0);
  restartTimer();
}

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

const faqItems = [...document.querySelectorAll(".faq-list details, .direction-faq-list details")];

faqItems.forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;

    faqItems.forEach((otherItem) => {
      if (otherItem !== item && otherItem.parentElement === item.parentElement) {
        otherItem.open = false;
      }
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

// Google Tag & Google Ads Conversion Event Tracking (WhatsApp only)
const whatsappLinks = document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]');

function createContactTransactionId() {
  const storageKey = "google_ads_wa_transaction_id";

  try {
    const storedTransactionId = window.sessionStorage.getItem(storageKey);
    if (storedTransactionId) return storedTransactionId;

    const transactionId =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `wa-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.sessionStorage.setItem(storageKey, transactionId);
    return transactionId;
  } catch {
    return `wa-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

const whatsappTransactionId = createContactTransactionId();

whatsappLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (typeof gtag === "function") {
      // Google Ads Direct Conversion Tracking for WhatsApp
      gtag("event", "conversion", {
        send_to: "AW-10938076157/4lK6CIzRt-ccEP2X198o",
        transaction_id: whatsappTransactionId,
      });

      // Google Analytics (GA4) Event Tracking
      gtag("event", "contact_us", {
        method: "whatsapp",
        event_category: "engagement",
        event_label: link.getAttribute("aria-label") || link.textContent.trim() || link.href,
      });
    }
  });
});

// Modal Interaction for Privacy Policy & Disclaimer
const modalOpenBtns = document.querySelectorAll("[data-modal-open]");
const modalCloseBtns = document.querySelectorAll("[data-modal-close]");

modalOpenBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const modalId = btn.getAttribute("data-modal-open");
    const modal = document.getElementById(modalId);
    if (modal && typeof modal.showModal === "function") {
      modal.showModal();
    }
  });
});

modalCloseBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = btn.closest("dialog");
    if (modal && typeof modal.close === "function") {
      modal.close();
    }
  });
});

document.querySelectorAll("dialog.site-modal").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      dialog.close();
    }
  });
});

// Copy link functionality for article sharing
const copyLinkBtn = document.getElementById("copyLinkBtn");
const copyToast = document.getElementById("copyToast");

if (copyLinkBtn && copyToast) {
  copyLinkBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyToast.classList.add("show");
      setTimeout(() => {
        copyToast.classList.remove("show");
      }, 2500);
    } catch {
      // Fallback
      const tempInput = document.createElement("input");
      tempInput.value = window.location.href;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      copyToast.classList.add("show");
      setTimeout(() => {
        copyToast.classList.remove("show");
      }, 2500);
    }
  });
}
