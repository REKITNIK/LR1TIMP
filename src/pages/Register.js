import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    position: '',
    department: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Имя должно содержать минимум 2 символа';
    }
    
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }
    
    if (!formData.position) {
      newErrors.position = 'Укажите должность';
    }
    
    if (!formData.department) {
      newErrors.department = 'Укажите отделение';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      position: formData.position,
      department: formData.department,
      phone: formData.phone,
      avatar: formData.name.charAt(0)
    });
    
    if (result.success) {
      setSuccessMessage(result.message);
      // Очищаем форму
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        position: '',
        department: '',
        phone: ''
      });
      // Через 3 секунды перенаправляем на логин
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setErrors({ general: result.error });
    }
    
    setLoading(false);
  };

  if (successMessage) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">📧</div>
            <h1>Заявка отправлена!</h1>
          </div>
          <div className="success-message">
            <p>{successMessage}</p>
            <p>Вы будете перенаправлены на страницу входа через несколько секунд...</p>
          </div>
          <Link to="/login" className="btn-primary" style={{ textAlign: 'center', marginTop: '20px' }}>
            Перейти к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-logo">🏥</div>
          <h1>Регистрация</h1>
          <p>Станьте частью нашей команды</p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>ФИО *</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Иванова Анна Петровна"
                />
              </div>
              {errors.name && <div className="error-message">{errors.name}</div>}
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="anna@hospital.ru"
                />
              </div>
              {errors.email && <div className="error-message">{errors.email}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Пароль *</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Минимум 6 символов"
                />
              </div>
              {errors.password && <div className="error-message">{errors.password}</div>}
            </div>
            
            <div className="form-group">
              <label>Подтверждение пароля *</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Повторите пароль"
                />
              </div>
              {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Должность *</label>
              <div className="input-wrapper">
                <span className="input-icon">💼</span>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  placeholder="Врач-терапевт"
                />
              </div>
              {errors.position && <div className="error-message">{errors.position}</div>}
            </div>
            
            <div className="form-group">
              <label>Отделение *</label>
              <div className="input-wrapper">
                <span className="input-icon">🏥</span>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  placeholder="Терапия"
                />
              </div>
              {errors.department && <div className="error-message">{errors.department}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label>Телефон</label>
            <div className="input-wrapper">
              <span className="input-icon">📞</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>
          
          {errors.general && <div className="error-message">{errors.general}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Отправка...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
