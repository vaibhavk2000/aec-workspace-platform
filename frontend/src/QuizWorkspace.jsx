import React, { useState } from 'react';

export default function QuizWorkspace({ attemptId, questions, projectId, studentName, onQuizComplete }) {
  const [answers, setAnswers] = useState({});

  const handleSubmit = async () => {
    try {
      const res = await fetch('http://localhost/api/v1/evaluation/grade-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ attemptId, projectId, studentName, answers })
      });
      const data = await res.json();
      if (data.status === 'success') onQuizComplete(data);
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ flex: 1, padding: '24px', backgroundColor: '#1e1e1e', overflowY: 'auto', color: '#fff' }}>
      <h2>📝 Certification Exam Staging</h2>
      {questions.map(q => (
        <div key={q.id} style={{ marginBottom: '20px', backgroundColor: '#252526', padding: '16px', borderRadius: '4px' }}>
          <h4>{q.text}</h4>
          {Object.entries(q.options).map(([k, v]) => (
            <button key={k} onClick={() => setAnswers({ ...answers, [q.id]: k })} style={{ display: 'block', width: '100%', margin: '6px 0', padding: '10px', textAlign: 'left', backgroundColor: answers[q.id] === k ? '#1e3a5f' : '#3c3c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              ({k}) {v}
            </button>
          ))}
        </div>
      ))}
      <button onClick={handleSubmit} style={{ width: '100%', padding: '12px', backgroundColor: '#4caf50', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>Submit Exam Sheet</button>
    </div>
  );
}
