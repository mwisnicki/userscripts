// ==UserScript==
// @namespace   https://openuserjs.org/users/marwis84
// @name        Autofill AliorBank Kantor password
// @description Adds normal password input which should work with autofill.
// @license     MIT
// @version     3
// @match       https://systemkantor.aliorbank.pl/login
// @run-at      document-start
// @grant       none
// ==/UserScript==

// capture log since it's overriden later
const log = console.log;

function passwordReady(maskedPasswordBox) {
  log("Autofill AliorBank password");
  
  const loginForm = document.querySelector("form#log-in-form");
  const passwordInput = document.querySelector("input[name=password]");
  const submitButton = document.querySelector("button[type=submit]");
  const boxes = maskedPasswordBox.querySelectorAll("input:not(.disabled)");
  
  passwordInput.style.visibility = 'initial';
  passwordInput.oninput = () => {
    const password = passwordInput.value;
    for (const box of boxes) {
      const i = Number(box.parentElement.querySelector("label").innerText) - 1;
      if (password.length > i)
        box.value = password[i];
    }
  };

  submitButton.disabled = false;
}

window.onload = function() {

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const added of record.addedNodes) {
        const maskedPasswordBox = added.querySelector && added.querySelector(".masked-password");
        if (maskedPasswordBox)
          setTimeout(() => passwordReady(maskedPasswordBox));
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
};
