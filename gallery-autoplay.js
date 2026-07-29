(() => {
  const AUTOPLAY_DELAY = 2000;
  const SLIDE_DURATION = 1200;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const createAutoplay = (element, advance) => {
    let timer = null;
    let visible = false;
    let pausedByUser = false;

    const stop = () => {
      if (timer === null) return;
      window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (!visible || pausedByUser || document.hidden) return;
      timer = window.setInterval(advance, AUTOPLAY_DELAY);
    };

    element.addEventListener("pointerenter", () => {
      pausedByUser = true;
      stop();
    });
    element.addEventListener("pointerleave", () => {
      pausedByUser = false;
      start();
    });
    element.addEventListener("focusin", () => {
      pausedByUser = true;
      stop();
    });
    element.addEventListener("focusout", () => {
      pausedByUser = false;
      start();
    });
    document.addEventListener("visibilitychange", start);

    if (!("IntersectionObserver" in window)) {
      visible = true;
      start();
      return { restart: start };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) start();
        else stop();
      },
      { rootMargin: "100px 0px", threshold: 0.05 }
    );
    observer.observe(element);
    return { restart: start };
  };

  const syncSlideMedia = (slides, activeIndex) => {
    slides.forEach((slide, index) => {
      slide.querySelectorAll("video").forEach((video) => {
        if (index === activeIndex && video.dataset.autoplay === "true") {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    });
  };

  document.querySelectorAll("gallery-slideshow").forEach((gallery) => {
    const slides = Array.from(gallery.children).filter(
      (child) => child.tagName === "MEDIA-ITEM"
    );
    if (slides.length < 2) return;

    gallery.classList.add("is-horizontal-autoplay");
    let index = 0;
    let animating = false;

    slides.forEach((slide, slideIndex) => {
      slide.style.display = "block";
      slide.style.visibility = slideIndex === 0 ? "visible" : "hidden";
      slide.style.transform = slideIndex === 0
        ? "translateX(0)"
        : "translateX(100%)";
      slide.setAttribute("aria-hidden", slideIndex === 0 ? "false" : "true");
    });

    const showSlide = (nextIndex, direction = 1) => {
      if (animating) return;
      const target = (nextIndex + slides.length) % slides.length;
      if (target === index) return;

      const current = slides[index];
      const next = slides[target];
      animating = true;
      next.style.transition = "none";
      next.style.visibility = "visible";
      next.style.transform = `translateX(${direction * 100}%)`;
      next.setAttribute("aria-hidden", "false");
      current.setAttribute("aria-hidden", "true");

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const transition = reduceMotion
            ? "none"
            : `transform ${SLIDE_DURATION}ms cubic-bezier(.22,.61,.36,1)`;
          current.style.transition = transition;
          next.style.transition = transition;
          current.style.transform = `translateX(${-direction * 100}%)`;
          next.style.transform = "translateX(0)";
        });
      });

      window.setTimeout(() => {
        current.style.visibility = "hidden";
        current.style.transition = "none";
        index = target;
        gallery.dataset.autoplayIndex = String(index);
        syncSlideMedia(slides, index);
        animating = false;
      }, reduceMotion ? 0 : SLIDE_DURATION);
    };

    const autoplay = createAutoplay(
      gallery,
      () => showSlide(index + 1, 1)
    );
    gallery.addEventListener("gallery:previous", () => {
      showSlide(index - 1, -1);
      autoplay.restart();
    });
    gallery.addEventListener("gallery:next", () => {
      showSlide(index + 1, 1);
      autoplay.restart();
    });
  });

  const startScrollingGallery = (gallery, viewport, slides) => {
    if (!viewport || slides.length < 2) return;
    let index = 0;
    let animationFrame = null;

    const animateTo = (targetLeft) => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      if (reduceMotion) {
        viewport.scrollLeft = targetLeft;
        return;
      }

      const startLeft = viewport.scrollLeft;
      const distance = targetLeft - startLeft;
      const startTime = performance.now();

      const frame = (time) => {
        const progress = Math.min((time - startTime) / SLIDE_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        viewport.scrollLeft = startLeft + distance * eased;
        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(frame);
        } else {
          animationFrame = null;
        }
      };

      animationFrame = window.requestAnimationFrame(frame);
    };

    const showSlide = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      viewport.dataset.autoplayIndex = String(index);
      animateTo(Math.round(index * viewport.clientWidth));
      syncSlideMedia(slides, index);
    };

    viewport.addEventListener("scrollend", () => {
      if (viewport.clientWidth) {
        index = Math.round(viewport.scrollLeft / viewport.clientWidth);
      }
    });
    viewport.addEventListener("scroll", () => {
      if (viewport.clientWidth) {
        index = Math.round(viewport.scrollLeft / viewport.clientWidth);
      }
    }, { passive: true });

    createAutoplay(gallery, () => showSlide(index + 1));
  };

  document.querySelectorAll("[data-memory-slider]").forEach((gallery) => {
    startScrollingGallery(
      gallery,
      gallery.querySelector("[data-slider-track]"),
      Array.from(gallery.querySelectorAll(".memory-output-slider__slide"))
    );
  });

  document
    .querySelectorAll("[data-project-horizontal-gallery]")
    .forEach((gallery) => {
      startScrollingGallery(
        gallery,
        gallery.querySelector(".project-horizontal-gallery__viewport"),
        Array.from(
          gallery.querySelectorAll(".project-horizontal-gallery__slide")
        )
      );
    });

  document.querySelectorAll("[data-horizontal-gallery]").forEach((gallery) => {
    startScrollingGallery(
      gallery,
      gallery.querySelector(".homepage-horizontal-gallery__viewport"),
      Array.from(
        gallery.querySelectorAll(".homepage-horizontal-gallery__slide")
      )
    );
  });

  document.querySelectorAll(".project-card__rotator").forEach((rotator) => {
    const slides = Array.from(rotator.querySelectorAll("img"));
    if (slides.length < 2) return;

    rotator.classList.add("is-horizontal-autoplay");
    let index = 0;
    let animating = false;

    slides.forEach((slide, slideIndex) => {
      slide.style.display = "block";
      slide.style.animation = "none";
      slide.style.transition = "none";
      slide.style.visibility = slideIndex === 0 ? "visible" : "hidden";
      slide.style.transform = slideIndex === 0
        ? "translateX(0)"
        : "translateX(100%)";
      slide.style.opacity = "1";
      slide.setAttribute("aria-hidden", slideIndex === 0 ? "false" : "true");
    });

    const showNext = () => {
      if (animating) return;
      const target = (index + 1) % slides.length;
      const current = slides[index];
      const next = slides[target];
      animating = true;

      next.style.transition = "none";
      next.style.visibility = "visible";
      next.style.transform = "translateX(100%)";
      next.setAttribute("aria-hidden", "false");
      current.setAttribute("aria-hidden", "true");

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const transition = reduceMotion
            ? "none"
            : `transform ${SLIDE_DURATION}ms cubic-bezier(.22,.61,.36,1)`;
          current.style.transition = transition;
          next.style.transition = transition;
          current.style.transform = "translateX(-100%)";
          next.style.transform = "translateX(0)";
        });
      });

      window.setTimeout(() => {
        current.style.visibility = "hidden";
        current.style.transition = "none";
        current.style.transform = "translateX(100%)";
        index = target;
        rotator.dataset.autoplayIndex = String(index);
        animating = false;
      }, reduceMotion ? 0 : SLIDE_DURATION);
    };

    createAutoplay(rotator, showNext);
  });
})();
