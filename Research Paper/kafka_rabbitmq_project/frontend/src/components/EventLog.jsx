import './EventLog.css';

export function EventLog({ events }) {
  return (
    <div className="card">
      <div className="card-title">📡 Event Stream (Last 15)</div>
      <div className="event-list">
        {events.length === 0 ? (
          <div className="event-item">
            <span className="event-time">Waiting for connection...</span>
          </div>
        ) : (
          events.map((e, idx) => (
            <div key={idx} className={`event-item event-item-${e.broker}`}>
              <span className="event-time">{e.time}</span>
              <span>
                <span className="event-broker">{e.broker.toUpperCase()}</span> @{e.nodes}n • {(e.throughput/1e3).toFixed(0)}K msg/s • {e.latency.toFixed(1)}ms
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
