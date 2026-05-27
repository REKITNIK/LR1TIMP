import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Detail = ({ employees, onUpdate, onDelete, availableRanks, currentUser, isAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const nameRef = useRef(null);
  const rangRef = useRef(null);
  
  const [nameError, setNameError] = useState('');
  const [rangError, setRangError] = useState('');
  const [touched, setTouched] = useState({ name: false, rang: false });

  // данные напрямую из API
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        // поиск сотрудника в переданных пропсах
        let foundEmployee = employees?.find(emp => emp.id === parseInt(id));
        
        // нет сотрудника? загружаем напрямую из API
        if (!foundEmployee) {
          const response = await axios.get(`http://localhost:5000/users/${id}`);
          foundEmployee = response.data;
        }
        
        if (foundEmployee) {
          setEmployee(foundEmployee);
        } else {
          setEmployee(null);
        }
      } catch (error) {
        console.error('Ошибка загрузки сотрудника:', error);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadEmployee();
  }, [id, employees]);

  // устанавливаем значения в поля при редактировании
  useEffect(() => {
    if (employee && isEditing && nameRef.current && rangRef.current) {
      nameRef.current.value = employee.name || '';
      rangRef.current.value = employee.position || employee.rang || '';
    }
  }, [employee, isEditing]);

  const validateName = (name) => {
    if (!name || name.trim() === '') {
      return 'Имя обязательно для заполнения';
    }
    if (/\d/.test(name)) {
      return 'Имя не должно содержать цифры';
    }
    if (!/^[a-zA-Zа-яА-ЯёЁ\s\-\.]+$/.test(name)) {
      return 'Имя может содержать только буквы, пробелы, дефисы и точки';
    }
    if (name.trim().length < 2) {
      return 'Имя должно содержать минимум 2 символа';
    }
    if (name.trim().length > 50) {
      return 'Имя не должно превышать 50 символов';
    }
    return '';
  };

  const validateRang = (rang) => {
    if (!rang || rang === '') {
      return 'Пожалуйста, выберите должность';
    }
    return '';
  };

  const handleNameChange = () => {
    if (touched.name) {
      setNameError(validateName(nameRef.current?.value || ''));
    }
  };

  const handleRangChange = () => {
    if (touched.rang) {
      setRangError(validateRang(rangRef.current?.value || ''));
    }
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    if (field === 'name') {
      setNameError(validateName(nameRef.current?.value || ''));
    } else if (field === 'rang') {
      setRangError(validateRang(rangRef.current?.value || ''));
    }
  };
  
  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!isAdmin) {
    alert('Только администратор может редактировать сотрудников');
    return;
  }
  
  setTouched({ name: true, rang: true });
  
  const name = nameRef.current?.value || '';
  const rang = rangRef.current?.value || '';
  
  const nameValidationError = validateName(name);
  const rangValidationError = validateRang(rang);
  
  setNameError(nameValidationError);
  setRangError(rangValidationError);
  
  if (nameValidationError || rangValidationError) {
    return;
  }
  
  // Исправлено: сохраняем оба поля для совместимости
  const updatedEmployee = {
    ...employee,
    name: name.trim(),
    position: rang,
    rang: rang  // Добавляем rang для старых записей
  };
  
  const success = await onUpdate(employee.id, updatedEmployee);
  
  if (success) {
    setEmployee(updatedEmployee);
    setIsEditing(false);
    setTouched({ name: false, rang: false });
  } else {
    alert('Ошибка при обновлении данных');
  }
};
  
  const handleCancel = () => {
    setIsEditing(false);
    setNameError('');
    setRangError('');
    setTouched({ name: false, rang: false });
  };
  
  const handleDelete = async () => {
    if (!isAdmin) {
      alert('Только администратор может удалять сотрудников');
      return;
    }
    
    const success = await onDelete(parseInt(id));
    if (success) {
      navigate('/');
    } else {
      alert('Ошибка при удалении');
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return '👑';
      case 'doctor': return '👨‍⚕️';
      case 'nurse': return '👩‍⚕️';
      default: return '🧑‍💼';
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
          <div className="loading-spinner"></div>
          <p>Загрузка данных сотрудника...</p>
        </div>
      </div>
    );
  }
  
  if (!employee) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h2>Сотрудник не найден</h2>
          <p>Сотрудник с ID {id} не существует или был удален</p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '20px' }}>
            ← Вернуться к списку
          </button>
        </div>
      </div>
    );
  }
  
  // Режим просмотра
  if (!isEditing) {
    return (
      <div className="container">
        <div className="employee-profile">
          <button onClick={() => navigate('/')} className="back-button">
            ← Назад к списку
          </button>
          
          <div className="profile-header">
            <div className="profile-avatar">
              {employee.avatar || employee.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="profile-actions">
              {isAdmin && (
                <>
                  <button onClick={() => setIsEditing(true)} className="btn-edit">
                    ✏️ Редактировать
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="btn-delete">
                    🗑️ Удалить
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="profile-info">
            <div className="info-section">
              <h2>Личная информация</h2>
              <div className="info-row">
                <span className="info-label">ФИО:</span>
                <span className="info-value">{employee.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Должность:</span>
                <span className="info-value">
                  <span className="rank-badge">{employee.position || employee.rang}</span>
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Отделение:</span>
                <span className="info-value">{employee.department || 'Не указано'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Роль:</span>
                <span className="info-value">
                  {getRoleIcon(employee.role)} {getRoleName(employee.role)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{employee.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Телефон:</span>
                <span className="info-value">{employee.phone || 'Не указан'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Дата регистрации:</span>
                <span className="info-value">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="info-section">
              <h3>Статистика</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{employees?.length || 0}</div>
                  <div className="stat-label">Всего сотрудников</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{
                    employees?.filter(e => e.position === employee.position).length || 0
                  }</div>
                  <div className="stat-label">С такой же должностью</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-icon">⚠️</div>
              <h3>Подтверждение удаления</h3>
              <p>Вы уверены, что хотите удалить сотрудника <strong>{employee.name}</strong>?</p>
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
  }
  
  // Режим редактирования
  return (
    <div className="container">
      <div className="form-container">
        <div className="form-header">
          <h1>✏️ Редактирование сотрудника</h1>
          <button onClick={handleCancel} className="close-button">✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ФИО сотрудника *</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                ref={nameRef}
                onChange={handleNameChange}
                onBlur={() => handleBlur('name')}
                required 
                className={nameError ? 'error' : ''}
                placeholder="Иванова Анна Петровна"
                defaultValue={employee.name}
              />
            </div>
            {nameError && <div className="error-message">{nameError}</div>}
            <div className="hint">Только буквы, пробелы, дефисы и точки (без цифр)</div>
          </div>
          
          <div className="form-group">
            <label>Должность *</label>
            <div className="input-wrapper">
              <span className="input-icon">🏅</span>
              <select 
                ref={rangRef}
                onChange={handleRangChange}
                onBlur={() => handleBlur('rang')}
                required
                className={rangError ? 'error' : ''}
                defaultValue={employee.position || employee.rang}
              >
                <option value="" disabled>Выберите должность</option>
                {availableRanks && Object.entries(
                  availableRanks.reduce((acc, rank) => {
                    if (!acc[rank.category]) acc[rank.category] = [];
                    acc[rank.category].push(rank);
                    return acc;
                  }, {})
                ).map(([category, ranks]) => (
                  <optgroup key={category} label={category}>
                    {ranks.map(rank => (
                      <option key={rank.id} value={rank.name}>
                        {rank.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {rangError && <div className="error-message">{rangError}</div>}
          </div>
          
          <div className="button-group">
            <button type="submit" className="btn-primary">💾 Сохранить изменения</button>
            <button type="button" onClick={handleCancel} className="btn-secondary">
              ❌ Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Detail;
