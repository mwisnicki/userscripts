// ==UserScript==
// @name        Accenture MyScheduling enhancements
// @description Shows more information in search results
// @namespace   https://openuserjs.org/users/marwis84
// @match       https://mysched.accenture.com/me
// @match       https://mysched.accenture.com/me/*
// @grant       GM.addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_registerMenuCommand
// @version     3.0
// @author      mwisnicki@gmail.com
// ==/UserScript==

'use strict';

// Configuration
// =============

const debug = GM_getValue('debug', false);
// persisting data makes it available regardless of whether you visited main page but at the risk of showing stale data
const persistent = GM_getValue('persistent', true);

GM_registerMenuCommand((debug ? 'Disable' : 'Enable') + ' debug', () => {
  GM_setValue('debug', !debug);
  location.reload();
});

GM_registerMenuCommand((debug ? 'Disable' : 'Enable') + ' persistence', () => {
  GM_setValue('persistent', !persistent);
  location.reload();
});


// Storage
// =======

const sources = persistent && GM_getValue('sources', {}) || {};
const roles = persistent && GM_getValue('roles', {}) || {};


// Styles
// ======

GM.addStyle(`

.GM_injected.endDate {
    color: #0275d8;
    font-size: 0.8em;
}

.GM_injected.status {
    cursor: default;
}

.GM_ht:hover .GM_tooltip {
    display: block;
}

.GM_tooltip {
    display: none;
    color: red;
    margin-left: 10px;
    margin-top: -4px;
    max-width: 700px;
    position: absolute;
    z-index: 1000;
    background: wheat;
    font: initial;
    font-size: small;
    box-shadow: 2px 2px 5px 3px #0000005e;
}

.roleAccordionDescription {
    white-space: pre-line;
}

`);


// Helpers
// =======

function getElementByXPath(path, parent) {
    return document.evaluate(path, parent || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}


// Logic
// =====

function updateRow(roleRow) {
    const idElement = roleRow.querySelector('.role-id');
    if (!idElement)
        return;

    const id = idElement.innerText;
    const durationCell = getElementByXPath(".//span[contains(text(),'Duration')]/..", roleRow);
    const favoriteCell = getElementByXPath(".//favorite-icon/..", roleRow);
    const source = sources[id];
    const role = roles[id];
  
    if (debug) {
      roleRow.GM_data = { source, role };
      idElement.classList.add("GM_ht")
      idElement.insertAdjacentHTML('beforeend', `<div class="GM_injected GM_tooltip"><pre>${JSON.stringify({ role, source }, undefined, 4)}</pre></div>`);
    }
  
    if (source && durationCell) {
        const endDate = new Date(source.roleEndDate);
        const endDateStr = endDate.toISOString().split('T')[0];

        durationCell.insertAdjacentHTML('beforeend', `<div class="GM_injected endDate">${endDateStr}</div>`);
    } else {
        console.error("Missing source for %s", id);
    }
  
    // TODO this only works if user visits main page first or persistence is enabled, otherwise TrackAssignment is not loaded
    if (role && favoriteCell) {
      let statusStr = "";
      if (role.AppliedDate) {
        statusStr += `<span title="Applied ${role.AppliedDate}">✉</span>`;
      }
      if (role.StatusSequence > 0) {
        statusStr += `<span title="Updated ${role.UpdateDate}">⏳</span>`;
      }
      favoriteCell.insertAdjacentHTML('beforeend', `<div class="GM_injected status">${statusStr}</div>`);
    }
}

function updateTable() {
    console.log("updating table");
    document.querySelectorAll('.GM_injected').forEach(e => e.remove());

    const roleRows = document.querySelectorAll('role-table-view tbody tr:not([data-type=row-details])');

    for (const roleRow of roleRows)
        updateRow(roleRow);
}

document.addEventListener("click", e => {
    if (e.target.matches(".pagination *"))
        setTimeout(() => updateTable(sources), 10);
}, true);

function hookXHR() {
    let _xhrOpen = XMLHttpRequest.prototype.open;
    if (_xhrOpen._unhooked) {
        _xhrOpen = _xhrOpen._unhooked;
    }
    function refresh() {
        // TODO detect when table is loaded
        setTimeout(() => updateTable(sources), 1000);
    }
    XMLHttpRequest.prototype.open = function (method, url) {
        if (url == "https://mysched-searchandmatchsvc.accenture.com/api/search/" ||
            url == "https://mysched-searchandmatchsvc.accenture.com/api/matchbyid/") {
            this.addEventListener("load", function (e) {
                const response = JSON.parse(this.responseText);
                for (const hit of response.hits.hits) {
                    if (hit._source && hit._source.id) {
                        const id = hit._source.id;
                        sources[id] = Object.assign(sources[id] || {}, hit._source);
                        GM_setValue('sources', sources);
                    }
                }
                refresh();
            });
        }
        if (url.startsWith("https://myschedulingsvc.accenture.com/services/ReplyToRoleDetails-service/RoleFavorite") ||
            url.startsWith("https://myschedulingsvc.accenture.com/services/TrackAssignment-service/TrackAssignment")) {
            this.addEventListener("load", function (e) {
                const response = JSON.parse(this.responseText);
                for (const v of response.value) {
                    if (v.RoleKey) {
                        const id = v.RoleKey;
                        roles[id] = Object.assign(roles[id] || {}, v);
                        GM_setValue('roles', roles);
                        // odata endpoints have different schemas, for now just map what we need to sources
                        sources[id] = Object.assign(sources[id] || {}, {
                            id: id,
                            roleEndDate: v.EndDate
                        });
                        GM_setValue('sources', sources);
                    }
                }
                refresh();
            });
        }
        return _xhrOpen.apply(this, arguments);
    }
    XMLHttpRequest.prototype.open._unhooked = _xhrOpen;
    console.log("hooked XHR");
}

hookXHR();
