const codes = {
    r: '04',
    dr: '05',
    w: '00',
    bl: '01',
    c: '11',
    dc: '10',
    b: '12',
    db: '02',
    g: '09',
    dg: '03',
    p: '13',
    dp: '06',
    o: '07',
    y: '08',
    gr: '15',
    dgr: '14',

    // formatting
    u: '\u001f',
    bo: '\u0002',
    i: '\u001D',

    bell: '\x07',

    // reset
    '/': '\u000f',
};

const rainbow = 'roygcbp';
const rand = ['r', 'y', 'c', 'o', 'p', 'dc', 'g'];

function parseColors(text) {
    let rainbowIndex = 0;

    if (typeof text != 'string') {
        text = text && typeof text.toString == 'function' ? text.toString() : '';
    }

    return text
        // multiline
        .split('\n')
        .reduce((a, c) => {
            const lastLine = a[a.length-1];
            if (lastLine) {
                const matches = lastLine.match(/{(.*?)}/g);
                const last = matches && matches.pop();
                return [...a, last ? last + c : c];
            }
            else {
                return [...a, c];
            }
        },[])
        .join('\n')
        // rainbow
        .replace(/{rb}(.*?)({(.*?)}|$)/gsm, (str, key, key2) => {
            return [...key].map((ch, i) => {
                return `{${rainbow[rainbowIndex++%rainbow.length]}}${ch}`;
            }).join('') + key2;
        })
        // formatting
        .replace(/{(u|bo|i|bell|\/)}/g, (str, key) => {
            return codes[key];
        })
        // random colour
        .replace(/{rand}/g, () => `{${rand[0|Math.random()*rand.length]}}`)
        // fg
        .replace(/{(.*?)}/gs, (str, key) => {
            if (!codes[key]) {
                return str;
            }
            else {
                return `\u0003${codes[key]}`;
            }
        })
        // fg & bg
        .replace(/{(.*?),(.*?)}/gsm, (str, key1, key2) => {
            const [a, b] = [key1.trim(), key2.trim()];
            if (codes[a] && codes[b]) {
                return `\u0003${codes[a]},${codes[b]}`;
            }
            else {
                return str;
            }
        });
}

const hash = (str) => {
    str = str.toLowerCase().trim();
    const index = [...str].map(d => d.charCodeAt(0)).reduce((a,b) => a+b)%rand.length|0;
    return `{${rand[index]}}`;
};

const nick = (str, withBrackets = true) => {
    const nick = `${hash(str)}${str}{/}`;
    return withBrackets ? `{bo}<{/}${nick}{bo}>{/}` : nick;
};

const link = (str) => {
    return `{dc}{u}${str}{/}`;
};

const error = (e) => {
    if (!(e instanceof Error || e.name && e.message)) {
        return `{r}>>{/} ${e}`;
    } else {
        if (e.name !== 'Error') {
            return `{r}${e.name}:{/} ${e.message}`;
        } else {
            return `{r}>>{/} ${e.message}`;
        }
    }
};

const success = (message) => {
    return `{g}>>{/} ${message}`;
};

const info = (message) => {
    return `{b}>>{/} ${message}`;
};

const strip = (str) => (
    String(str)
        .replace(/(\x03\d{0,2}(,\d{0,2}|\x02\x02)?|\x0f|\x07|\x1D|\x02|\x1f)/g, '')
);

const getColorFuncs = (trigger) => {
    const colors = (str) => parseColors(str);
    return Object.assign(colors, {
        hash, nick, link,
        error, success, info,
        strip,
        cmd: (str, input, params) => {
            const iStr = Array.isArray(input)
                ? ' ' + input.map(param => `{bo}[${param}]{/}`).join` `
                : (input ? ` {bo}[${input}]{/}` : '');
            const pStr = Array.isArray(params)
                ? `(${params.map(d => `{r}${d}{p}`).join`, `})`
                : (params ? `({r}${params}{p})`: '');
            return `{p}${trigger}${str}${pStr}{/}${iStr}`;
        },
    });
};

module.exports = {
    parseColors,
    getColorFuncs,
    notify: { error, info, success },
    nick,
};
