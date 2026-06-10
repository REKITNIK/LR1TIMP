// src/components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <span>🏥</span>
          <h2>Медицинское учреждение "Здоровье"</h2>
        </div>
        
        <nav className="main-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            📡 Устройства
          </Link>
          <Link to="/users" className={location.pathname === '/users' ? 'active' : ''}>
            👥 Пользователи
          </Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
              👑 Админ-панель
            </Link>
          )}
          <Link to="/incidents">🛡️ Инциденты (в разработке)</Link>
        </nav>
        
        <div className="user-menu">
          <div className="user-info">
            <span className="user-avatar">👤</span>
            <span className="user-name">{user?.name || 'Пользователь'}</span>
          </div>
          <Link to="/profile" className="profile-link">👤 Профиль</Link>
          <button onClick={handleLogout} className="logout-btn">🚪 Выйти</button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
