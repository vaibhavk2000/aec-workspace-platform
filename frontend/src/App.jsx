import React, { useState, useEffect } from 'react';
import AuthForm from './AuthForm';
import ProjectSidebar from './ProjectSidebar';
import CadCanvas from './CadCanvas';
import MetricsPanel from './MetricsPanel';
import QuizWorkspace from './QuizWorkspace';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [analysisData, setAnalysisData] = useState([]);
  const [hoveredBeamId, setHoveredBeamId] = useState(null);
  const [lines, setLines] = useState([]);
  const [quizState, setQuizState] = useState(null);
  const [certData, setCertData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    fetch('http://localhost/api/v1/auth/verify-token', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => { if (res.ok) setAuthenticated(true); else localStorage.removeItem('token'); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const triggerQuizStaging = async () => {
    try {
      const res = await fetch('http://localhost/api/v1/evaluation/generate-custom-quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.status === 'success') setQuizState(data);
    } catch (err) { console.error(err); }
  };

  const saveWorkspaceToCloud = async () => {
    if (!selectedProjectId) return;
    try {
      await fetch('http://localhost/api/v1/projects/save-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ projectId: selectedProjectId, elements: lines, canvasState: { scaleX: 1, scaleY: 1, x: 0, y: 0 } })
      });
      alert("Workspace parameters secured.");
    } catch (err) { console.error(err); }
  };

  const downloadDxfDrawing = async () => {
    try {
      const res = await fetch('http://localhost/api/v1/cad/generate-dxf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: selectedProjectId || "workspace", elements: lines, canvasState: {} })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `layout_${selectedProjectId || "workspace"}.dxf`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '20%' }}>🚀 Spawning AEC Environment Node...</div>;
  if (!authenticated) return <AuthForm onAuthSuccess={() => setAuthenticated(true)} />;

  if (certData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh', justifyContent: 'center', backgroundColor: '#1a1a1a', color: '#222' }}>
        <div style={{ border: '8px double #007fff', padding: '40px', backgroundColor: '#fff', width: '500px', textAlign: 'center' }}>
          <h2>AECWebService Verification Record</h2>
          <p>Student <strong>{certData.studentName}</strong> successfully completed evaluation modules with a score of {certData.score}%.</p>
          <small>ID: {certData.certificateId}</small>
        </div>
        <button onClick={() => window.print()} style={{ marginTop: '20px', padding: '10px 20px', background: '#007fff', color: '#fff', border: 'none', cursor: 'pointer' }}>Print Dynamic Document</button>
      </div>
    );
  }

  if (quizState) {
    return <QuizWorkspace attemptId={quizState.attemptId} questions={quizState.questions} projectId={selectedProjectId} studentName="Vaibhav" onQuizComplete={setCertData} />;
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ProjectSidebar activeProjectId={selectedProjectId} onSelectProject={(id) => { setSelectedProjectId(id); setLines([]); setAnalysisData([]); }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ padding: '12px', backgroundColor: '#252526', display: 'flex', gap: '10px', zIndex: 10 }}>
          <button onClick={saveWorkspaceToCloud} style={{ background: '#3c3c3c', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer' }}>💾 Save Project</button>
          <button onClick={downloadDxfDrawing} style={{ background: '#3c3c3c', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer' }}>📐 Export DXF</button>
          <button onClick={triggerQuizStaging} style={{ background: '#007fff', color: '#fff', border: 'none', padding: '6px 12px', cursor: 'pointer' }}>📝 Launch Quiz</button>
        </div>
        <CadCanvas activeProjectId={selectedProjectId} onAnalysisComplete={setAnalysisData} hoveredBeamId={hoveredBeamId} lines={lines} setLines={setLines} />
      </div>
      <MetricsPanel analysisData={analysisData} selectedBeamId={hoveredBeamId} onHoverBeam={setHoveredBeamId} />
    </div>
  );
}
