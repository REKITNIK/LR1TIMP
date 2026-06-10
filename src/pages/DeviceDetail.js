// src/pages/DeviceDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config';


const DeviceDetail = ({ devices, onUpdate, onDelete, isAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const { user } = useAuth();



  // Загрузка устройства
  useEffect(() => {
    const loadDevice = async () => {
      setLoading(true);
      try {
        console.log('Загрузка устройства с ID:', id);
        
        // Сначала ищем в пропсах
        let foundDevice = devices?.find(d => d.id === id);
        
        // Если не нашли, загружаем из API
        if (!foundDevice) {
          console.log('Загружаем из API...');
          const response = await axios.get(`${API_BASE_URL}/devices/${id}`);
          foundDevice = response.data;
        }
        
        console.log('Найденное устройство:', foundDevice);
        
        if (foundDevice) {
          setDevice(foundDevice);
          setEditForm(foundDevice);
        } else {
          console.log('Устройство не найдено');
          alert('Устройство не найдено');
          navigate('/');
        }
      } catch (error) {
        console.error('Ошибка загрузки устройства:', error);
        alert('Ошибка при загрузке устройства');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadDevice();
    }
  }, [id, devices, navigate]);

  // Включение/выключение устройства
  const toggleDevice = async () => {
    if (!isAdmin) {
      alert('Только администратор может управлять устройствами');
      return;
    }
    
    const newPower = device.power === 'on' ? 'off' : 'on';
    const newStatus = newPower === 'on' ? 'online' : 'offline';
    
    try {
      const response = await axios.patch(`${API_BASE_URL}/devices/${id}`, {
        power: newPower,
        status: newStatus,
        lastSeen: new Date().toISOString()
      });
      
      setDevice({ ...device, power: newPower, status: newStatus });
      alert(`Устройство ${newPower === 'on' ? 'включено' : 'выключено'}`);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при управлении устройством');
    }
  };

  // Удаление устройства
  const handleDelete = async () => {
    if (!isAdmin) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/devices/${id}`);
      alert('Устройство удалено');
      navigate('/');
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при удалении устройства');
    }
  };

  // Редактирование
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/devices/${id}`, editForm);
      setDevice(response.data);
      setIsEditing(false);
      alert('Данные обновлены');
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при сохранении');
    }
  };

  const getStatusIcon = () => {
    if (!device) return '⚫';
    if (device.power === 'off') return '🔴 Выключено';
    if (device.status === 'online') return '🟢 Онлайн';
    return '⚫ Оффлайн';
  };

  const getDeviceIcon = () => {
    if (!device) return '💻';
    switch(device.type) {
      case 'medical': return '🏥';
      case 'life-support': return '⚠️';
      case 'patient-monitor': return '📊';
      default: return '💻';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="loading-spinner"></div>
          <p>Загрузка информации об устройстве...</p>
        </div>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="container">
        <div className="empty-state">
          <h2>❌ Устройство не найдено</h2>
          <p>Устройство с ID {id} не существует или было удалено</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            ← Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="device-profile">
        <button onClick={() => navigate('/')} className="back-button">
          ← Назад к списку
        </button>
        
        <div className="profile-header">
          <div className="profile-avatar">
            {getDeviceIcon()}
          </div>
          <div className="profile-actions">
            {isAdmin && (
              <>
                <button onClick={toggleDevice} className={device.power === 'on' ? 'btn-danger' : 'btn-success'}>
                  {device.power === 'on' ? '🔴 Выключить' : '🟢 Включить'}
                </button>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="btn-edit">
                    ✏️ Редактировать
                  </button>
                ) : (
                  <button onClick={handleSave} className="btn-primary">
                    💾 Сохранить
                  </button>
                )}
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-delete">
                  🗑️ Удалить
                </button>
              </>
            )}
          </div>
        </div>
        
        {!isEditing ? (
          // Режим просмотра
          <div className="profile-info">
            <h2>{device.name}</h2>
            
            <div className="info-section">
              <h3>Основная информация</h3>
              <div className="info-row">
                <span className="info-label">Статус:</span>
                <span className="info-value">{getStatusIcon()}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Тип:</span>
                <span className="info-value">{device.type || 'Не указан'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Категория:</span>
                <span className="info-value">{device.category || 'Не указана'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Отделение:</span>
                <span className="info-value">{device.department || 'Не указано'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Локация:</span>
                <span className="info-value">{device.location || 'Не указана'}</span>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Сетевые параметры</h3>
              <div className="info-row">
                <span className="info-label">IP адрес:</span>
                <span className="info-value">{device.ipAddress || 'Не указан'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">MAC адрес:</span>
                <span className="info-value">{device.macAddress || 'Не указан'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Последний контакт:</span>
                <span className="info-value">
                  {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Не известно'}
                </span>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Технические характеристики</h3>
              <div className="info-row">
                <span className="info-label">Производитель:</span>
                <span className="info-value">{device.manufacturer || 'Не указан'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Модель:</span>
                <span className="info-value">{device.model || 'Не указана'}</span>
              </div>
              {device.temperature && (
                <div className="info-row">
                  <span className="info-label">Температура:</span>
                  <span className="info-value">{device.temperature}°C</span>
                </div>
              )}
              {device.cpuUsage !== undefined && (
                <div className="info-row">
                  <span className="info-label">CPU нагрузка:</span>
                  <span className="info-value">{device.cpuUsage}%</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Режим редактирования
          <div className="profile-info">
            <h2>Редактирование устройства</h2>
            
            <div className="form-group">
              <label>Название</label>
              <input
                type="text"
                name="name"
                value={editForm.name || ''}
                onChange={handleEditChange}
              />
            </div>
            
            <div className="form-group">
              <label>IP адрес</label>
              <input
                type="text"
                name="ipAddress"
                value={editForm.ipAddress || ''}
                onChange={handleEditChange}
              />
            </div>
            
            <div className="form-group">
              <label>MAC адрес</label>
              <input
                type="text"
                name="macAddress"
                value={editForm.macAddress || ''}
                onChange={handleEditChange}
              />
            </div>
            
            <div className="form-group">
              <label>Локация</label>
              <input
                type="text"
                name="location"
                value={editForm.location || ''}
                onChange={handleEditChange}
              />
            </div>
            
            <div className="form-group">
              <label>Отделение</label>
              <input
                type="text"
                name="department"
                value={editForm.department || ''}
                onChange={handleEditChange}
              />
            </div>
            
            <div className="button-group">
              <button onClick={() => setIsEditing(false)} className="btn-secondary">
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
      
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h3>Подтверждение удаления</h3>
            <p>Удалить устройство <strong>{device.name}</strong>?</p>
            <p className="modal-warning">Это действие нельзя отменить!</p>
            <div className="modal-buttons">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">
                Отмена
              </button>
              <button onClick={handleDelete} className="btn-danger">
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;
