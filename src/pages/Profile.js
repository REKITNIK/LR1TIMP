import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';


const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    position: user?.position || '',
    department: user?.department || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    const checkResponse = await axios.get(`{API_BASE_URL}/users/${user.id}`);
    if (!checkResponse.data) {
      alert('Пользователь не найден');
      return;
    }
	const response = await axios.patch(`{API_BASE_URL}/users/${user.id}`, formData);
    
    if (response.status === 200) {
      alert('Данные обновлены');
      setIsEditing(false);
      
      // Обновляем данные в localStorage
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();
	}
    } catch (error) {
      console.error('Ошибка обновления:', error);
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', error.response.data);
      alert(`Ошибка ${error.response.status}: ${error.response.data || 'Не удалось обновить данные'}`);
    } else if (error.request) {
      alert('Сервер не отвечает. Проверьте, запущен ли json-server');
    } else {
      alert('Ошибка при обновлении данных');
    }
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

  return (
    <div className="container">
      <div className="profile-container">
        <Link to="/" className="back-button">← Назад</Link>
        
        <div className="profile-card">
          <div className="profile-avatar-large">
            {user?.avatar || user?.name?.charAt(0) || '👤'}
          </div>
          
          <h1>{user?.name}</h1>
          <p className="profile-role">{getRoleName(user?.role)}</p>
          
          <div className="profile-details">
            <div className="detail-item">
              <span className="detail-label">📧 Email:</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">📞 Телефон:</span>
              {isEditing ? (
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                <span className="detail-value">{user?.phone || 'Не указан'}</span>
              )}
            </div>
            
            <div className="detail-item">
              <span className="detail-label">💼 Должность:</span>
              {isEditing ? (
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                <span className="detail-value">{user?.position || 'Не указана'}</span>
              )}
            </div>
            
            <div className="detail-item">
              <span className="detail-label">🏥 Отделение:</span>
              {isEditing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="edit-input"
                />
              ) : (
                <span className="detail-value">{user?.department || 'Не указано'}</span>
              )}
            </div>
          </div>
          
          <div className="profile-actions">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                ✏️ Редактировать
              </button>
            ) : (
              <>
                <button onClick={handleSubmit} className="btn-primary">
                  💾 Сохранить
                </button>
                <button onClick={() => setIsEditing(false)} className="btn-secondary">
                  ❌ Отмена
                </button>
              </>
            )}
            <button onClick={logout} className="btn-danger">
              🚪 Выйти из системы
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
