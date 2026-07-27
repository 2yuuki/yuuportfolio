(() => {
  const page = document.querySelector('.cargo-work-template');
  if (!page || typeof HTMLDialogElement === 'undefined') return;

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

  const close = () => {
    dialog.close();
    dialog.classList.remove('is-magnified');
    document.documentElement.classList.remove('has-image-zoom-open');
  };

  page.addEventListener('click', (event) => {
    const image = event.target.closest('img');
    if (!image || !page.contains(image)) return;

    event.preventDefault();
    event.stopPropagation();

    const media = image.closest('figure, media-item');
    const mediaCaption = media?.querySelector('figcaption');

    zoomedImage.src = image.currentSrc || image.src;
    zoomedImage.alt = image.alt || 'Expanded project image';
    caption.textContent = mediaCaption?.textContent.trim() || image.alt || '';
    caption.hidden = !caption.textContent;

    dialog.classList.remove('is-magnified');
    dialog.showModal();
    document.documentElement.classList.add('has-image-zoom-open');
    closeButton.focus({ preventScroll: true });
  });

  zoomedImage.addEventListener('click', () => {
    dialog.classList.toggle('is-magnified');
  });

  closeButton.addEventListener('click', close);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  dialog.addEventListener('close', () => {
    dialog.classList.remove('is-magnified');
    document.documentElement.classList.remove('has-image-zoom-open');
  });
})();
