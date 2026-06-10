// src/pages/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';   // <- импортируем наш инстанс
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config';


const AdminPanel = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();



  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Загрузка заявок...');
      const response = await api.get(`${API_BASE_URL}/pendingUsers`);
      console.log('Полученные заявки:', response.data);
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      setError('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const approveUser = async (pendingUser) => {
    try {
      console.log('Подтверждение пользователя:', pendingUser);
      
      // Создаем пользователя в таблице users
      const newUser = {
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        role: pendingUser.role || 'employee',
        isapproved: true,
        position: pendingUser.position || 'Не указана',
        department: pendingUser.department || 'Не указано',
        phone: pendingUser.phone || '',
        avatar: pendingUser.avatar || pendingUser.name?.charAt(0) || '👤',
        createdAt: new Date().toISOString()
      };
      
      console.log('Создание пользователя:', newUser);
      const createResponse = await api.post(`${API_BASE_URL}/users`, newUser);
      console.log('Пользователь создан:', createResponse.data);
      
      // Удаляем заявку
      console.log('Удаление заявки ID:', pendingUser.id);
      await api.delete(`${API_BASE_URL}/pendingUsers/${pendingUser.id}`);
      
      // Обновляем список заявок
      await loadPendingUsers();
      
      alert(`Пользователь ${pendingUser.name} успешно подтвержден!`);
    } catch (error) {
      console.error('Ошибка подтверждения:', error);
      alert(`Ошибка при подтверждении: ${error.response?.data?.error || error.message}`);
    }
  };

  const rejectUser = async (pendingUser) => {
    if (window.confirm(`Отклонить заявку от ${pendingUser.name}?`)) {
      try {
        console.log('Отклонение заявки ID:', pendingUser.id);
        await api.delete(`${API_BASE_URL}/pendingUsers/${pendingUser.id}`);
        await loadPendingUsers();
        alert(`Заявка от ${pendingUser.name} отклонена`);
      } catch (error) {
        console.error('Ошибка отклонения:', error);
        alert('Ошибка при отклонении заявки');
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Загрузка заявок...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-panel">
        <div className="admin-header">
          <Link to="/" className="back-button">← Назад</Link>
          <h1>👑 Панель администратора</h1>
          <button onClick={loadPendingUsers} className="refresh-btn">🔄 Обновить</button>
        </div>
        
        {error && (
          <div className="error-message" style={{ marginBottom: '20px', padding: '10px', background: '#fee', borderRadius: '8px' }}>
            ❌ {error}
          </div>
        )}
        
        <h2>📋 Заявки на регистрацию ({pendingUsers.length})</h2>
        
        {pendingUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <p>Нет новых заявок на регистрацию</p>
          </div>
        ) : (
          <div className="pending-users-grid">
            {pendingUsers.map(pending => (
              <div key={pending.id} className="pending-card">
                <div className="pending-header">
                  <div className="pending-avatar">
                    {pending.avatar || pending.name?.charAt(0) || '👤'}
                  </div>
                  <div className="pending-info">
                    <h3>{pending.name}</h3>
                    <p className="pending-email">{pending.email}</p>
                  </div>
                </div>
                
                <div className="pending-details">
                  <div className="detail-row">
                    <span className="label">Должность:</span>
                    <span>{pending.position || 'Не указана'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Отделение:</span>
                    <span>{pending.department || 'Не указано'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Телефон:</span>
                    <span>{pending.phone || 'Не указан'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Дата заявки:</span>
                    <span>{pending.createdAt ? new Date(pending.createdAt).toLocaleString() : 'Не указана'}</span>
                  </div>
                </div>
                
                <div className="pending-actions">
                  <button onClick={() => approveUser(pending)} className="btn-approve">
                    ✅ Подтвердить
                  </button>
                  <button onClick={() => rejectUser(pending)} className="btn-reject">
                    ❌ Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
