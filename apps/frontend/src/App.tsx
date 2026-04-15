import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoadBalancer } from './hooks/useLoadBalancer';
import { RoundRobinStrategy, LeastLatencyStrategy, ServerId } from '@pkg/load-balancer';

export default function App() {
  const { sendRequest, logs, lb } = useLoadBalancer();
  const [isAuto, setIsAuto] = useState(false);
  const [strategyName, setStrategyName] = useState('Round Robin');
  const [statusFeed, setStatusFeed] = useState<string[]>(["[System] Load Balancer initialized."]);

  // --- Helpers ---
  const addStatus = useCallback((msg: string) => {
    setStatusFeed(prev => {
      // Don't spam the same message (like repeated skipping logs)
      if (prev[0] === msg) return prev;
      return [msg, ...prev].slice(0, 10);
    });
  }, []);

  const handleStrategyChange = (type: 'rr' | 'll') => {
    if (type === 'rr') {
      lb.setStrategy(new RoundRobinStrategy(lb.metrics));
      setStrategyName('Round Robin');
      addStatus("🔄 Strategy: Round Robin (Equal Distribution)");
    } else {
      lb.setStrategy(new LeastLatencyStrategy(lb.metrics));
      setStrategyName('Least Latency');
      addStatus("⚡ Strategy: Least Latency (Performance Optimized)");
    }
  };

  const executeTraffic = useCallback(async () => {
    const stats = lb.metrics.getSnapshot();
    const serverIds = Object.keys(stats) as ServerId[];
    const available = serverIds.filter(id => lb.metrics.isAvailable(id));
    const tripped = serverIds.filter(id => !lb.metrics.isAvailable(id));

    // 1. Log Circuit Breaker Activity
    if (tripped.length > 0) {
      addStatus(`⚠️ Circuit Breaker: ${tripped.join(', ').toUpperCase()} isolated.`);
    }

    // 2. Logic Insights for Least Latency
    if (strategyName === 'Least Latency' && available.length > 1) {
      const best = available.reduce((a, b) => 
        (stats[a]?.avgLatency || 0) < (stats[b]?.avgLatency || 0) ? a : b
      );
      addStatus(`🚀 Routing to ${best.toUpperCase()} (Lowest Latency: ${Math.round(stats[best]?.avgLatency || 0)}ms)`);
    }

    try {
      await sendRequest();
    } catch (err) {
      addStatus(`❌ Request Failed: Network timeout or server crash.`);
    }
  }, [lb, strategyName, addStatus, sendRequest]);

  // --- Effects ---
  useEffect(() => {
    let interval: any;
    if (isAuto) {
      interval = setInterval(executeTraffic, 800);
    }
    return () => clearInterval(interval);
  }, [isAuto, executeTraffic]);

  if (!lb || !lb.metrics) {
    return <div style={styles.loader}>Booting Load Balancer Engine...</div>;
  }

  const stats = lb.metrics.getSnapshot();

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '1px' }}>⚖️ LB_CONTROL_PLANE</h1>
          <div style={{ ...styles.badge, animation: isAuto ? 'pulse 2s infinite' : 'none' }}>
            {isAuto ? 'LIVE TRAFFIC' : 'STANDBY'}
          </div>
        </div>
        <div style={styles.strategyBadge}>{strategyName}</div>
      </header>

      {/* Control Panel */}
      <section style={styles.panel}>
        <div style={styles.buttonGroup}>
          <button onClick={executeTraffic} style={styles.primaryBtn}>Manual Ping</button>
          <button 
            onClick={() => setIsAuto(!isAuto)} 
            style={{...styles.secondaryBtn, backgroundColor: isAuto ? '#ff4d4d' : '#007bff'}}
          >
            {isAuto ? 'Stop Auto-Traffic' : 'Start Auto-Traffic'}
          </button>
        </div>

        <div style={styles.buttonGroup}>
          <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: 'bold' }}>STRATEGY:</span>
          <button 
            onClick={() => handleStrategyChange('rr')} 
            style={{...styles.tabBtn, borderColor: strategyName === 'Round Robin' ? '#007bff' : '#333'}}
          >
            Round Robin
          </button>
          <button 
            onClick={() => handleStrategyChange('ll')} 
            style={{...styles.tabBtn, borderColor: strategyName === 'Least Latency' ? '#007bff' : '#333'}}
          >
            Least Latency
          </button>
        </div>
      </section>

      {/* Server Grid */}
      <div style={styles.grid}>
        {Object.entries(stats).map(([id, stat]: [string, any]) => {
          const successRate = stat.requests > 0 ? ((stat.requests - stat.failures) / stat.requests) * 100 : 0;
          const isHealthy = lb.metrics.isAvailable(id as ServerId);

          return (
            <div key={id} style={{ ...styles.card, borderColor: isHealthy ? '#222' : '#ff4d4d' }}>
              <div style={styles.cardHeader}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{id.toUpperCase()}</h3>
                <span style={{ color: isHealthy ? '#00ff88' : '#ff4d4d', fontSize: '0.7rem' }}>
                  {isHealthy ? '● ONLINE' : '● TRIPPED'}
                </span>
              </div>
              
              <div style={styles.statBox}>
                <div style={styles.statItem}>
                  <label style={styles.label}>SUCCESS</label>
                  <span style={styles.value}>{successRate.toFixed(1)}%</span>
                </div>
                <div style={styles.statItem}>
                  <label style={styles.label}>LATENCY</label>
                  <span style={styles.value}>{Math.round(stat.avgLatency)}ms</span>
                </div>
              </div>

              <div style={styles.progressBar}>
                <div style={{ 
                  ...styles.progressFill, 
                  width: `${successRate}%`, 
                  backgroundColor: isHealthy ? '#00ff88' : '#ff4d4d' 
                }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.bottomSection}>
        {/* System Decisions Feed */}
        <div style={styles.feedBox}>
          <h4 style={styles.sectionTitle}>SYSTEM_DECISIONS</h4>
          <div style={styles.scrollArea}>
            {statusFeed.map((msg, i) => (
              <div key={i} style={{ ...styles.feedItem, color: msg.includes('⚠️') ? '#ffcc00' : '#00aaff' }}>
                <span style={styles.timestamp}>{new Date().toLocaleTimeString()}</span> {msg}
              </div>
            ))}
          </div>
        </div>

        {/* Live Logs */}
        <div style={styles.feedBox}>
          <h4 style={styles.sectionTitle}>LIVE_TRAFFIC_LOG</h4>
          <div style={styles.scrollArea}>
            {logs.map(log => (
              <div key={log.id} style={{ ...styles.logItem, color: log.success ? '#00ff88' : '#ff4d4d' }}>
                <span style={styles.timestamp}>GET</span> 
                <span style={{ fontWeight: 'bold' }}>{log.server.toUpperCase()}</span>
                <span>{log.success ? '200_OK' : '500_ERR'}</span>
                <span>({Math.round(log.totalTime)}ms)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2.5rem', backgroundColor: '#050505', color: '#fff', minHeight: '100vh', fontFamily: '"JetBrains Mono", monospace' },
  loader: { color: '#00ff88', backgroundColor: '#050505', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid #1a1a1a', paddingBottom: '1.5rem' },
  badge: { backgroundColor: '#111', padding: '5px 12px', borderRadius: '4px', fontSize: '0.7rem', color: '#00ff88', border: '1px solid #00ff88', fontWeight: 'bold' },
  strategyBadge: { color: '#888', fontSize: '0.8rem', textTransform: 'uppercase' },
  panel: { backgroundColor: '#0f0f0f', padding: '1.2rem', borderRadius: '4px', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', border: '1px solid #1a1a1a' },
  buttonGroup: { display: 'flex', gap: '12px', alignItems: 'center' },
  primaryBtn: { padding: '8px 16px', border: 'none', borderRadius: '2px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#fff', color: '#000', fontSize: '0.8rem' },
  secondaryBtn: { padding: '8px 16px', border: 'none', borderRadius: '2px', cursor: 'pointer', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem' },
  tabBtn: { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #333', color: '#888', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' },
  card: { backgroundColor: '#0f0f0f', padding: '1.5rem', borderRadius: '4px', borderLeft: '4px solid #222' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  statBox: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  statItem: { display: 'flex', flexDirection: 'column' },
  label: { fontSize: '0.6rem', color: '#555', marginBottom: '4px' },
  value: { fontSize: '1.1rem', fontWeight: 'bold' },
  progressBar: { height: '2px', backgroundColor: '#1a1a1a', marginTop: '1.5rem' },
  progressFill: { height: '100%', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' },
  bottomSection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  feedBox: { backgroundColor: '#0f0f0f', padding: '1.2rem', borderRadius: '4px', border: '1px solid #1a1a1a' },
  sectionTitle: { fontSize: '0.7rem', color: '#444', margin: '0 0 1rem 0', letterSpacing: '2px' },
  scrollArea: { height: '180px', overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' },
  feedItem: { fontSize: '0.75rem', borderLeft: '2px solid #333', paddingLeft: '10px' },
  logItem: { fontSize: '0.75rem', display: 'flex', gap: '15px', borderBottom: '1px solid #151515', paddingBottom: '4px' },
  timestamp: { color: '#333' }
};