// src/pages/Devices.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Devices = ({ devices, loading, onDelete, isAdmin }) => {
  const [filter, setFilter] = useState('all');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getStatusIcon = (device) => {
    if (device.power === 'off') return '🔴';
    if (device.status === 'online') return '🟢';
    return '⚫';
  };

  const getDeviceIcon = (type) => {
    switch(type) {
      case 'medical': return '🏥';
      case 'life-support': return '⚠️';
      case 'patient-monitor': return '📊';
      default: return '💻';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ФИЛЬТРАЦИЯ: Если не админ, показываем только устройства своего отделения
  const getUserDevices = () => {
    if (isAdmin) {
      return devices; // Админ видит все устройства
    }
    // Обычный пользователь видит только устройства своего отделения
    return devices.filter(device => device.department === user?.department);
  };

  const userDevices = getUserDevices();
  
  const filteredDevices = filter === 'all' 
    ? userDevices 
    : userDevices.filter(d => d.status === filter || d.power === filter);

  const stats = {
    total: userDevices.length,
    online: userDevices.filter(d => d.status === 'online' && d.power === 'on').length,
    offline: userDevices.filter(d => d.status === 'offline' || d.power === 'off').length
  };

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p>Загрузка устройств...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container">
        <div className="page-header">
          <h1>📡 Сетевые устройства</h1>
          {isAdmin && (
            <Link to="/add-device" className="add-button">
              + Добавить устройство
            </Link>
          )}
        </div>
        
        {/* Статистика */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Всего устройств</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#10b981' }}>{stats.online}</div>
            <div className="stat-label">🟢 Онлайн</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ef4444' }}>{stats.offline}</div>
            <div className="stat-label">⚫ Оффлайн</div>
          </div>
        </div>
        
        {/* Фильтры */}
        <div className="filters">
          <button onClick={() => setFilter('all')} className="filter-btn">Все</button>
          <button onClick={() => setFilter('online')} className="filter-btn">Онлайн</button>
          <button onClick={() => setFilter('offline')} className="filter-btn">Оффлайн</button>
        </div>
        
        {/* Информация об отделении для обычного пользователя */}
        {!isAdmin && user?.department && (
          <div className="department-info">
            📍 Показаны устройства отделения: <strong>{user.department}</strong>
          </div>
        )}
        
        {userDevices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📡</div>
            <h3>Нет устройств</h3>
            {!isAdmin ? (
              <p>В вашем отделении "{user?.department}" пока нет зарегистрированных устройств</p>
            ) : (
              <p>В сети пока нет зарегистрированных устройств</p>
            )}
            {isAdmin && (
              <Link to="/add-device" className="add-button" style={{ marginTop: '20px' }}>
                + Добавить первое устройство
              </Link>
            )}
          </div>
        ) : (
          <div className="devices-grid">
            {filteredDevices.map(device => (
              <div key={device.id} className="device-card">
                <Link to={`/device/${device.id}`} className="device-link">
                  <div className="device-header">
                    <span className="device-icon">
                      {getDeviceIcon(device.type)}
                    </span>
                    <span className="device-status">
                      {getStatusIcon(device)}
                    </span>
                  </div>
                  <h3 className="device-name">{device.name}</h3>
                  <div className="device-info">
                    <span className="device-type">{device.category || device.type}</span>
                    <span className="device-location">📍 {device.location || 'Не указано'}</span>
                    <span className="device-ip">🌐 {device.ipAddress}</span>
                    {!isAdmin && device.department && (
                      <span className="device-department">🏥 {device.department}</span>
                    )}
                  </div>
                </Link>
                {isAdmin && (
                  <div className="device-actions">
                    <button 
                      onClick={() => onDelete(device.id)} 
                      className="delete-btn"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Devices;
