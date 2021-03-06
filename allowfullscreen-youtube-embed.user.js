// ==UserScript==
// @name        Allow full screen on embedded Youtube
// @namespace   mwisnicki@gmail.com
// @homepage    https://github.com/mwisnicki/userscripts/blob/master/allowfullscreen-youtube-embed.user.js
// @match       *://*/*
// @grant       none
// @version     6
// @author      mwisnicki@gmail.com
// @description ViolentMonkey script
// ==/UserScript==

const URLs = [
  "https://www.youtube.com/embed/",
  "https://youtube.com/embed/",
  "https://www.youtube-nocookie.com/embed/"
];

const SELECTOR = URLs.map(url => `iframe[src^="${url}"]:not([allowfullscreen])`).join(', ');

function reloadIframe(iframe) {
  iframe.src = iframe.src;
}

function fixVideos() {
  const iframes = document.body.querySelectorAll(SELECTOR)
  for (const iframe of iframes) {
    iframe.setAttribute("allowfullscreen","");
    reloadIframe(iframe);
    console.log("Forced Youtube allowfullscreen on %o", iframe);
  }
}

fixVideos();

new MutationObserver(fixVideos).observe(document, { childList: true, subtree: true });
