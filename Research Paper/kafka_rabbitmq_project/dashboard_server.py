"""dashboard_server.py
Professional live dashboard backend with broadcast SSE and queue-based streaming.

Usage:
    python dashboard_server.py

Then open http://localhost:5000 in your browser.
"""
from flask import Flask, Response, request, jsonify, send_from_directory
import json, time, threading, random, queue
from metrics.metrics import PAPER_RESULTS
from datetime import datetime
from pathlib import Path

# Serve React build from frontend/dist
frontend_dist = Path(__file__).parent / 'frontend' / 'dist'
app = Flask(__name__, static_folder=str(frontend_dist), static_url_path='')

# Thread-safe broadcast system
clients = []
clients_lock = threading.Lock()
simulation_interval = 1.0

def broadcast(payload):
    """Send payload to all connected SSE clients."""
    with clients_lock:
        for q in clients:
            try:
                q.put(payload, block=False)
            except queue.Full:
                pass

def simulate_metrics():
    """Background thread: generate synthetic metrics with jitter and broadcast to all."""
    scenario_list = [
        ("kafka", 1, PAPER_RESULTS["kafka"][1]),
        ("kafka", 3, PAPER_RESULTS["kafka"][3]),
        ("kafka", 5, PAPER_RESULTS["kafka"][5]),
        ("rabbitmq", 1, PAPER_RESULTS["rabbitmq"][1]),
        ("rabbitmq", 3, PAPER_RESULTS["rabbitmq"][3]),
        ("rabbitmq", 5, PAPER_RESULTS["rabbitmq"][5]),
        ("rest", 1, PAPER_RESULTS["rest"][1]),
    ]
    idx = 0
    while True:
        broker, nodes, base = scenario_list[idx % len(scenario_list)]
        jitter_t = base['throughput'] * random.uniform(0.97, 1.03)
        jitter_l = base['latency_ms'] * random.uniform(0.95, 1.05)
        payload = {
            'broker': broker,
            'nodes': nodes,
            'timestamp': time.time(),
            'throughput_mps': round(jitter_t, 2),
            'latency_ms': round(jitter_l, 3),
        }
        broadcast(payload)
        idx += 1
        time.sleep(simulation_interval)

# Start background simulator on app startup
simulator_thread = threading.Thread(target=simulate_metrics, daemon=True)
simulator_thread.start()

@app.route('/')
def home():
    """Serve React app."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files."""
    file_path = Path(app.static_folder) / path
    if file_path.exists() and file_path.is_file():
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/metrics/all')
def metrics_all():
    """Return all benchmark data as JSON for initial page load."""
    result = {
        'timestamp': time.time(),
        'paper_results': PAPER_RESULTS,
        'summary': {
            'kafka_max': PAPER_RESULTS['kafka'][5]['throughput'],
            'kafka_latency': PAPER_RESULTS['kafka'][5]['latency_ms'],
            'rabbitmq_max': PAPER_RESULTS['rabbitmq'][5]['throughput'],
            'rabbitmq_latency': PAPER_RESULTS['rabbitmq'][5]['latency_ms'],
            'rest_max': PAPER_RESULTS['rest'][1]['throughput'],
            'rest_latency': PAPER_RESULTS['rest'][1]['latency_ms'],
            'kafka_vs_rest_throughput': PAPER_RESULTS['kafka'][5]['throughput'] // PAPER_RESULTS['rest'][1]['throughput'],
            'rabbitmq_vs_rest_throughput': PAPER_RESULTS['rabbitmq'][5]['throughput'] // PAPER_RESULTS['rest'][1]['throughput'],
        }
    }
    return jsonify(result)

@app.route('/metrics/speed', methods=['GET', 'POST'])
def set_simulation_speed():
    """Get or set simulation interval (seconds per metric)."""
    global simulation_interval
    if request.method == 'POST':
        try:
            data = request.get_json()
            interval = float(data.get('interval', 1.0))
            if 0.2 <= interval <= 5.0:
                simulation_interval = interval
                return jsonify({'interval': simulation_interval}), 200
            return jsonify({'error': 'interval must be between 0.2 and 5.0'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    elif request.method == 'GET':
        interval = request.args.get('interval')
        if interval:
            try:
                val = float(interval)
                if 0.2 <= val <= 5.0:
                    simulation_interval = val
                    return jsonify({'interval': simulation_interval}), 200
                return jsonify({'error': 'interval must be between 0.2 and 5.0'}), 400
            except Exception as e:
                return jsonify({'error': str(e)}), 400
        return jsonify({'interval': simulation_interval}), 200

@app.route('/metrics/publish', methods=['POST'])
def publish_metric():
    """Accept a manual metric from the dashboard and broadcast to all clients."""
    try:
        data = request.get_json()
        if not isinstance(data, dict):
            return jsonify({'error': 'bad payload'}), 400
    except Exception:
        return jsonify({'error': 'bad payload'}), 400

    # Normalize and add timestamp
    try:
        data['nodes'] = int(data.get('nodes', 5))
        data['throughput_mps'] = float(data.get('throughput_mps', 0))
        data['latency_ms'] = float(data.get('latency_ms', 0))
        data['broker'] = str(data.get('broker', 'kafka'))
        data['timestamp'] = time.time()
        data['manual'] = True
    except Exception:
        return jsonify({'error': 'invalid payload format'}), 400

    # Broadcast to all connected clients
    broadcast(data)
    return jsonify({'status': 'published'}), 200

@app.route('/metrics/stream')
def stream_metrics():
    """SSE endpoint: stream metrics to a connected client."""
    broker = request.args.get('broker', 'kafka')
    try:
        nodes = int(request.args.get('nodes', '5'))
    except ValueError:
        nodes = 5

    # Create a queue for this client
    client_queue = queue.Queue(maxsize=100)

    # Register client
    with clients_lock:
        clients.append(client_queue)

    def event_stream():
        try:
            while True:
                try:
                    # Get item with timeout to allow cleanup
                    item = client_queue.get(timeout=30)
                    # Client-side filtering by broker/nodes happens in JS
                    # but we can filter server-side if needed for efficiency
                    yield f"data: {json.dumps(item)}\n\n"
                except queue.Empty:
                    # Send keep-alive every 30s
                    yield f": keepalive\n\n"
        finally:
            # Unregister client on disconnect
            with clients_lock:
                if client_queue in clients:
                    clients.remove(client_queue)

    return Response(event_stream(), mimetype='text/event-stream')

if __name__ == '__main__':
    print('='*60)
    print('Live Dashboard Server — Kafka vs RabbitMQ Research Paper')
    print('='*60)
    print('🚀 Starting on http://127.0.0.1:5000')
    print('📊 Metrics endpoint: /metrics/stream')
    print('📡 All data: /metrics/all')
    print('⚙️  Speed control: /metrics/speed?interval=0.5')
    print('='*60)
    app.run(host='127.0.0.1', port=5000, debug=False)
