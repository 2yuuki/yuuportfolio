(() => {
  if (window.__yuuProcessBookViewerLoaded) return;
  window.__yuuProcessBookViewerLoaded = true;

  const frames = Array.from(document.querySelectorAll('.process-book-frame'))
    .filter((frame) => frame.querySelector('iframe[src*=".pdf"]'));
  if (!frames.length) return;

  const PDFJS_MODULE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  let pdfjsPromise;

  const loadPdfJs = () => {
    if (!pdfjsPromise) {
      pdfjsPromise = import(PDFJS_MODULE).then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        return pdfjs;
      });
    }
    return pdfjsPromise;
  };

  const withoutHash = (url) => {
    const parsed = new URL(url, window.location.href);
    parsed.hash = '';
    return parsed.href;
  };

  const createButton = (className, label, symbol) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    button.textContent = symbol;
    return button;
  };

  const enhanceFrame = async (frame) => {
    if (frame.dataset.processBookReady) return;
    frame.dataset.processBookReady = 'loading';

    const iframe = frame.querySelector('iframe[src*=".pdf"]');
    const source = withoutHash(iframe.src);
    const viewer = document.createElement('div');
    viewer.className = 'process-book-viewer';
    viewer.setAttribute('aria-label', iframe.title || 'Process book');
    viewer.innerHTML = `
      <div class="process-book-viewer__stage" aria-live="polite">
        <div class="process-book-viewer__loading">Loading process book…</div>
        <div class="process-book-viewer__spread"></div>
      </div>
      <div class="process-book-viewer__controls"></div>
      <div class="process-book-viewer__thumbnails" role="list" aria-label="Process book pages"></div>
    `;

    const stage = viewer.querySelector('.process-book-viewer__stage');
    const spread = viewer.querySelector('.process-book-viewer__spread');
    const controls = viewer.querySelector('.process-book-viewer__controls');
    const thumbnails = viewer.querySelector('.process-book-viewer__thumbnails');
    const zoomOut = createButton('process-book-viewer__zoom-out', 'Zoom out', '−');
    const zoomIn = createButton('process-book-viewer__zoom-in', 'Zoom in', '+');
    const counter = document.createElement('span');
    counter.className = 'process-book-viewer__counter';
    const zoomReset = createButton('process-book-viewer__zoom-reset', 'Reset zoom', '100%');
    const zoomControls = document.createElement('span');
    zoomControls.className = 'process-book-viewer__zoom-controls';
    zoomControls.append(zoomOut, zoomReset, zoomIn);
    controls.append(counter, zoomControls);
    frame.append(viewer);

    try {
      const pdfjs = await loadPdfJs();
      const loadingTask = pdfjs.getDocument({
        url: source,
        disableAutoFetch: true,
        rangeChunkSize: 131072
      });
      const pdf = await loadingTask.promise;
      let currentPage = 1;
      let zoom = 1;
      let renderVersion = 0;
      let resizeTimer;
      let isPanning = false;
      let hasMoved = false;
      let suppressClick = false;
      let panStartX = 0;
      let panStartY = 0;
      let panStartScrollLeft = 0;
      let panStartScrollTop = 0;
      const thumbObserver = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              observer.unobserve(entry.target);
              renderThumbnail(entry.target).catch(() => {});
            });
          }, { root: thumbnails, rootMargin: '160px' })
        : null;

      const pagesPerView = () => window.matchMedia('(max-width: 768px)').matches ? 1 : 2;

      const renderPage = async (pageNumber, shell, version) => {
        if (pageNumber > pdf.numPages || version !== renderVersion) return;
        const page = await pdf.getPage(pageNumber);
        if (version !== renderVersion) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(1, spread.clientWidth / pagesPerView() - 6);
        const availableHeight = Math.max(1, stage.clientHeight - 18);
        const cssScale = Math.min(
          availableWidth / baseViewport.width,
          availableHeight / baseViewport.height
        ) * zoom;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
        const viewport = page.getViewport({ scale: cssScale * pixelRatio });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${Math.ceil(viewport.width / pixelRatio)}px`;
        canvas.style.height = `${Math.ceil(viewport.height / pixelRatio)}px`;
        canvas.setAttribute('aria-label', `Page ${pageNumber}`);
        shell.append(canvas);
        await page.render({ canvasContext: context, viewport }).promise;
        shell.classList.add('is-rendered');
      };

      const updateSelectedThumbnail = () => {
        thumbnails.querySelectorAll('.is-current').forEach((item) => item.classList.remove('is-current'));
        const count = pagesPerView();
        for (let page = currentPage; page < currentPage + count; page += 1) {
          thumbnails.querySelector(`[data-page="${page}"]`)?.classList.add('is-current');
        }
        thumbnails.querySelector(`[data-page="${currentPage}"]`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      };

      const renderSpread = async (direction = 0) => {
        const version = ++renderVersion;
        const count = pagesPerView();
        const lastVisible = Math.min(pdf.numPages, currentPage + count - 1);
        counter.textContent = count === 2 && lastVisible !== currentPage
          ? `${currentPage}–${lastVisible} / ${pdf.numPages}`
          : `${currentPage} / ${pdf.numPages}`;
        const newSpread = document.createElement('div');
        newSpread.className = 'process-book-viewer__pages';
        if (direction) newSpread.classList.add(direction > 0 ? 'turn-from-right' : 'turn-from-left');
        for (let offset = 0; offset < count; offset += 1) {
          const pageNumber = currentPage + offset;
          if (pageNumber > pdf.numPages) break;
          const shell = document.createElement('div');
          shell.className = 'process-book-viewer__page';
          if (count === 2 && offset === 0) shell.classList.add('is-left-page');
          if (count === 2 && offset === 1) shell.classList.add('is-right-page');
          newSpread.append(shell);
          renderPage(pageNumber, shell, version).catch(() => {});
        }
        spread.replaceChildren(newSpread);
        updateSelectedThumbnail();
      };

      const goToPage = (pageNumber, direction) => {
        const step = pagesPerView();
        const maxStart = Math.max(1, pdf.numPages - step + 1);
        currentPage = Math.min(maxStart, Math.max(1, pageNumber));
        renderSpread(direction);
      };

      const renderThumbnail = async (button) => {
        if (button.dataset.rendered) return;
        button.dataset.rendered = 'true';
        const page = await pdf.getPage(Number(button.dataset.page));
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = 84 / baseViewport.width;
        const viewport = page.getViewport({ scale });
        const canvas = button.querySelector('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport }).promise;
        button.classList.add('is-rendered');
      };

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'process-book-viewer__thumbnail';
        thumb.dataset.page = String(pageNumber);
        thumb.setAttribute('role', 'listitem');
        thumb.setAttribute('aria-label', `Go to page ${pageNumber}`);
        thumb.innerHTML = `<span class="process-book-viewer__thumbnail-canvas"><canvas></canvas></span><span>${pageNumber}</span>`;
        thumb.addEventListener('click', () => {
          const direction = pageNumber >= currentPage ? 1 : -1;
          goToPage(pageNumber, direction);
        });
        thumbnails.append(thumb);
        if (thumbObserver) thumbObserver.observe(thumb);
        else renderThumbnail(thumb).catch(() => {});
      }

      stage.addEventListener('click', (event) => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        const bounds = stage.getBoundingClientRect();
        const position = event.clientX - bounds.left;
        if (position <= bounds.width * 0.25) goToPage(currentPage - pagesPerView(), -1);
        if (position >= bounds.width * 0.75) goToPage(currentPage + pagesPerView(), 1);
      });
      stage.addEventListener('pointerdown', (event) => {
        if (zoom <= 1 || event.button !== 0) return;
        isPanning = true;
        hasMoved = false;
        panStartX = event.clientX;
        panStartY = event.clientY;
        panStartScrollLeft = stage.scrollLeft;
        panStartScrollTop = stage.scrollTop;
        stage.classList.add('is-panning');
        stage.setPointerCapture(event.pointerId);
      });
      stage.addEventListener('pointermove', (event) => {
        if (!isPanning) return;
        const deltaX = event.clientX - panStartX;
        const deltaY = event.clientY - panStartY;
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) hasMoved = true;
        stage.scrollLeft = panStartScrollLeft - deltaX;
        stage.scrollTop = panStartScrollTop - deltaY;
        event.preventDefault();
      });
      const stopPanning = (event) => {
        if (!isPanning) return;
        isPanning = false;
        suppressClick = hasMoved;
        stage.classList.remove('is-panning');
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      };
      stage.addEventListener('pointerup', stopPanning);
      stage.addEventListener('pointercancel', stopPanning);
      const setZoom = (nextZoom) => {
        zoom = Math.min(2.5, Math.max(1, nextZoom));
        zoomReset.textContent = `${Math.round(zoom * 100)}%`;
        zoomOut.disabled = zoom <= 1;
        zoomIn.disabled = zoom >= 2.5;
        stage.classList.toggle('is-zoomed', zoom > 1);
        renderSpread();
      };
      zoomOut.addEventListener('click', () => setZoom(zoom - 0.25));
      zoomIn.addEventListener('click', () => setZoom(zoom + 0.25));
      zoomReset.addEventListener('click', () => setZoom(1));
      viewer.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') goToPage(currentPage - pagesPerView(), -1);
        if (event.key === 'ArrowRight') goToPage(currentPage + pagesPerView(), 1);
        if (event.key === '+' || event.key === '=') zoomIn.click();
        if (event.key === '-') zoomOut.click();
        if (event.key === '0') zoomReset.click();
      });
      window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => renderSpread(), 180);
      }, { passive: true });

      frame.classList.add('is-enhanced');
      iframe.hidden = true;
      frame.dataset.processBookReady = 'true';
      await renderSpread();
    } catch (error) {
      viewer.remove();
      frame.dataset.processBookReady = 'error';
      console.warn('Process book viewer could not be loaded.', error);
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        currentObserver.unobserve(entry.target);
        enhanceFrame(entry.target);
      });
    }, { rootMargin: '0px', threshold: 0.01 });
    frames.forEach((frame) => observer.observe(frame));
  } else {
    frames.forEach(enhanceFrame);
  }
})();
