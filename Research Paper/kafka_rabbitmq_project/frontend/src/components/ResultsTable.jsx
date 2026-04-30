import './ResultsTable.css';

export function ResultsTable({ paperResults, broker, nodes }) {
  const data = [
    { broker: 'kafka', nodes: 1 },
    { broker: 'kafka', nodes: 3 },
    { broker: 'kafka', nodes: 5 },
    { broker: 'rabbitmq', nodes: 1 },
    { broker: 'rabbitmq', nodes: 3 },
    { broker: 'rabbitmq', nodes: 5 },
    { broker: 'rest', nodes: 1 }
  ];

  return (
    <div className="card">
      <div className="card-title">📊 Research Results</div>
      <table>
        <thead>
          <tr>
            <th>System</th>
            <th>Nodes</th>
            <th>Throughput</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const result = paperResults?.[row.broker]?.[row.nodes];
            const isActive = broker === row.broker && nodes === row.nodes;
            return (
              <tr key={idx} className={isActive ? 'active' : ''}>
                <td><span className={`badge badge-${row.broker}`}>{row.broker.toUpperCase()}</span></td>
                <td>{row.nodes}</td>
                <td>{result?.throughput?.toLocaleString()}  </td>
                <td>{result?.latency_ms}ms</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
