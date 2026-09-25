(() => {
  const root = document.querySelector('.portfolio-index');
  const filter = root?.querySelector('.homepage-year-filter');
  if (!root || !filter) return;

  const buttons = Array.from(filter.querySelectorAll('[data-year-filter]'));
  const rows = Array.from(root.querySelectorAll('.masonry-row'));
  const roleHeadings = Array.from(root.querySelectorAll('.commercial-role-heading'));
  const status = root.querySelector('.homepage-year-filter__status');

  const projects = rows.flatMap((row) => {
    return Array.from(row.querySelectorAll(':scope > column-unit'))
      .filter((unit) => unit.querySelector('media-item, img, video, iframe'))
      .map((unit) => {
        const detectedYear = unit.textContent.match(/\b20(?:22|23|24|25|26)\b/)?.[0];
        return {
          unit,
          year: unit.dataset.projectYear || detectedYear || ''
        };
      });
  });

  const updateRoleHeadings = () => {
    roleHeadings.forEach((heading) => {
      let sibling = heading.nextElementSibling;
      let hasVisibleProject = false;

      while (sibling && !sibling.matches('.commercial-role-heading')) {
        if (sibling.matches('.masonry-row') && !sibling.hidden) {
          hasVisibleProject = true;
          break;
        }
        sibling = sibling.nextElementSibling;
      }

      heading.hidden = !hasVisibleProject;
    });
  };

  const updateStatus = (selectedYear) => {
    if (!status) return;
    const isVietnamese = document.documentElement.lang === 'vi';
    status.textContent = selectedYear === 'all'
      ? (isVietnamese ? 'Đang hiển thị toàn bộ dự án.' : 'Showing all projects.')
      : (isVietnamese
        ? `Đang hiển thị dự án năm ${selectedYear}.`
        : `Showing projects from ${selectedYear}.`);
  };

  const applyFilter = (selectedYear) => {
    projects.forEach(({ unit, year }) => {
      unit.hidden = selectedYear !== 'all' && year !== selectedYear;
    });

    rows.forEach((row) => {
      const projectUnits = projects.filter(({ unit }) => unit.parentElement === row);
      row.hidden = projectUnits.length > 0 && projectUnits.every(({ unit }) => unit.hidden);
    });

    updateRoleHeadings();

    buttons.forEach((button) => {
      const isActive = button.dataset.yearFilter === selectedYear;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    updateStatus(selectedYear);
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.yearFilter || 'all'));
  });

  applyFilter('all');
  window.addEventListener('yuu:languagechange', () => {
    const selectedYear = buttons.find((button) => button.classList.contains('is-active'))?.dataset.yearFilter || 'all';
    updateStatus(selectedYear);
  });
})();
