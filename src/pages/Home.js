import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = ({ employees, loading, onDelete, currentUser, isAdmin }) => {
  const { logout } = useAuth();

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return '👑';
      case 'doctor': return '👨‍⚕️';
      case 'nurse': return '👩‍⚕️';
      default: return '🧑‍💼';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p>Загрузка сотрудников...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span>🏥</span>
            <h2>Медицинское учреждение "Здоровье"</h2>
          </div>
          <div className="user-menu">
            <div className="user-info">
              <span className="user-avatar">{getRoleIcon(currentUser?.role)}</span>
              <span className="user-name">{currentUser?.name}</span>
            </div>
            <Link to="/profile" className="profile-link">👤 Профиль</Link>
            {isAdmin && (
              <Link to="/admin" className="admin-link">👑 Админ-панель</Link>
            )}
            <button onClick={logout} className="logout-btn">🚪 Выйти</button>
          </div>
        </div>
      </header>
      
      <div className="container">
        <div className="page-header">
          <h1>Медицинский персонал</h1>
          {isAdmin && (
            <Link to="/add" className="add-button">
              + Добавить сотрудника
            </Link>
          )}
        </div>
        
        {employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👩‍⚕️🧑‍⚕️</div>
            <h3>Нет сотрудников</h3>
            <p>В базе данных пока нет зарегистрированных сотрудников</p>
          </div>
        ) : (
          <div className="employees-grid">
            {employees.map(item => (
              <div key={item.id} className="employee-card">
                <Link to={`/detail/${item.id}`} className="employee-link">
                  <div className="employee-info">
                    <div className="employee-header">
                      <span className="employee-avatar">
                        {item.avatar || item.name.charAt(0)}
                      </span>
                      <span className="employee-role-badge">
                        {getRoleIcon(item.role)}
                      </span>
                    </div>
                    <span className="employee-name">{item.name}</span>
                    <span className="employee-position">{item.position}</span>
                    <span className="employee-department">{item.department}</span>
                  </div>
                </Link>
                {isAdmin && (
                  <button onClick={() => onDelete(item.id)} className="delete-btn" title="Удалить">
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
