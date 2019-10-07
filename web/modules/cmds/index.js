import React, { useState, useEffect, useCallback }  from 'react';
import { Route } from 'react-router-dom';
import Checkbox from '../checkbox';
import Lock from './lock';

import Editor from './editor';
import CmdList from './cmd-list';
import Default from './default';
import { useFetch } from '../hooks';

import reserved from '../../../base/reserved';
import { parseCommand } from '../../../irc/evaluate/scripts/parse-command';

function Cmds({ history }) {
    const [commands, setCommands] = useState([]);
    const [search, setSearch] = useState('');
    const [starred, setStarred] = useState(false);
    const [locked, setLocked] = useState(false);
    const [newName, setNewName] = useState('');
    const { fetchAPI, admin } = useFetch();

    const updateList = useCallback(() => {
        fetchAPI('command/list')
            .then(setCommands)
            .catch(console.error);
    }, []);

    useEffect(updateList, []);

    // command filtering

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

    // is the new value valid

    const exists = commands.some(d => d.name === newName);
    const { root } = parseCommand({ text: newName });
    const parent = commands.find(d => d.name === root);
    const isLocked = parent && parent.locked;
    const isReserved = reserved.includes(newName);
    const isValid = !isReserved && !exists && (!isLocked || admin);

    const handleNew = useCallback((e) => {
        if (e.keyCode === 13 && isValid) {
            const name = encodeURIComponent(newName);
            fetchAPI(`command/new/${name}`, { method: 'POST' })
                .then(() => {
                    setNewName('');
                    history.push(`/cmds/${name}`);
                })
                .catch(console.error);
        }
    }, [newName]);

    return (
        <>
            <div className="cmd-menu">
                <div>
                    <input
                        type="text"
                        placeholder="new command"
                        className={!isValid && newName ? 'invalid' : ''}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value.replace(/\s+/g, ''))}
                        onKeyDown={handleNew}
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
            <Route exact path="/cmds/:name" render={(props) => (
                <EditorPane updateList={updateList} {...props} />
            )} />
            <Route exact path="/cmds" component={Default} />
        </>
    );
}

function EditorPane({ updateList, history, match: { params } }) {
    const { fetchAPI, admin } = useFetch();
    const [cmd, setCmd] = useState({ command: '/* loading ... */' });
    const [saveText, setSaveText] = useState('save');
    const [deleteText, setDeleteText] = useState('delete');

    useEffect(() => {
        fetchAPI('command/get/' + params.name)
            .then(setCmd)
            .catch(console.error);
        setSaveText('save');
        setDeleteText('delete');
    }, [params.name]);

    const toggleOption = (type) => {
        const init = { method: 'POST', body: { [type]: !cmd[type] } };
        fetchAPI('command/set-config/' + params.name, init)
            .then(obj => {
                if (!obj.error) {
                    setCmd({
                        ...cmd,
                        [type]: !cmd[type],
                    });
                    updateList();
                }
            })
            .catch(console.error);
    };

    const save = () => {
        setSaveText('saving');
        const init = { method: 'POST', body: { command: cmd.command } };
        fetchAPI('command/set/' + params.name, init)
            .then(obj => {
                if (!obj.error) {
                    setSaveText('saved');
                } else {
                    setSaveText(obj.error);
                }
            })
            .catch(console.error);
    };

    const _delete = () => {
        if (deleteText !== 'confirm?') {
            setDeleteText('confirm?');
        } else {
            fetchAPI('command/delete/' + params.name, { method: 'POST' })
                .then(obj => {
                    if (!obj.error) {
                        history.push('/cmds');
                    } else {
                        setDeleteText(obj.error);
                    }
                })
                .catch(console.error);
        }
    };

    const source = cmd.error ? `/* error: ${cmd.error} */` : cmd.command;
    const { locked, starred } = cmd;

    const isAdmin = admin;
    const readOnly = cmd.locked && !isAdmin;

    return (
        <Editor
            value={source}
            readOnly={readOnly}
            onChange={(code) => {
                setCmd({ ...cmd, command: code });
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
                                <button
                                    type="button"
                                    onClick={save}
                                >
                                    {saveText}
                                </button>
                                {isAdmin && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                toggleOption('locked');
                                            }}>
                                            {locked ? 'unlock' : 'lock'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                toggleOption('starred');
                                            }}>
                                            {starred ? 'unstar' : 'star'}
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={_delete}
                                >
                                    {deleteText}
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
