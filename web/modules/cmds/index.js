import React, { useState, useEffect }  from 'react';
import { Route } from 'react-router-dom';
import reserved from '../../../base/reserved';
import Checkbox from '../checkbox';
import Lock from './lock';

import Editor from './editor';
import CmdList from './cmd-list';
import Default from './default';

function Cmds() {
    const [commands, setCommands] = useState([]);
    const [search, setSearch] = useState('');
    const [starred, setStarred] = useState(false);
    const [locked, setLocked] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        fetch('/api/command/list')
            .then(res => res.json())
            .then(setCommands)
            .catch(console.error);
    }, []);

    let rx;
    try { rx = new RegExp(search); }
    catch(e) {}

    const commandFltr = commands.filter((cmd) => {
        return (
            ((cmd.starred && starred) || !starred)
            && ((cmd.locked && locked) || !locked)
        );
    });
    const commandSrch = commandFltr.filter(d => !search || d.name.match(rx));

    return (
        <>
            <div className="cmd-menu">
                <div>
                    <input
                        type="text"
                        placeholder="new command"
                        value={newName}
                        onChange={(_e) => {}}
                    />
                    <input
                        type="text"
                        placeholder="search commands (regex)"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                        }}
                    />
                    <div className="cmd-filter">
                        <span> {commandSrch.length} / {commandFltr.length} </span>
                        <div className="cmd-toggle">
                            <span className="star">★</span>
                            <Checkbox
                                checked={starred}
                                onChange={() => setStarred(!starred)}
                            />
                            <Lock />
                            <Checkbox
                                checked={locked}
                                onChange={() => setLocked(!locked)}
                            />
                        </div>
                    </div>
                </div>

                <CmdList commands={commandSrch} />
            </div>
            <Route path="/cmds/:name" component={EditorPane} />
            <Route exact path="/cmds" component={Default} />

        </>
    );
}

function EditorPane({ match: { params } }) {
    const [cmd, setCmd] = useState({ command: '/* loading ... */' });

    // save n minutes ago

    useEffect(() => {
        fetch('/api/command/get/' + params.name)
            .then(res => res.json())
            .then(setCmd)
            .catch(console.error);
    }, [params.name]);

    const source = cmd.error ? `/* error: ${cmd.error} */` : cmd.command;
    const { locked, starred } = cmd;

    const isAdmin = false;
    const readOnly = cmd.locked && !isAdmin;

    return (
        <Editor
            value={source}
            readOnly={readOnly}
            onChange={(code) => {
                const newCmd = { ...cmd, command: code };
                setCmd(newCmd);
            }}
        >
            <div className="cmd-options">
                <span className="cmd-name">
                    {cmd.name}
                    {cmd.starred && <span className="star"> ★</span>}
                    {' '}
                    {cmd.locked && <Lock />}
                </span>
                {!!cmd.name && (
                    <div>
                        {!readOnly && (
                            <>
                                <button type="button">
                                    save
                                </button>
                                <button type="button">
                                    delete
                                </button>
                            </>
                        )}
                        {isAdmin && (
                            <>
                                <button type="button">
                                    {locked ? 'unlock' : 'lock'}
                                </button>
                                <button type="button">
                                    {starred ? 'unstar' : 'star'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Editor>
    );
}

export default Cmds;
