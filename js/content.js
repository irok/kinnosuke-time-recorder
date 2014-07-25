/*global KTR */

chrome.runtime.sendMessage({
    html: document.body.innerHTML
});

