(() => {
  const canonical = document.querySelector('link[rel="canonical"]');

  if (canonical?.href) {
    window.location.replace(canonical.href);
  }
})();
