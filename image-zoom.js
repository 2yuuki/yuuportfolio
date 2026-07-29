(() => {
  const artworkRoots = Array.from(document.querySelectorAll(
    '.cargo-work-template, .portfolio-index'
  ));
  if (!artworkRoots.length || typeof HTMLDialogElement === 'undefined') return;

  const artworkImages = Array.from(document.querySelectorAll(
    [
      '.cargo-work-template img',
      '.portfolio-index .masonry-row img',
      '.portfolio-index .homepage-horizontal-gallery img'
    ].join(', ')
  ));
  if (!artworkImages.length) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'image-zoom-dialog';
  dialog.setAttribute('aria-label', 'Expanded project image');
  dialog.innerHTML = `
    <button class="image-zoom-dialog__close" type="button" aria-label="Close expanded image">×</button>
    <div class="image-zoom-dialog__stage">
      <img class="image-zoom-dialog__image" alt="">
      <div class="image-zoom-dialog__caption caption"></div>
    </div>
  `;
  document.body.appendChild(dialog);

  const zoomedImage = dialog.querySelector('.image-zoom-dialog__image');
  const caption = dialog.querySelector('.image-zoom-dialog__caption');
  const closeButton = dialog.querySelector('.image-zoom-dialog__close');
  let panFrame = 0;

  const text = (element) => element?.textContent.trim() || '';

  const imageDetails = (image) => {
    const media = image.closest('figure, media-item');
    const mediaCaption = media?.querySelector('figcaption');
    if (text(mediaCaption)) return text(mediaCaption);

    const project = image.closest('.masonry-row column-unit');
    if (project) {
      const title = text(project.querySelector('b'));
      const detail = Array.from(project.querySelectorAll('span')).find(
        (element) => {
          const value = text(element);
          return value && (
            element.classList.contains('project-card__detail') ||
            element.getAttribute('style')?.includes('rgba(0,0,0,0.4)') ||
            element.getAttribute('style')?.includes('rgba(0, 0, 0, 0.4)')
          );
        }
      );
      const projectDetails = [title, text(detail)].filter(Boolean).join(' — ');
      if (projectDetails) return projectDetails;
    }

    return image.alt.trim();
  };

  const visibleArtworkImage = (image) => {
    const rotator = image.closest('.project-card__rotator');
    if (!rotator) return image;

    return Array.from(rotator.querySelectorAll('img')).reduce(
      (visibleImage, candidate) => (
        Number.parseFloat(getComputedStyle(candidate).opacity) >
        Number.parseFloat(getComputedStyle(visibleImage).opacity)
          ? candidate
          : visibleImage
      ),
      image
    );
  };

  const openImage = (image) => {
    image = visibleArtworkImage(image);
    const details = imageDetails(image);
    const expandedSource = (
      image.dataset.mediaSrc ||
      image.currentSrc ||
      image.src
    );

    zoomedImage.src = expandedSource;
    zoomedImage.alt = image.alt || 'Expanded project image';
    caption.textContent = details;
    caption.hidden = !details;

    dialog.classList.remove('is-magnified');
    dialog.scrollTo({ left: 0, top: 0 });
    dialog.showModal();
    document.documentElement.classList.add('has-image-zoom-open');
    closeButton.focus({ preventScroll: true });
  };

  const close = () => {
    dialog.close();
    dialog.classList.remove('is-magnified');
    dialog.scrollTo({ left: 0, top: 0 });
    document.documentElement.classList.remove('has-image-zoom-open');
  };

  const panToPointer = (event) => {
    if (!dialog.classList.contains('is-magnified')) return;

    const pointerX = Math.min(
      1,
      Math.max(0, event.clientX / window.innerWidth)
    );
    const pointerY = Math.min(
      1,
      Math.max(0, event.clientY / window.innerHeight)
    );

    cancelAnimationFrame(panFrame);
    panFrame = requestAnimationFrame(() => {
      const horizontalRange = dialog.scrollWidth - dialog.clientWidth;
      const verticalRange = dialog.scrollHeight - dialog.clientHeight;
      dialog.scrollLeft = Math.max(0, horizontalRange * pointerX);
      dialog.scrollTop = Math.max(0, verticalRange * pointerY);
    });
  };

  artworkImages.forEach((image) => {
    image.classList.add('artwork-zoom-target');
    image.closest('media-item')?.classList.add('artwork-interactive-media');
    image.setAttribute('tabindex', '0');
    image.setAttribute('role', 'button');
    image.setAttribute(
      'aria-label',
      `Zoom image: ${imageDetails(image) || image.alt || 'project artwork'}`
    );

    image.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      openImage(image);
    });
  });

  artworkRoots.forEach((root) => {
    root.addEventListener('click', (event) => {
      const image = event.target.closest('img.artwork-zoom-target');
      if (!image || !root.contains(image)) return;

      event.preventDefault();
      event.stopPropagation();
      openImage(image);
    });
  });

  zoomedImage.addEventListener('click', (event) => {
    dialog.classList.toggle('is-magnified');
    if (!dialog.classList.contains('is-magnified')) {
      dialog.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
      return;
    }
    requestAnimationFrame(() => panToPointer(event));
  });

  dialog.addEventListener('mousemove', panToPointer);
  closeButton.addEventListener('click', close);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  dialog.addEventListener('close', () => {
    dialog.classList.remove('is-magnified');
    dialog.scrollTo({ left: 0, top: 0 });
    document.documentElement.classList.remove('has-image-zoom-open');
  });
})();
