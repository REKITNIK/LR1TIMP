import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Form = ({ onAdd, availableRanks }) => {
  const nameRef = useRef(null);
  const rangRef = useRef(null);
  const navigate = useNavigate();
  
  // Состояния для ошибок валидации
  const [nameError, setNameError] = useState('');
  const [rangError, setRangError] = useState('');
  const [touched, setTouched] = useState({ name: false, rang: false });

  //  Функция проверки имени (без цифр и специальных символов)
  const validateName = (name) => {
    if (!name || name.trim() === '') {
      return 'Имя обязательно для заполнения';
    }
    
    if (/\d/.test(name)) {
      return 'Имя не должно содержать цифры';
    }
	// проверка имён в формах    
    if (!/^[a-zA-Zа-яА-ЯёЁ\s\-\.]+$/.test(name)) {
      return 'Имя может содержать только буквы, пробелы, дефисы и точки';
    }
    
    // проверка на мин длину
    if (name.trim().length < 2) {
      return 'Имя должно содержать минимум 2 символа';
    }
    
    // проверка на макс длину
    if (name.trim().length > 50) {
      return 'Имя не должно превышать 50 символов';
    }
    
    return '';
  };

  // функция проверки должности
  const validateRang = (rang) => {
    if (!rang || rang === '') {
      return 'Пожалуйста, выберите должность';
    }
    return '';
  };

  // обработчик изменения имени
  const handleNameChange = () => {
    if (touched.name) {
      const error = validateName(nameRef.current.value);
      setNameError(error);
    }
  };

  // обработчик изменения должности
  const handleRangChange = () => {
    if (touched.rang) {
      const error = validateRang(rangRef.current.value);
      setRangError(error);
    }
  };

  // обработчик потери фокуса
  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    if (field === 'name') {
      setNameError(validateName(nameRef.current.value));
    } else if (field === 'rang') {
      setRangError(validateRang(rangRef.current.value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // все поля как touched
    setTouched({ name: true, rang: true });
    
    const name = nameRef.current.value;
    const rang = rangRef.current.value;
    
    // валидация перед отправкой
    const nameValidationError = validateName(name);
    const rangValidationError = validateRang(rang);
    
    setNameError(nameValidationError);
    setRangError(rangValidationError);
    
    // ошибки? - не отправляем
    if (nameValidationError || rangValidationError) {
      return;
    }
    
    const newEmployee = {
      name: name.trim(),
      rang: rang,
    };
    
    const success = await onAdd(newEmployee);
    
    if (success) {
      navigate('/');
    } else {
      alert('Ошибка при добавлении сотрудника');
    }
  };
  
  return (
    <div className="container">
      <div className="form-container">
        <h1>➕ Добавление сотрудника</h1>
        <form onSubmit={handleSubmit}>
          {/* Поле для имени */}
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
                placeholder="Например: Иванова Анна Петровна"
                className={nameError ? 'error' : ''}
              />
            </div>
            {nameError && <div className="error-message">{nameError}</div>}
            <div className="hint">Только буквы, пробелы, дефисы и точки (без цифр)</div>
          </div>
          
          {/* Поле для должности - выпадающий список */}
          <div className="form-group">
            <label>Должность *</label>
            <div className="input-wrapper">
              <span className="input-icon">🏅</span>
              <select 
                ref={rangRef}
                onChange={handleRangChange}
                onBlur={() => handleBlur('rang')}
                required
                defaultValue=""
                className={rangError ? 'error' : ''}
              >
                <option value="" disabled>Выберите должность</option>
                
                {/* Группировка должностей по категориям */}
                {Object.entries(
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
            <button type="submit" className="btn-primary">💾 Сохранить</button>
            <Link to="/" className="btn-secondary">❌ Отмена</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form;
