const util = require('util');
const vm = require('vm');

Object.assign(util.inspect.styles, { null: 'red' });

function evaluate({ input }, debug = false) {
    const context = {};

    try {
        const evaluation = vm.runInNewContext(input, context, {
            displayErrors: false,
            timeout: 3000,
            filename: 'purple',
        });

        if (debug) {
            return debugColors(evaluation);
        }
        else {
            return evaluation;
        }
    } catch(e) {
        return `\u000304${e.name}: ${e.message}`;
    }
}

function debugColors(evaluation) {
    const output = util.inspect(evaluation, { depth: 2, colors: true })
        .replace(/\s+/g, ' ')
        .replace(new RegExp('\u001b\\[39m', 'g'), '\u000f')// reset
        .replace(new RegExp('\u001b\\[31m', 'g'), '\u000313') // null
        .replace(new RegExp('\u001b\\[33m', 'g'), '\u000307') // num / bool
        .replace(new RegExp('\u001b\\[32m', 'g'), '\u000303')// str
        .replace(new RegExp('\u001b\\[90m', 'g'), '\u000314')// str
        .replace(new RegExp('\u001b\\[36m', 'g'), '\u000310');// func

    // console.log('eval', [input, evaluation, output]);
    if (output.length > 396) {
        return output.slice(0, 396) + '\u000f ...';
    }
    else {
        return output;
    }
}

module.exports = {
    evaluate,
};