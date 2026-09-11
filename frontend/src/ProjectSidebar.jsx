import React, { useState, useEffect } from 'react';

export default function ProjectSidebar({ activeProjectId, onSelectProject }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('http://localhost/api/v1/projects', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.status === 'success') setProjects(data.data);
      } catch (err) { console.error(err); }
    };
    fetchProjects();
  }, [activeProjectId]);

  return (
    <div style={{ width: '280px', backgroundColor: '#252526', borderRight: '1px solid #3c3c3c', color: '#ccc', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', backgroundColor: '#1e1e1e', color: '#fff', fontWeight: 'bold' }}>📁 AEC Layouts</div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {projects.map(p => (
          <div key={p.id} onClick={() => onSelectProject(p.id)} style={{ padding: '12px', marginBottom: '6px', borderRadius: '4px', cursor: 'pointer', backgroundColor: p.id === activeProjectId ? '#37373d' : 'transparent', borderLeft: p.id === activeProjectId ? '4px solid #007fff' : '4px solid transparent' }}>
            {p.project_name}
          </div>
        ))}
      </div>
    </div>
  );
}
