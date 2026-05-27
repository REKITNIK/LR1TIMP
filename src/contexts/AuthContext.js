import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Регистрация (требует подтверждения)
  const register = async (userData) => {
    try {
      setError(null);
      
      // Проверка существующего email в users
      const existingUsers = await axios.get('http://localhost:5000/users');
      const userExists = existingUsers.data.find(u => u.email === userData.email);
      
      // Проверка в ожидающих
      const pendingUsers = await axios.get('http://localhost:5000/pendingUsers');
      const pendingExists = pendingUsers.data.find(u => u.email === userData.email);
      
      if (userExists || pendingExists) {
        throw new Error('Пользователь с таким email уже существует');
      }
      
      // Создание заявки на регистрацию
      const newPendingUser = {
        ...userData,
        role: 'employee',
        isApproved: false,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      await axios.post('http://localhost:5000/pendingUsers', newPendingUser);
      
      return { 
        success: true, 
        message: 'Регистрация отправлена на подтверждение администратору' 
      };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Вход в систему (только для подтвержденных)
  const login = async (email, password) => {
    try {
      setError(null);
      
      const response = await axios.get('http://localhost:5000/users');
      const users = response.data;
      
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error('Неверный email или пароль');
      }
      
      if (!foundUser.isApproved) {
        throw new Error('Ваша учетная запись еще не подтверждена администратором');
      }
      
      const { password: _, ...userWithoutPassword } = foundUser;
      const token = btoa(`${foundUser.id}:${Date.now()}`);
      
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('token', token);
      setUser(userWithoutPassword);
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAdmin,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
