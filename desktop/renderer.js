window.addEventListener("DOMContentLoaded", () => {
  const runtimeNode = document.getElementById("runtimeBadge");
  const conceptLinks = Array.from(document.querySelectorAll("[data-concept-link]"));
  const conceptSections = Array.from(document.querySelectorAll("[data-concept-section]"));

  if (runtimeNode && window.alionit?.versions) {
    const { electron, chrome, node } = window.alionit.versions;
    runtimeNode.textContent = `Electron ${electron} | Chromium ${chrome} | Node ${node}`;
  }

  function setActiveConcept(hash) {
    const nextHash = hash || "#community-first";

    conceptLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === nextHash;
      link.classList.toggle("is-active", isActive);
    });

    conceptSections.forEach((section) => {
      const isCurrent = `#${section.id}` === nextHash;
      section.classList.toggle("is-current", isCurrent);
    });
  }

  conceptLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetHash = link.getAttribute("href");
      const targetSection = document.querySelector(targetHash);

      if (!targetSection) {
        return;
      }

      event.preventDefault();
      history.replaceState(null, "", targetHash);
      setActiveConcept(targetHash);
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  window.addEventListener("hashchange", () => {
    setActiveConcept(window.location.hash);
  });

  if ("IntersectionObserver" in window && conceptSections.length > 0) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const hash = `#${visibleEntry.target.id}`;
        setActiveConcept(hash);
        history.replaceState(null, "", hash);
      },
      {
        threshold: [0.35, 0.65],
        rootMargin: "-10% 0px -30% 0px"
      }
    );

    conceptSections.forEach((section) => {
      observer.observe(section);
    });
  }

  setActiveConcept(window.location.hash);
});
