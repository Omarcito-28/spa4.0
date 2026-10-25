import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/auth';

function CurrentPath() {
  const location = useLocation();
  return <p data-testid="current-path">{location.pathname}{location.search}</p>;
}

// Renderiza una página con un AuthContext simulado y un router en memoria
// que muestra la ruta actual, para comprobar las redirecciones.
export function renderWithAuth(ui, { auth = {}, route = '/', path = '*' } = {}) {
  const value = {
    user: null,
    isAuthenticated: false,
    loading: false,
    login: async () => ({ success: false }),
    register: async () => ({ success: false }),
    logout: () => {},
    updateProfile: async () => ({ success: false }),
    ...auth,
  };
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={null} />
        </Routes>
        <CurrentPath />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}
