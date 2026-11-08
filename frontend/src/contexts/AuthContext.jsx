import { useState, useEffect } from 'react';
import { apiGoogleLogin, apiLogin, apiRegister, apiGetProfile, apiUpdateProfile, onSessionExpired, SESSION_INVALID } from '../services/api';
import { AuthContext } from './auth';

const clearStoredSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));
  // Motivo por el que se cerró la sesión sin que el usuario lo pidiera; lo muestra la página de login.
  const [sessionNotice, setSessionNotice] = useState('');

  // Si la API rechaza el token en cualquier petición, se cierra la sesión y las
  // rutas protegidas redirigen al login.
  useEffect(() => onSessionExpired(message => {
    clearStoredSession();
    setUser(null);
    setIsAuthenticated(false);
    setSessionNotice(message);
  }), []);

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
        .catch(error => {
          if (!active) return;
          if (error.code === SESSION_INVALID) {
            clearStoredSession();
            return;
          }
          // Un fallo de red o del servidor no invalida la sesión: se usa el
          // usuario guardado y la próxima petición confirmará el token.
          const storedUser = readStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }
  }, []);

  // Guarda la sesión que devuelve la API (login, registro o Google).
  const startSession = data => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setIsAuthenticated(true);
    setSessionNotice('');
  };

  // Login contra la API real
  const login = async (username, password) => {
    try {
      const data = await apiLogin(username, password);
      startSession(data);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message || 'Credenciales inválidas' };
    }
  };

  // Inicia sesión o crea la cuenta con el token de identidad que entregó Google.
  const loginWithGoogle = async credential => {
    try {
      const data = await apiGoogleLogin(credential);
      startSession(data);
      return { success: true, user: data.user, isNewUser: Boolean(data.isNewUser) };
    } catch (error) {
      return { success: false, error: error.message || 'No se pudo iniciar sesión con Google.' };
    }
  };

  // Registro contra la API real
  const register = async (userData) => {
    try {
      const data = await apiRegister(userData);
      // Auto-login tras registro
      startSession(data);
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
    // Que Google no vuelva a elegir la cuenta sola en el próximo inicio de sesión.
    window.google?.accounts?.id?.disableAutoSelect?.();
    setUser(null);
    setIsAuthenticated(false);
    setSessionNotice('');
    clearStoredSession();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, loginWithGoogle, logout, register, updateProfile, loading, sessionNotice }}>
      {children}
    </AuthContext.Provider>
  );
}
