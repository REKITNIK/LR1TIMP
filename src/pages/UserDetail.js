// src/pages/UserDetail.js
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const UserDetail = ({ users, isAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = users.find(u => u.id === id);

  if (!user) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>Пользователь не найден</h2>
          <button onClick={() => navigate('/users')} className="btn-primary">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="user-profile">
        <button onClick={() => navigate('/users')} className="back-button">
          ← Назад к списку
        </button>
        
        <div className="profile-header">
          <div className="profile-avatar">
            {user.avatar || user.name?.charAt(0) || '👤'}
          </div>
          <h1>{user.name}</h1>
        </div>
        
        <div className="profile-info">
          <div className="info-section">
            <h3>Контактная информация</h3>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Телефон:</span>
              <span className="info-value">{user.phone || 'Не указан'}</span>
            </div>
          </div>
          
          <div className="info-section">
            <h3>Рабочая информация</h3>
            <div className="info-row">
              <span className="info-label">Должность:</span>
              <span className="info-value">{user.position || 'Не указана'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Отделение:</span>
              <span className="info-value">{user.department || 'Не указано'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Роль:</span>
              <span className="info-value">{user.role}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
