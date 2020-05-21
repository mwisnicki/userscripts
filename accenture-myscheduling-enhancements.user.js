// ==UserScript==
// @name        Accenture MyScheduling enhancements
// @description Shows more information in search results
// @namespace   https://openuserjs.org/users/marwis84
// @match       https://mysched.accenture.com/me
// @match       https://mysched.accenture.com/me/*
// @grant       GM.addStyle
// @version     1.0
// @author      mwisnicki@gmail.com
// ==/UserScript==

'use strict';

GM.addStyle(`

.userscript {
    color: #0275d8;
    font-size: 0.8em;
}

`);

const sources = {};
const roles = {};

function getElementByXPath(path, parent) {
    return document.evaluate(path, parent || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function updateRow(roleRow) {
    const idElement = roleRow.querySelector('.role-id');
    if (!idElement)
        return;

    const id = idElement.innerText;
    const durationCell = getElementByXPath(".//span[contains(text(),'Duration')]/..", roleRow);
    const source = sources[id];

    if (!source) {
        console.error("Missing source for %s", id);
        return;
    }

    const endDate = new Date(source.roleEndDate);
    const endDateStr = endDate.toISOString().split('T')[0];

    durationCell.insertAdjacentHTML('beforeend', `<div class="userscript endDate">${endDateStr}</div>`);
}

function updateTable() {
    console.log("updating table");
    document.querySelectorAll('.userscript').forEach(e => e.remove());

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
                        // odata endpoints have different schemas, for now just map what we need to sources
                        sources[id] = Object.assign(sources[id] || {}, {
                            id: id,
                            roleEndDate: v.EndDate
                        });
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
