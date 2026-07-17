/** Inline bootstrap shared by Vite `index.html` and Next `app/layout.tsx`. */
export const PLAUSIBLE_SCRIPT_SRC = 'https://plausible.io/js/pa-qS64-8TBss7LqFOqZiRmp.js'
export const PLAUSIBLE_PRODUCTION_HOSTNAME = 'puddlesmap.com'

/**
 * Production-only Plausible loader + queue stub.
 * Safe to embed as an inline `<script>` — no-ops off the production hostname.
 */
export const PLAUSIBLE_BOOTSTRAP_SCRIPT = `(function () {
  var host = location.hostname;
  if (host !== 'puddlesmap.com' && host !== 'www.puddlesmap.com') return;
  window.plausible =
    window.plausible ||
    function () {
      (plausible.q = plausible.q || []).push(arguments);
    };
  plausible.init =
    plausible.init ||
    function (i) {
      plausible.o = i || {};
    };
  var s = document.createElement('script');
  s.async = true;
  s.src = '${PLAUSIBLE_SCRIPT_SRC}';
  document.head.appendChild(s);
})();`
