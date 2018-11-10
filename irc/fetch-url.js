const http = require('http');
const https = require('https');
const fs = require('fs');
const URL = require('url');
const _ = require('lodash');

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();


function fetchURL(text, print, disableRedirect) {

    const url = text.match(/(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig);

    if (url && url[0] && text.toLowerCase().indexOf('##') == -1) {

        let totalSize = 0;
        let output = '';

        const request = url[0].startsWith('https') ? https : http;
        const parsed = URL.parse(url[0]);

        const options = {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-GB,en;q=0.5',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:64.0) Gecko/20100101 Firefox/64.0',
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache',
            },
            hostname: parsed.hostname,
            path: parsed.path,
        };

        request.get(options, res => {
            if (isRedirect(res.statusCode)) {
                // redirect
                const newURL = String(_.get(res, 'headers.location'));
                if (newURL.startsWith('/')) {
                    const newAbsURL = `${parsed.protocol}//${parsed.host}${newURL}`;
                    fetchURL(newAbsURL, print, true);
                } else {
                    fetchURL(newURL, print, true);
                }
            } else {
                res.on('data', (chunk) => {
                    totalSize += chunk.length;

                    if (totalSize > 5242880) { // 512kb
                        return res.destroy();
                    }

                    output += chunk;
                }).on('end', () => {
                    const title = /<title[^>]*>([\S\s]+?)<\/title>/ig.exec(output);

                    if (title && title[1]) {
                        const cleanTitle = entities.decode(title[1]).replace(/\s+/g, ' ').trim();

                        const str = `\u000312>>\u000f ${cleanTitle}`;

                        if (str.length < 400) {
                            print(str);
                        } else {
                            print(`${str.slice(0, 397)} ...`);
                        }
                    }
                });
            }
        });

    }

};

function isRedirect(code) {
    return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
}

module.exports = {
    fetchURL,
};
