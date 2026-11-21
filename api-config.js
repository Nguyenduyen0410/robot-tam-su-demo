(function () {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  window.MYKA_API_BASE = window.MYKA_API_BASE || (isLocal ? 'http://127.0.0.1:8000' : '');
  window.MYKA_PRODUCTION_API = window.MYKA_PRODUCTION_API || 'http://103.147.186.177:5004';
  window.MYKA_TELEGRAM_GROUP_URL = window.MYKA_TELEGRAM_GROUP_URL || 'https://web.telegram.org/a/#-1004358354552';
})();
