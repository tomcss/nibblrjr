const { parseCommand } = require('../irc/evaluate/scripts/parse-command');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const reserved = require('../base/reserved');

function commandPath(name = '') {
    return path.join(__dirname, '../commands', name);
}

function commandHash(name) {
    const hash = crypto.createHmac('sha1', 'nibblr').update(name).digest('hex').slice(0,12);
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').slice(0,128);
    return `${clean}-${hash}`;
}

function getCommand(name) {
    const filename = commandPath(commandHash(name) + '.json');
    if (!fs.existsSync(filename)) return;
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function setCommand(obj) {
    const filename = commandPath(commandHash(obj.name) + '.json');
    fs.writeFileSync(filename, JSON.stringify(obj, null, 4), 'utf8');
}

function deleteCommand(name) {
    fs.unlinkSync(commandPath(commandHash(name) + '.json'));
}

function getAllCommands() {
    const commands = [];
    const commandList = fs.readdirSync(commandPath());
    for (let i = 0; i < commandList.length; i++) {
        const filename = commandPath(commandList[i]);
        commands.push(JSON.parse(fs.readFileSync(filename, 'utf8')));
    }
    return commands;
}

function createCommandDB() {
    const get = (name) => {
        const obj = getCommand(name);
        if (!obj) return;
        const { root } = parseCommand({ text: name });
        if (name == root) return obj;
        const parent = getCommand(root);
        if (!parent) return obj;
        return {
            ...parent,
            name,
            command: obj.command,
        };
    };

    const list = () => {
        // some kind of caching/indexing would improve performance here
        const cmdList = getAllCommands();
        return cmdList.map(cmd => {
            delete cmd.command;
            const { root } = parseCommand({ text: cmd.name });
            if (cmd.name == root) return cmd;
            // const parent = getCommand(root);
            const parent = cmdList.find(d => d.name == root);
            if (!parent) return cmd;
            const obj = {
                ...parent,
                name: cmd.name
            };
            delete obj.command;
            return obj;
        });
    };

    const set = (name, value) => {
        const safeName = name.replace(/\s+/g, '');
        const options = getCommand(name) || {
            locked: false,
            starred: false,
        };
        setCommand({
            ...options,
            name,
            command: value,
        });
    };

    const setConfig = (name, config) => {
        // only operates on the parent (if it exists)
        const { root } = parseCommand({ text: name });
        const parent = getCommand(root);
        const realName = parent ? root : name;
        const obj = getCommand(realName);
        setCommand(Object.assign(obj, config));
    };

    // public API

    const names = () => {
        return getAllCommands().map(cmd => cmd.name);
    };

    const count = () => {
        return fs.readdirSync(commandPath()).length;
    };

    const setSafe = (name, value) => {
        const obj = get(name);
        const isReserved = reserved.includes(name);
        const parentCmdName = parseCommand({text: name}).list[0];
        const parentCmd = get(parentCmdName);
        if (
            obj && obj.locked
            || isReserved
            || !obj && parentCmd && parentCmd.locked
        ) {
            return false;
        }
        else {
            set(name, value);
            return true;
        }
    };

    const deleteSafe = (name) => {
        const obj = get(name);
        if (obj && obj.locked) {
            return false;
        } else {
            deleteCommand(name);
            return true;
        }
    };

    const getCommandFns = (node) => ({
        get,
        list,
        names,
        count,
        setSafe,
        deleteSafe,
    });

    return {
        get, delete: deleteCommand, set, list, setConfig, getCommandFns,
    };
}

module.exports = {
    createCommandDB,
    commandHash,
};
