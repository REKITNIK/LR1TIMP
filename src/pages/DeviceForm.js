// src/pages/DeviceForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config';


const DeviceForm = ({ onAdd, onUpdate, devices, isAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'medical',
    category: 'Диагностическое оборудование',
    ipAddress: '',
    macAddress: '',
    location: '',
    department: '',
    manufacturer: '',
    model: '',
    serialNumber: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [fetching, setFetching] = useState(false);



  // Загрузка данных устройства при редактировании
  useEffect(() => {
    if (isEditing) {
      const loadDevice = async () => {
        setFetching(true);
        try {
          // Пробуем получить устройство из пропсов
          let device = devices?.find(d => d.id === id);
          
          // Если не нашли, загружаем из API
          if (!device) {
            const response = await axios.get(`${API_BASE_URL}/devices/${id}`);
            device = response.data;
          }
          
          if (device) {
            setFormData({
              name: device.name || '',
              type: device.type || 'medical',
              category: device.category || '',
              ipAddress: device.ipAddress || '',
              macAddress: device.macAddress || '',
              location: device.location || '',
              department: device.department || '',
              manufacturer: device.manufacturer || '',
              model: device.model || '',
              serialNumber: device.serialNumber || ''
            });
          } else {
            alert('Устройство не найдено');
            navigate('/');
          }
        } catch (error) {
          console.error('Ошибка загрузки устройства:', error);
          alert('Устройство не найдено');
          navigate('/');
        } finally {
          setFetching(false);
        }
      };
      
      loadDevice();
    }
  }, [isEditing, id, devices, navigate]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Название обязательно';
    if (!formData.ipAddress) {
      newErrors.ipAddress = 'IP адрес обязателен';
    } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(formData.ipAddress)) {
      newErrors.ipAddress = 'Неверный формат IP';
    }
    if (!formData.macAddress) {
      newErrors.macAddress = 'MAC адрес обязателен';
    }
    
    return newErrors;
  };
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('Только администратор может добавлять устройства');
      return;
    }
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    
    try {
      let success;
      
      if (isEditing) {
        // Редактирование существующего устройства
        success = await onUpdate(id, formData);
        if (success) {
          alert('Устройство успешно обновлено!');
          navigate('/');
        } else {
          alert('Ошибка при обновлении устройства');
        }
      } else {
        // Создание нового устройства
        const response = await axios.post(`${API_BASE_URL}/devices`, {
          ...formData,
          status: 'offline',
          power: 'off',
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          temperature: 22,
          cpuUsage: 0,
          memoryUsage: 0
        });
        
        if (response.status === 201) {
          alert('Устройство успешно добавлено!');
          navigate('/');
        } else {
          alert('Ошибка при добавлении устройства');
        }
      }
    } catch (error) {
      console.error('Ошибка:', error);
      const errorMessage = error.response?.data?.error || 'Ошибка при сохранении устройства';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (fetching) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Загрузка данных устройства...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className="form-container">
        <h1>{isEditing ? '✏️ Редактирование устройства' : '➕ Добавление устройства'}</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название устройства *</label>
            <div className="input-wrapper">
              <span className="input-icon">📟</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="МРТ Томограф Siemens"
              />
            </div>
            {errors.name && <div className="error-message">{errors.name}</div>}
          </div>
          
          <div className="form-group">
            <label>Тип устройства</label>
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="medical">🏥 Медицинское оборудование</option>
              <option value="life-support">⚠️ Жизнеобеспечение</option>
              <option value="patient-monitor">📊 Мониторинг</option>
              <option value="network">🌐 Сетевое оборудование</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Категория</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Диагностическое оборудование"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>IP адрес *</label>
              <div className="input-wrapper">
                <span className="input-icon">🌐</span>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleChange}
                  placeholder="192.168.1.100"
                />
              </div>
              {errors.ipAddress && <div className="error-message">{errors.ipAddress}</div>}
            </div>
            
            <div className="form-group">
              <label>MAC адрес *</label>
              <div className="input-wrapper">
                <span className="input-icon">🔌</span>
                <input
                  type="text"
                  name="macAddress"
                  value={formData.macAddress}
                  onChange={handleChange}
                  placeholder="00:1A:2B:3C:4D:5E"
                />
              </div>
              {errors.macAddress && <div className="error-message">{errors.macAddress}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Местоположение</label>
              <div className="input-wrapper">
                <span className="input-icon">📍</span>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Кабинет 101, 2 этаж"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Отделение</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="Радиология"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Производитель</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="Siemens"
              />
            </div>
            
            <div className="form-group">
              <label>Модель</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="MAGNETOM Vida"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Серийный номер</label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="SN-2024-001"
            />
          </div>
          
          <div className="button-group">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Сохранение...' : '💾 Сохранить'}
            </button>
            <Link to="/" className="btn-secondary">❌ Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceForm;
