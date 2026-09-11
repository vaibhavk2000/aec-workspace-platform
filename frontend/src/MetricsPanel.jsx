import React from 'react';

export default function MetricsPanel({ analysisData, selectedBeamId, onHoverBeam }) {
  return (
    <div style={{ width: '320px', backgroundColor: '#1e1e1e', borderLeft: '1px solid #3c3c3c', color: '#ccc', display: 'flex', flexDirection: 'column', fontFamily: 'monospace', padding: '12px' }}>
      <h3 style={{ color: '#fff', borderBottom: '1px solid #3c3c3c', paddingBottom: '8px', margin: 0 }}>📊 Performance Metrics</h3>
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px' }}>
        {analysisData.map(res => {
          const passed = res.safety_status.passed;
          return (
            <div key={res.beam_id} onMouseEnter={() => onHoverBeam(res.beam_id)} onMouseLeave={() => onHoverBeam(null)} style={{ padding: '12px', backgroundColor: '#252526', marginBottom: '8px', borderRadius: '4px', border: res.beam_id === selectedBeamId ? '1px solid #007fff' : '1px solid #3c3c3c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#00ffcc' }}>{res.beam_id.toUpperCase()}</span>
                <span style={{ color: passed ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>{passed ? 'PASS' : 'FAIL'}</span>
              </div>
              <div style={{ fontSize: '12px' }}>Span: {res.span_length_m}m</div>
              <div style={{ fontSize: '12px' }}>Mmax: {res.max_moment_knm} kN·m</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
