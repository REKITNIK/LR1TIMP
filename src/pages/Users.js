// src/pages/Users.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Users = ({ users, loading, onDelete, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return '👑';
      case 'doctor': return '👨‍⚕️';
      case 'nurse': return '👩‍⚕️';
      default: return '👤';
    }
  };

  const getRoleName = (role) => {
    switch(role) {
      case 'admin': return 'Администратор';
      case 'doctor': return 'Врач';
      case 'nurse': return 'Медсестра';
      default: return 'Сотрудник';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>👥 Пользователи системы</h1>
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Поиск пользователей..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      {users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>Нет пользователей</h3>
          <p>В системе пока нет зарегистрированных пользователей</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className="user-card">
              <Link to={`/user/${user.id}`} className="user-link">
                <div className="user-header">
                  <span className="user-avatar-large">
                    {user.avatar || user.name?.charAt(0) || '👤'}
                  </span>
                  <span className="user-role-badge">
                    {getRoleIcon(user.role)} {getRoleName(user.role)}
                  </span>
                </div>
                <h3 className="user-name">{user.name}</h3>
                <div className="user-info">
                  <span className="user-email">📧 {user.email}</span>
                  <span className="user-position">💼 {user.position || 'Не указана'}</span>
                  <span className="user-department">🏥 {user.department || 'Не указано'}</span>
                </div>
              </Link>
              {isAdmin && user.role !== 'admin' && (
                <div className="user-actions">
                  <button onClick={() => onDelete(user.id)} className="delete-btn" title="Удалить">
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );


};

export default Users;
