// src/App.js - исправленная версия
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import DeviceForm from './pages/DeviceForm';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Navigation from './components/Navigation';
import API_BASE_URL from './config';
import './App.css';
import Incidents from './pages/Incidents';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-spinner"></div>;
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="loading-spinner"></div>;
  return isAuthenticated() && isAdmin() ? children : <Navigate to="/" />;
};

// Компонент-обертка для авторизованных страниц с навигацией
const AuthenticatedLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  return (
    <>
      <Navigation />
      {children}
    </>
  );
};

function AppContent() {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  

const [devicesPagination, setDevicesPagination] = useState({});

const [usersPagination, setUsersPagination] = useState({});
  // Загрузка устройств
  const loadDevices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/devices`);
      setDevices(response.data.data);        // массив устройств
        setDevicesPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки устройств:', error);
    }
  };

  // Загрузка пользователей
  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data.data);        // массив устройств
        setUsersPagination(response.data.pagination);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDevice = async (newDevice) => {
    if (!isAdmin()) {
      alert('Только администратор может добавлять устройства');
      return false;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/devices`, {
        ...newDevice,
        status: 'offline',
        power: 'off',
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setDevices([...devices, response.data]);
      return true;
    } catch (error) {
      console.error('Ошибка:', error);
      return false;
    }
  };

  const updateDevice = async (id, updatedData) => {
    if (!isAdmin()) return false;
    try {
      const response = await axios.patch(`${API_BASE_URL}/devices/${id}`, updatedData);
      setDevices(devices.map(d => d.id === id ? response.data : d));
      return true;
    } catch (error) {
      console.error('Ошибка:', error);
      return false;
    }
  };

  const deleteDevice = async (id) => {
    if (!isAdmin()) return false;
    try {
      await axios.delete(`${API_BASE_URL}/devices/${id}`);
      setDevices(devices.filter(d => d.id !== id));
      return true;
    } catch (error) {
      console.error('Ошибка:', error);
      return false;
    }
  };

  const deleteUser = async (id) => {
    if (!isAdmin()) return false;
    try {
      await axios.delete(`${API_BASE_URL}/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      return true;
    } catch (error) {
      console.error('Ошибка:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      loadDevices();
      loadUsers();
    }
  }, [user]);

  return (
    <Routes>
      {/* Публичные маршруты (без навигации) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/incidents" element={<Incidents />} />
      
      {/* Защищенные маршруты (с навигацией) */}
      <Route path="/" element={
        <AuthenticatedLayout>
          <Devices 
            devices={devices} 
            loading={loading}
            onDelete={deleteDevice}
            isAdmin={isAdmin()}
          />
        </AuthenticatedLayout>
      } />
      
      <Route path="/users" element={
        <AuthenticatedLayout>
          <Users 
            users={users}
            loading={loading}
            onDelete={deleteUser}
            isAdmin={isAdmin()}
          />
        </AuthenticatedLayout>
      } />
      
      <Route path="/device/:id" element={
        <AuthenticatedLayout>
          <DeviceDetail 
            devices={devices}
            onUpdate={updateDevice}
            onDelete={deleteDevice}
            isAdmin={isAdmin()}
          />
        </AuthenticatedLayout>
      } />
      
      <Route path="/user/:id" element={
        <AuthenticatedLayout>
          <UserDetail 
            users={users}
            isAdmin={isAdmin()}
          />
        </AuthenticatedLayout>
      } />
      
      <Route path="/add-device" element={
        <AdminRoute>
          <AuthenticatedLayout>
            <DeviceForm 
              onAdd={addDevice}
              devices={devices}
              isAdmin={isAdmin()}
            />
          </AuthenticatedLayout>
        </AdminRoute>
      } />
      
      <Route path="/admin" element={
        <AdminRoute>
          <AuthenticatedLayout>
            <AdminPanel />
          </AuthenticatedLayout>
        </AdminRoute>
      } />
      
      <Route path="/profile" element={
        <AuthenticatedLayout>
          <Profile />
        </AuthenticatedLayout>
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
