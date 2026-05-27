// App.js - обновленная версия
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Form from './pages/Form';
import Detail from './pages/Detail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import API_BASE_URL from './config';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner"></div>;
  }
  
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-spinner"></div>;
  }
  
  return isAuthenticated() && isAdmin() ? children : <Navigate to="/" />;
};

function AppContent() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  
  const availableRanks = [
    { id: 1, name: "Врач-терапевт", category: "Врачи" },
    { id: 2, name: "Врач-хирург", category: "Врачи" },
    { id: 3, name: "Врач-педиатр", category: "Врачи" },
    { id: 4, name: "Медицинская сестра", category: "Средний персонал" },
    { id: 5, name: "Старшая медицинская сестра", category: "Средний персонал" },
    { id: 6, name: "Фельдшер", category: "Средний персонал" },
    { id: 7, name: "Лаборант", category: "Младший персонал" },
    { id: 8, name: "Санитарка", category: "Младший персонал" },
    { id: 9, name: "Заведующий отделением", category: "Руководство" },
    { id: 10, name: "Главный врач", category: "Руководство" }
  ];



const loadEmployees = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users`);
    setEmployees(response.data);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  } finally {
    setLoading(false);
  }
};

const addEmployee = async (newEmployee) => {
  if (!isAdmin()) {
    alert('Только администратор может добавлять сотрудников');
    return false;
  }
  
  try {
    const response = await axios.post(`${API_BASE_URL}/users`, {
      ...newEmployee,
      password: 'default123',
      role: 'employee',
      isApproved: true,
      createdAt: new Date().toISOString()
    });
    setEmployees([...employees, response.data]);
    return true;
  } catch (error) {
    console.error('Ошибка добавления:', error);
    return false;
  }
};

  const updateEmployee = async (id, updatedData) => {
  if (!isAdmin()) {
    alert('Только администратор может редактировать сотрудников');
    return false;
  }
  
  try {
    // Проверяем, существует ли пользователь
    const checkResponse = await axios.get(`http://localhost:5000/users/${id}`);
    if (!checkResponse.data) {
      alert('Пользователь не найден');
      return false;
    }
    
    // Обновляем пользователя
    const response = await axios.patch(`http://localhost:5000/users/${id}`, updatedData);
    setEmployees(employees.map(emp => emp.id === id ? response.data : emp));
    return true;
  } catch (error) {
    console.error('Ошибка обновления:', error);
    if (error.response) {
      console.error('Статус:', error.response.status);
      console.error('Данные:', error.response.data);
      alert(`Ошибка ${error.response.status}: ${error.response.statusText || 'Не удалось обновить данные'}`);
    } else if (error.request) {
      alert('Сервер не отвечает. Проверьте, запущен ли json-server на порту 5000');
    } else {
      alert('Ошибка при обновлении данных: ' + error.message);
    }
    return false;
  }
};

  const deleteEmployee = async (id) => {
    if (!isAdmin()) {
      alert('Только администратор может удалять сотрудников');
      return false;
    }
    
    try {
      await axios.delete(`http://localhost:5000/users/${id}`);
      setEmployees(employees.filter(emp => emp.id !== id));
      return true;
    } catch (error) {
      console.error('Ошибка удаления:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadEmployees();
    }
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Home 
            employees={employees} 
            loading={loading}
            onDelete={deleteEmployee}
            currentUser={user}
            isAdmin={isAdmin()}
          />
        </PrivateRoute>
      } />
      
      <Route path="/admin" element={
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      } />
      
      <Route path="/add" element={
        <AdminRoute>
          <Form 
            onAdd={addEmployee}
            availableRanks={availableRanks}
            isAdmin={isAdmin()}
          />
        </AdminRoute>
      } />
      
      <Route path="/detail/:id" element={
        <PrivateRoute>
          <Detail 
            employees={employees}
            onUpdate={updateEmployee}
            onDelete={deleteEmployee}
            availableRanks={availableRanks}
            currentUser={user}
            isAdmin={isAdmin()}
          />
        </PrivateRoute>
      } />
      
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
