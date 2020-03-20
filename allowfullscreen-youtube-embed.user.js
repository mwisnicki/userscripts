// ==UserScript==
// @name        Allow full screen on embedded Youtube
// @namespace   mwisnicki@gmail.com
// @match       *://*/*
// @grant       none
// @version     1.0
// @author      mwisnicki@gmail.com
// @description 3/8/2020, 10:42:28 PM
// ==/UserScript==

function fixVideos() {
  const iframes = document.body.querySelectorAll('iframe[src^="https://www.youtube.com/embed/"]:not([allowfullscreen])')
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
