(() => {
  const facebookFrames = Array.from(
    document.querySelectorAll('iframe[data-facebook-autoplay="true"]')
  );

  const startFacebookFrame = (frame) => {
    if (frame.dataset.autoplayStarted === "true") return;
    const url = new URL(frame.src, window.location.href);
    url.searchParams.set("autoplay", "true");
    frame.dataset.autoplayStarted = "true";
    frame.src = url.href;
  };

  if (facebookFrames.length) {
    if (!("IntersectionObserver" in window)) {
      facebookFrames.forEach(startFacebookFrame);
    } else {
      const facebookObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            startFacebookFrame(entry.target);
            facebookObserver.unobserve(entry.target);
          });
        },
        { rootMargin: "300px 0px", threshold: 0.01 }
      );
      facebookFrames.forEach((frame) => facebookObserver.observe(frame));
    }
  }

  const videos = Array.from(document.querySelectorAll("video"));
  if (!videos.length) return;

  videos.forEach((video) => {
    video.preload = "none";

    const updateOrientation = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      video.classList.toggle(
        "is-portrait-video",
        video.videoHeight > video.videoWidth
      );
      video.classList.toggle(
        "is-landscape-video",
        video.videoWidth >= video.videoHeight
      );
    };

    if (video.readyState >= 1) {
      updateOrientation();
    } else {
      video.addEventListener("loadedmetadata", updateOrientation);
    }

    if (video.hasAttribute("autoplay")) {
      video.removeAttribute("autoplay");
      video.dataset.autoplay = "true";
    }
  });

  const updateVideo = (video, visible) => {
    if (!visible) {
      video.pause();
      return;
    }
    if (video.dataset.autoplay === "true") {
      video.play().catch(() => {});
    }
  };

  if (!("IntersectionObserver" in window)) {
    videos.forEach((video) => updateVideo(video, true));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        updateVideo(entry.target, entry.isIntersecting);
      });
    },
    { rootMargin: "300px 0px", threshold: 0.01 }
  );

  videos.forEach((video) => observer.observe(video));
})();
