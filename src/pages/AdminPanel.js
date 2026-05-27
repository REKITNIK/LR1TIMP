import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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
      const response = await axios.get('http://localhost:5000/pendingUsers');
      console.log('Полученные заявки:', response.data);
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
      setError('Не удалось загрузить заявки. Убедитесь, что JSON Server запущен.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
    // Обновляем список каждые 5 секунд
    const interval = setInterval(loadPendingUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const approveUser = async (pendingUser) => {
    try {
      // Создаем пользователя в основной таблице
      const newUser = {
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        role: pendingUser.role || 'employee',
        isApproved: true,
        position: pendingUser.position,
        department: pendingUser.department,
        phone: pendingUser.phone || '',
        avatar: pendingUser.avatar,
        createdAt: pendingUser.createdAt,
        approvedAt: new Date().toISOString(),
        approvedBy: user.id
      };

      console.log('Создание пользователя:', newUser);
      await axios.post('http://localhost:5000/users', newUser);
      
      // Удаляем из заявок
      console.log('Удаление заявки:', pendingUser.id);
      await axios.delete(`http://localhost:5000/pendingUsers/${pendingUser.id}`);
      
      // Обновляем список
      await loadPendingUsers();
      
      alert(`Пользователь ${pendingUser.name} успешно подтвержден!`);
    } catch (error) {
      console.error('Ошибка подтверждения:', error);
      alert('Ошибка при подтверждении пользователя: ' + (error.response?.data || error.message));
    }
  };

  const rejectUser = async (pendingUser) => {
    if (window.confirm(`Отклонить заявку от ${pendingUser.name}?`)) {
      try {
        await axios.delete(`http://localhost:5000/pendingUsers/${pendingUser.id}`);
        await loadPendingUsers();
        alert(`Заявка от ${pendingUser.name} отклонена`);
      } catch (error) {
        console.error('Ошибка отклонения:', error);
        alert('Ошибка при отклонении заявки');
      }
    }
  };

  if (loading && pendingUsers.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="loading-spinner"></div>
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
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}
        
        <div className="admin-section">
          <h2>📋 Заявки на регистрацию ({pendingUsers.length})</h2>
          
          {pendingUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>Нет новых заявок на регистрацию</p>
              <p style={{ fontSize: '12px', marginTop: '10px' }}>
                Когда кто-то зарегистрируется, заявка появится здесь
              </p>
            </div>
          ) : (
            <div className="pending-users-grid">
              {pendingUsers.map(pending => (
                <div key={pending.id} className="pending-card">
                  <div className="pending-header">
                    <div className="pending-avatar">
                      {pending.avatar || pending.name.charAt(0)}
                    </div>
                    <div className="pending-info">
                      <h3>{pending.name}</h3>
                      <p className="pending-email">{pending.email}</p>
                    </div>
                  </div>
                  
                  <div className="pending-details">
                    <div className="detail-row">
                      <span className="label">Должность:</span>
                      <span>{pending.position}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Отделение:</span>
                      <span>{pending.department}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Телефон:</span>
                      <span>{pending.phone || 'Не указан'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Дата заявки:</span>
                      <span>{new Date(pending.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="pending-actions">
                    <button 
                      onClick={() => approveUser(pending)} 
                      className="btn-approve"
                    >
                      ✅ Подтвердить
                    </button>
                    <button 
                      onClick={() => rejectUser(pending)} 
                      className="btn-reject"
                    >
                      ❌ Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
