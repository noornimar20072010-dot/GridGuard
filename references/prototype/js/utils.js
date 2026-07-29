/* GridGuard — small formatting and DOM helpers. */
window.GG = window.GG || {};

GG.utils = (function () {
  const STATUS = {
    normal: { key: 'normal', label: 'Normal', color: GG.config.color.ok, text: 'text-ok', bg: 'bg-ok', rank: 0 },
    warning: { key: 'warning', label: 'Warning', color: GG.config.color.warn, text: 'text-warn', bg: 'bg-warn', rank: 1 },
    critical: { key: 'critical', label: 'Critical', color: GG.config.color.crit, text: 'text-crit', bg: 'bg-crit', rank: 2 },
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function num(value, decimals = 1) {
    return Number(value).toFixed(decimals);
  }

  /* Escapes text before it goes into an innerHTML template. */
  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  function clockLabel(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function agoLabel(date, now) {
    const seconds = Math.max(0, Math.round((now - date) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.round(minutes / 60)}h ago`;
  }

  /* Worst status across a list of statuses — used to roll zone/grid colour up. */
  function worstStatus(statuses) {
    return statuses.reduce((worst, current) => (
      STATUS[current].rank > STATUS[worst].rank ? current : worst
    ), 'normal');
  }

  /* Rated line current at the nominal three-phase voltage. */
  function ratedAmps(ratedMva) {
    return (ratedMva * 1e6) / (Math.sqrt(3) * GG.config.nominalKv * 1000);
  }

  function statusOf(key) {
    return STATUS[key] || STATUS.normal;
  }

  function on(root, event, selector, handler) {
    root.addEventListener(event, (evt) => {
      const match = evt.target.closest(selector);
      if (match && root.contains(match)) handler(evt, match);
    });
  }

  function debounce(fn, wait) {
    let timer = null;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  return { STATUS, clamp, num, esc, clockLabel, agoLabel, worstStatus, ratedAmps, statusOf, on, debounce };
})();
