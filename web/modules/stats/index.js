import React, { useState } from 'react';
import Filter from './filter';
import { useFetch } from '../hooks';
import BarChart from './barchart';
import LineChart from './linechart';

// homepage = readme?
// slider for month
// open code in modal on mobil

// TODO: joins / parts / kick / etc = stacked area chart

// pad hours

function Stats({ history, location }) {
    const { fetchAPI } = useFetch();
    const [base, setBase] = useState({ servers: [] });
    const [stats, setStats] = useState({});

    return (
        <div className="stats">
            <Filter
                history={history}
                location={location}
                base={base}
                onChange={({ month, server, channel }) => {
                    fetchAPI('stats/all', {
                        body: { month, server, channel },
                        method: 'POST',
                    })
                        .then(setStats)
                        .catch(console.error);
                }}
                onMonth={({ month }) => {
                    fetchAPI('stats/base', {
                        body: { month },
                        method: 'POST',
                    })
                        .then(setBase)
                        .catch(console.error);
                }}
            />
            <div className="row">
                <div className="base">
                    <h4>total commands</h4>
                    <span>{base.commands}</span>
                    <h4>uptime</h4>
                    <span>{base.uptime}h</span>
                    <h4>servers</h4>
                    <span>{base.servers.length}</span>
                </div>
                <div className="command-chart">
                    <h3 className="title">most used commands</h3>
                    <BarChart
                        items={stats.commands}
                        accessor={d => d.command}
                    />
                </div>
            </div>

            <div className="row">
                <div className="half">
                    <h3 className="title">activity / days</h3>
                    <LineChart
                        items={stats.activityDays}
                        accessor={d => d.day}
                        tickFormatX={d => d.slice(3)}
                    />
                </div>
                <div className="half">
                    <h3 className="title">activity / hours</h3>
                    <LineChart
                        items={stats.activityHours}
                        accessor={d => d.hour}
                    />
                </div>
            </div>
            <pre>
                {JSON.stringify([stats.activityDays],0,4)}
            </pre>
        </div>
    );
}

export default Stats;
