const WebSocket = require('ws');
const { msgHandler } = require('./msg');

module.exports = function initSocket({parent, server}) {
    const wss = new WebSocket.Server({server});

    wss.sendAll = (_type, obj = {}) => {
        wss.clients.forEach((client) => {
            if (client.readyState == WebSocket.OPEN) {
                client.send(JSON.stringify({ ...obj, _type, }));
            }
        });
    };

    wss.on('connection', (ws) =>  {
        ws.sendObj = (_type, obj = {}) => {
            ws.send(JSON.stringify({ ...obj, _type, }));
        };

        const api = msgHandler({parent, ws});

        ws.on('message', (message) => {
            try {
                const { _type, ...obj } = JSON.parse(message);
                api(_type, obj);
            }
            catch (e) {
                console.error(e);
            }
        });
    });

    return wss;
};
