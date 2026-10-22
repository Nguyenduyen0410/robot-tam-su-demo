(function () {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  window.MYKA_API_BASE = window.MYKA_API_BASE || (isLocal ? 'http://127.0.0.1:8000' : '');
})();
