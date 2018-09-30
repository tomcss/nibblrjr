const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

async function getText(...args) {
    return await getWeb('text', ...args);
}
async function getJSON(...args) {
    return await getWeb('json', ...args);
}
async function getDOM(...args) {
    const html = await getWeb('text', ...args);
    const dom = new JSDOM(html);
    // not allowed for opaque origins (we don't need them anyway)
    delete dom.window.localStorage;
    delete dom.window.sessionStorage;
    return {
        ...dom.window,
        // DOM shortcuts
        body: dom.window.document.body,
        qs: (selector) => {
            return dom.window.document.querySelector(selector) || {};
        },
        qsa: (selector) => {
            return [...dom.window.document.querySelectorAll(selector)] || [];
        },
    };
}
async function getWeb(type, url, options = {}) {
    const res = await fetch(url, options);
    const out = await res[type]();
    return out;
}

module.exports = {
    getJSON,
    getDOM,
    getText,
};
