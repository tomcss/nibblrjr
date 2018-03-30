import { observable, action } from 'mobx';
import { stringify, parse } from 'zipson';

class Environment {

    constructor() {
        // do socket stuff
        this.ws = new WebSocket('ws://' + location.host);

        this.ws.sendObj = (_type, obj = {}) => {
            this.ws.send(stringify({ ...obj, _type }));
        };

        this.ws.addEventListener('message', (e) => {
            try {
                const { _type, ...obj } = parse(e.data);
                if (_type == 'RELOAD') {
                    location.reload();
                }
                else {
                    this.onMessage(_type, obj);
                }
            }
            catch (e) {
                console.error(e);
            }
        });

        this.ws.addEventListener('open', this.onConnected);
        this.ws.addEventListener('close', () => location.reload());
    }

    @observable connected = false;
    @observable admin = false;
    @observable list = [];

    @action onConnected = () => {
        this.connected = true;
    };

    @action onMessage = (type, obj) => {
        const types = ({
            'COMMANDS': () => {
                if (obj.list) {
                    this.list.replace(obj.list);
                }
            },
            'AUTH': () => {
                if (obj.success) {
                    this.admin = true;
                }
            },
        });
        types[type] && types[type]();
    };

    @action getList = () => {
        this.ws.sendObj('COMMANDS', {getList: true});
    };

    @action getCommand = (name) => {
        this.ws.sendObj('COMMANDS', {getCommand: name});
    };

    @action setCommand = (name, commandData) => {
        this.ws.sendObj('COMMANDS', {setCommand: {name, commandData}});
    };

    @action login = (password) => {
        this.ws.sendObj('AUTH', {password});
    };

}

export const env = new Environment();
