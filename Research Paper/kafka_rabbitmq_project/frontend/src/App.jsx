import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { LiveChart } from './components/LiveChart';
import { KpiCard } from './components/KpiCard';
import { EventLog } from './components/EventLog';
import { ResultsTable } from './components/ResultsTable';
import './App.css';

export default function App() {
  const [connected, setConnected] = useState(false);
  const [broker, setBroker] = useState('kafka');
  const [nodes, setNodes] = useState(5);
  const [liveTP, setLiveTP] = useState('—');
  const [liveLatency, setLiveLatency] = useState('—');
  const [events, setEvents] = useState([]);
  const [paperResults, setPaperResults] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], throughput: [], latency: [] });
  const [toast, setToast] = useState(null);

  const sseRef = useRef(null);

  useEffect(() => {
    fetch('/metrics/all')
      .then(r => r.json())
      .then(data => {
        setPaperResults(data.paper_results);
      })
      .catch(err => console.error('Load error:', err));
  }, []);

  const connect = useCallback(() => {
    if (sseRef.current) sseRef.current.close();

    const url = `/metrics/stream?broker=${broker}&nodes=${nodes}`;
    sseRef.current = new EventSource(url);

    sseRef.current.onopen = () => {
      setConnected(true);
      showToast('Connected!');
    };

    sseRef.current.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data);
        if (m.broker === broker && m.nodes === nodes) {
          const label = new Date(m.timestamp * 1000).toLocaleTimeString();
          const time = new Date(m.timestamp * 1000).toLocaleTimeString();

          setChartData(prev => {
            const newLabels = [...prev.labels, label];
            const newTP = [...prev.throughput, m.throughput_mps];
            const newLat = [...prev.latency, m.latency_ms];

            if (newLabels.length > 60) {
              newLabels.shift();
              newTP.shift();
              newLat.shift();
            }

            return { labels: newLabels, throughput: newTP, latency: newLat };
          });

          setLiveTP(m.throughput_mps >= 1e6 ? (m.throughput_mps/1e6).toFixed(2) + 'M' : (m.throughput_mps/1e3).toFixed(0) + 'K');
          setLiveLatency(m.latency_ms.toFixed(1) + 'ms');

          setEvents(prev => {
            const newEvents = [...prev, { broker: m.broker, nodes: m.nodes, throughput: m.throughput_mps, latency: m.latency_ms, time }];
            return newEvents.length > 15 ? newEvents.slice(-15) : newEvents;
          });
        }
      } catch (err) {
        console.warn('Parse error:', err);
      }
    };

    sseRef.current.onerror = () => disconnect();
  }, [broker, nodes]);

  const disconnect = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setConnected(false);
  }, []);

  const handleConnect = useCallback(() => {
    if (!connected) connect();
  }, [connected, connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleSpeed = useCallback((val) => {
    fetch(`/metrics/speed?interval=${val}`)
      .catch(err => console.error('Speed error:', err));
  }, []);

  const handleSimulate = useCallback(() => {
    const scenarios = [
      { broker: 'kafka', nodes: 1 },
      { broker: 'kafka', nodes: 3 },
      { broker: 'kafka', nodes: 5 },
      { broker: 'rabbitmq', nodes: 1 },
      { broker: 'rabbitmq', nodes: 3 },
      { broker: 'rabbitmq', nodes: 5 },
      { broker: 'rest', nodes: 1 }
    ];

    let idx = 0;
    const simulate = () => {
      if (idx >= scenarios.length) return;
      const s = scenarios[idx];
      setBroker(s.broker);
      setNodes(s.nodes);
      if (!connected) {
        setTimeout(() => connect(), 100);
      } else {
        connect();
      }
      idx++;
      setTimeout(simulate, 3000);
    };
    simulate();
  }, [connected, connect]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (connected) {
      setTimeout(() => connect(), 100);
    }
  }, [broker, nodes]);

  return (
    <>
      <div className="app-container">
        <Header connected={connected} />
        <div className="container">
          <Controls
            broker={broker}
            setBroker={setBroker}
            nodes={nodes}
            setNodes={setNodes}
            connected={connected}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSpeed={handleSpeed}
            onSimulate={handleSimulate}
          />
          <div className="main-grid">
            <LiveChart data={chartData} broker={broker} nodes={nodes} />
            <div className="kpi-stack">
              <KpiCard label="Kafka Peak" value="1M" hint="msg/sec" />
              <KpiCard label="RabbitMQ" value="3ms" hint="latency" />
              <KpiCard label="vs REST" value="222x" hint="gain" />
              <KpiCard label="Live TP" value={liveTP} hint="current" />
              <KpiCard label="Live Lat" value={liveLatency} hint="current" />
            </div>
          </div>
          <div className="bottom-grid">
            <EventLog events={events} />
            <ResultsTable paperResults={paperResults} broker={broker} nodes={nodes} />
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
