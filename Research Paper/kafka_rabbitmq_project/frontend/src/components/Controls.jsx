import { useState, useCallback } from 'react';
import './Controls.css';

export function Controls({ broker, setBroker, nodes, setNodes, connected, onConnect, onDisconnect, onSpeed, onSimulate }) {
  const [speedValue, setSpeedValue] = useState(1.0);

  const handleSpeed = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setSpeedValue(val);
    onSpeed(val);
  }, [onSpeed]);

  return (
    <div className="controls-container">
      <div className="controls">
        <div className="control-group">
          <label>Broker</label>
          <select value={broker} onChange={(e) => setBroker(e.target.value)}>
            <option value="kafka">Apache Kafka</option>
            <option value="rabbitmq">RabbitMQ</option>
            <option value="rest">REST (Baseline)</option>
          </select>
        </div>
        <div className="control-group">
          <label>Nodes</label>
          <select value={nodes} onChange={(e) => setNodes(parseInt(e.target.value))}>
            <option value="1">1 Node</option>
            <option value="3">3 Nodes</option>
            <option value="5">5 Nodes</option>
          </select>
        </div>
        <div className="control-group speed-control">
          <label>Speed (seconds)</label>
          <input
            type="range"
            min="0.2"
            max="3"
            step="0.1"
            value={speedValue}
            onChange={handleSpeed}
          />
          <div className="speed-label-value">{speedValue.toFixed(1)}s</div>
        </div>
        <div className="button-group">
          <button onClick={onConnect} disabled={connected}>
            🔗 Connect Live
          </button>
          <button onClick={onDisconnect} disabled={!connected}>
            🔌 Disconnect
          </button>
          <button onClick={onSimulate}>
            ▶️ Auto Simulate
          </button>
        </div>
      </div>
    </div>
  );
}
