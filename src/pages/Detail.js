import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import API_BASE_URL from '../config';
// ...

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

  // Состояние для атрибутов врача
  const [doctorAttributes, setDoctorAttributes] = useState({
    specialization: '',
    experience: '',
    education: '',
    qualification: '',
    cabinet: '',
    schedule: '',
    patientsPerDay: '',
    rating: '',
    biography: '',
    certificates: [],
    languages: []
  });

  // данные напрямую из API
  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        let foundEmployee = employees?.find(emp => emp.id === parseInt(id));
        
        if (!foundEmployee) {
          const response = await axios.get(`${API_BASE_URL}/users/${id}`);
          foundEmployee = response.data;
        }
        
        if (foundEmployee) {
          setEmployee(foundEmployee);
          // Загружаем атрибуты если есть
          if (foundEmployee.doctorAttributes) {
            setDoctorAttributes(foundEmployee.doctorAttributes);
          }
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

  // Обработчик изменения атрибутов
  const handleAttributeChange = (field, value) => {
    setDoctorAttributes(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // ЕДИНСТВЕННАЯ функция handleSubmit
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
    
    // Формируем обновленные данные с атрибутами
    const updatedEmployee = {
      ...employee,
      name: name.trim(),
      position: rang,
      rang: rang
    };
    
    // Добавляем атрибуты только для врачей
    if (employee.role === 'doctor') {
      updatedEmployee.doctorAttributes = doctorAttributes;
    }
    
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

  // Компонент для отображения атрибутов врача
  const DoctorAttributesView = ({ attributes }) => (
    <div className="info-section">
      <h3>Профессиональные данные</h3>
      <div className="attributes-grid">
        <div className="attribute-card">
          <div className="attribute-label">🎯 Специализация</div>
          <div className="attribute-value">{attributes.specialization || 'Не указана'}</div>
        </div>
        <div className="attribute-card">
          <div className="attribute-label">⭐ Стаж (лет)</div>
          <div className="attribute-value">{attributes.experience || 'Не указан'}</div>
        </div>
        <div className="attribute-card">
          <div className="attribute-label">🎓 Образование</div>
          <div className="attribute-value">{attributes.education || 'Не указано'}</div>
        </div>
        <div className="attribute-card">
          <div className="attribute-label">📜 Квалификация</div>
          <div className="attribute-value">{attributes.qualification || 'Не указана'}</div>
        </div>
        <div className="attribute-card">
          <div className="attribute-label">🚪 Кабинет</div>
          <div className="attribute-value">{attributes.cabinet || 'Не указан'}</div>
        </div>
        <div className="attribute-card">
          <div className="attribute-label">📅 График работы</div>
          <div className="attribute-value">{attributes.schedule || 'Не указан'}</div>
        </div>
        <div className="attribute-card">
          <div className="attribute-label">👥 Пациентов в день</div>
          <div className="attribute-value">{attributes.patientsPerDay || 'Не указано'}</div>
        </div>
        <div className="attribute-card">
          <div className="attribute-label">⭐ Рейтинг</div>
          <div className="attribute-value">
            {'⭐'.repeat(Math.floor(attributes.rating || 0))} {attributes.rating || 'Не указан'}
          </div>
        </div>
      </div>
      {attributes.biography && (
        <div className="attribute-card full-width">
          <div className="attribute-label">📝 Биография</div>
          <div className="attribute-value">{attributes.biography}</div>
        </div>
      )}
      {attributes.certificates && attributes.certificates.length > 0 && (
        <div className="attribute-card full-width">
          <div className="attribute-label">📜 Сертификаты</div>
          <div className="attribute-value">{attributes.certificates.join(', ')}</div>
        </div>
      )}
      {attributes.languages && attributes.languages.length > 0 && (
        <div className="attribute-card full-width">
          <div className="attribute-label">🌐 Языки</div>
          <div className="attribute-value">{attributes.languages.join(', ')}</div>
        </div>
      )}
    </div>
  );

  // Компонент для редактирования атрибутов врача
  const DoctorAttributesEdit = ({ attributes, onChange }) => (
    <div className="info-section">
      <h3>Профессиональные данные</h3>
      
      <div className="form-group">
        <label>Специализация:</label>
        <input
          type="text"
          value={attributes.specialization || ''}
          onChange={(e) => onChange('specialization', e.target.value)}
          placeholder="Например: Кардиология"
        />
      </div>
      
      <div className="form-group">
        <label>Стаж (лет):</label>
        <input
          type="number"
          value={attributes.experience || ''}
          onChange={(e) => onChange('experience', e.target.value)}
          placeholder="Например: 10"
        />
      </div>
      
      <div className="form-group">
        <label>Образование:</label>
        <input
          type="text"
          value={attributes.education || ''}
          onChange={(e) => onChange('education', e.target.value)}
          placeholder="ВУЗ, год окончания"
        />
      </div>
      
      <div className="form-group">
        <label>Квалификация:</label>
        <select
          value={attributes.qualification || ''}
          onChange={(e) => onChange('qualification', e.target.value)}
        >
          <option value="">Выберите категорию</option>
          <option value="Вторая категория">Вторая категория</option>
          <option value="Первая категория">Первая категория</option>
          <option value="Высшая категория">Высшая категория</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Кабинет:</label>
        <input
          type="text"
          value={attributes.cabinet || ''}
          onChange={(e) => onChange('cabinet', e.target.value)}
          placeholder="Номер кабинета"
        />
      </div>
      
      <div className="form-group">
        <label>График работы:</label>
        <input
          type="text"
          value={attributes.schedule || ''}
          onChange={(e) => onChange('schedule', e.target.value)}
          placeholder="ПН-ПТ 9:00-18:00"
        />
      </div>
      
      <div className="form-group">
        <label>Пациентов в день:</label>
        <input
          type="number"
          value={attributes.patientsPerDay || ''}
          onChange={(e) => onChange('patientsPerDay', e.target.value)}
          placeholder="20"
        />
      </div>
      
      <div className="form-group">
        <label>Рейтинг (0-5):</label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={attributes.rating || ''}
          onChange={(e) => onChange('rating', e.target.value)}
          placeholder="4.5"
        />
      </div>
      
      <div className="form-group">
        <label>Биография:</label>
        <textarea
          rows="3"
          value={attributes.biography || ''}
          onChange={(e) => onChange('biography', e.target.value)}
          placeholder="Краткая биография врача..."
        />
      </div>
      
      <div className="form-group">
        <label>Сертификаты (через запятую):</label>
        <input
          type="text"
          value={attributes.certificates?.join(', ') || ''}
          onChange={(e) => onChange('certificates', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
          placeholder="Терапия, Кардиология, УЗИ"
        />
      </div>
      
      <div className="form-group">
        <label>Языки (через запятую):</label>
        <input
          type="text"
          value={attributes.languages?.join(', ') || ''}
          onChange={(e) => onChange('languages', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
          placeholder="Русский, Английский"
        />
      </div>
    </div>
  );
  
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
            
            {/* Показываем атрибуты только для врачей */}
            {employee.role === 'doctor' && (
              <DoctorAttributesView attributes={employee.doctorAttributes || doctorAttributes} />
            )}
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
          
          {/* Поля для атрибутов врача (только если роль doctor) */}
          {employee.role === 'doctor' && (
            <DoctorAttributesEdit 
              attributes={doctorAttributes} 
              onChange={handleAttributeChange} 
            />
          )}
          
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
