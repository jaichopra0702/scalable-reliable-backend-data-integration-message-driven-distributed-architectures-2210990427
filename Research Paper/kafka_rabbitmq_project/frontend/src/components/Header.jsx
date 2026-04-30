import './Header.css';

export function Header({ connected }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1>🚀 Live Research Dashboard</h1>
        <p className="header-subtitle">Kafka vs RabbitMQ vs REST Performance Analysis</p>
      </div>
      <div className="header-right">
        <div className="live-badge">
          <div className={`live-dot ${connected ? 'active' : ''}`}></div>
          <span>{connected ? 'Connected' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
}
