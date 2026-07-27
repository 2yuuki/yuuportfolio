(() => {
  document.querySelectorAll('iframe[data-youtube-embed]').forEach((frame) => {
    const source = new URL(frame.getAttribute('src'), window.location.href);
    source.searchParams.set('enablejsapi', '1');
    source.searchParams.set('origin', window.location.origin);
    source.searchParams.set('widget_referrer', window.location.href);
    frame.src = source.toString();
  });
})();
