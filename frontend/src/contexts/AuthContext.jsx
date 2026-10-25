import { useState, useEffect } from 'react';
import { apiLogin, apiRegister, apiGetProfile, apiUpdateProfile } from '../services/api';
import { AuthContext } from './auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

  // Al montar la app, si hay token guardado recuperamos el perfil
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      let active = true;
      apiGetProfile()
        .then((userData) => {
          if (!active) return;
          setUser(userData);
          setIsAuthenticated(true);
        })
        .catch(() => {
          if (!active) return;
          // Token inválido o expirado — limpiamos
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }
  }, []);

  // Login contra la API real
  const login = async (username, password) => {
    try {
      const data = await apiLogin(username, password);
      // Guardar token y usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message || 'Credenciales inválidas' };
    }
  };

  // Registro contra la API real
  const register = async (userData) => {
    try {
      const data = await apiRegister(userData);
      // Auto-login tras registro
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message || 'Error al registrar usuario' };
    }
  };

  const updateProfile = async userData => {
    try {
      const data = await apiUpdateProfile(userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message || 'No se pudo actualizar el perfil.' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, register, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
