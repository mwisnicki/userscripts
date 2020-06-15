// ==UserScript==
// @name        Automatically sign-in to correct Microsoft account
// @namespace   https://openuserjs.org/users/marwis84
// @match       https://login.microsoftonline.com/*
// @run-at      document-idle
// @grant       none
// @version     1.1
// @author      mwisnicki@gmail.com
// ==/UserScript==

// TODO add checkbox to remember selection by redirect_uri, origin or tenant.

const url = new URL(document.location.href);

function parseId(id) {
  const [user, domain] = id.split(/@/);
  return {id, user, domain};
}

function selectUser(options) {
  const redirect_uri = new URL(url.searchParams.get("redirect_uri"));
  const ids = options.map(element => ({element, ...parseId(element.dataset.testId)}));
  
  console.log('Found possible IDs: ', ids);
  
  const matching = ids.filter(i => redirect_uri.hostname.endsWith(i.domain));

  if (matching.length = 1) {
    const id = matching[0];
    console.log(`Matched redirect_uri=${redirect_uri} with id=${id.id}.`);
    //url.searchParams.append('domain_hint', id.domain);
    //document.location.replace(url.href);
    id.element.click();
  }
}

function waitForOptions(delay, elapsed) {
  setTimeout(function() {
    const options = document.querySelectorAll('[data-test-id][role=option]');
    if (options.length > 0) {
      selectUser(Array.from(options));
    } else {
      if (elapsed > 5000) {
        console.error('timeout');
      } else {
        waitForOptions(delay, elapsed + delay);
      }
    }
  }, delay);
}


if (!url.searchParams.has('domain_hint') && url.searchParams.has('redirect_uri')) {
  console.log("Waiting for logon options...");
  waitForOptions(200, 0);
}
