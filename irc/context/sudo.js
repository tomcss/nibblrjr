function sudo({ IRC, callback, node, print }) {
    if (node.get('admins', []).includes(IRC.message.from)) {
        const checkAccess = (name) => {
            const ref = {};
            const noticeHandler = (from, to, text) => {
                if (text.toUpperCase().startsWith(name)) {
                    const [msg, nick, status] = text.split(' ');
                    try {
                        if (status == 3) {
                            callback(node.client);
                        } else {
                            throw new Error('not logged in');
                        }
                    } catch(e) {
                        print(`{r}${e.name||'Error'}:{/} ${e.message}`);
                    }
                    node.client.removeListener('notice', noticeHandler);
                    clearTimeout(ref.timer);
                }
            };
            ref.timer = setTimeout(() => {
                node.client.removeListener('notice', noticeHandler);
            }, 3000);
            node.client.addListener('notice', noticeHandler);
            node.client.say('NickServ', `${name} ${IRC.message.from}`);
        };
        if (node.address == 'irc.freenode.net') {
            checkAccess('ACC');
        } else if (node.address == 'irc.rizon.net') {
            checkAccess('STATUS');
        } else if (node.address == 'irc.furnet.org') {
            checkAccess('STATUS');
        } else {
            throw new Error('unsupported server');
        }
    } else {
        throw new Error('no access');
    }
}

module.exports = { sudo };
