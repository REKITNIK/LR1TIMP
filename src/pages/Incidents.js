// src/pages/Incidents.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/incidents`);
      setIncidents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return '🔴';
      case 'In Progress': return '🟡';
      case 'Resolved': return '🟢';
      case 'Closed': return '⚪';
      default: return '⚫';
    }
  };

  if (loading) return <div className="container">Загрузка...</div>;

  return (
    <div className="container">
      <h1>🛡️ Инциденты информационной безопасности</h1>
      {user?.role === 'admin' && (
        <button className="add-button" onClick={() => {/* открыть форму */}}>
          В РАЗРАБОТКЕ
        </button>
      )}
      <div className="incidents-grid">
        {incidents.map(inc => (
          <div key={inc.id} className="incident-card">
            <div className="incident-header">
              <span className="incident-type">{inc.incident_type}</span>
              <span className="incident-status">{getStatusColor(inc.status)} {inc.status}</span>
            </div>
            <div className="incident-date">{new Date(inc.incident_date).toLocaleString()}</div>
            <div className="incident-threat">Уровень угрозы: {inc.threat_level}/5</div>
            <div className="incident-description">{inc.description?.substring(0, 100)}</div>
            {inc.employee_name && <div className="incident-employee">👤 {inc.employee_name}</div>}
            <button onClick={() => window.location.href=`/incident/${inc.id}`}>Подробнее</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Incidents;
