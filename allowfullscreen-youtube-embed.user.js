// ==UserScript==
// @name        Allow full screen on embedded Youtube
// @namespace   mwisnicki@gmail.com
// @website     https://github.com/mwisnicki/userscripts/blob/master/allowfullscreen-youtube-embed.user.js
// @match       *://*/*
// @grant       none
// @version     2
// @author      mwisnicki@gmail.com
// @description ViolentMonkey script
// ==/UserScript==

const SELECTOR = [
  `iframe[src^="https://www.youtube.com/embed/"]:not([allowfullscreen])`,
  `iframe[src^="https://youtube.com/embed/"]:not([allowfullscreen])`
].join(', ');

function fixVideos() {
  const iframes = document.body.querySelectorAll(SELECTOR)
  for (const iframe of iframes) {
    iframe.setAttribute("allowfullscreen","");
    // force reload
    // TODO maybe there's a way to refresh state without reload?
    const span = document.createElement("span");
    iframe.replaceWith(span);
    span.replaceWith(iframe);
    console.log("Forced Youtube allowfullscreen on %o", iframe);
  }
}

fixVideos();

new MutationObserver(fixVideos).observe(document, { childList: true, subtree: true });
