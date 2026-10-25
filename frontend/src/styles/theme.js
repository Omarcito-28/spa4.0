import { createGlobalStyle, keyframes } from 'styled-components';

export const theme = {
  colors: {
    primary: '#996515',       // Marrón dorado (Encabezados)
    primaryLight: '#b8891f',  // Dorado más claro
    primaryDark: '#7a500f',   // Dorado más oscuro
    secondary: '#FFB6C1',     // Rosa Pálido (Fondo Principal)
    accent: '#c9942a',        // Dorado cálido (Acentos/Botones)
    text: '#1a1a2e',          // Casi negro azulado (Texto Principal)
    textLight: '#010101ff',     // Gris muy oscuro (Texto Secundario)
    textMuted: '#0d0d0eff',     // Gris oscuro sólido (Texto terciario)
    contentBgLight: '#FFFDF8', // Crema muy suave para contenido
    contentBgWarm: '#FFF9F0',  // Crema cálido
    navbarBg: '#0a0a0a',      // Negro profundo (Navbar)
    navbarText: '#c9942a',     // Dorado para texto en Navbar
    navbarLinkHover: '#FFD700', // Dorado brillante para hover
    footerBg: '#0a0a0a',      // Negro profundo (Footer)
    footerText: '#c9942a',     // Dorado para texto de footer
    danger: '#e74c3c',
    success: '#27ae60',
    cardBg: '#ffffff',
    overlay: 'rgba(10, 10, 10, 0.55)',
  },
  fonts: {
    primary: "'Cormorant Garamond', Georgia, serif",
    secondary: "'Cormorant Garamond', Georgia, serif",
  },
  spacing: {
    xs: '0.25rem',
    small: '0.5rem',
    medium: '1rem',
    large: '2rem',
    xl: '3rem',
    xxl: '4rem',
  },
  borderRadius: {
    small: '8px',
    medium: '16px',
    large: '24px',
    xl: '32px',
    pill: '50px',
  },
  shadows: {
    small: '0 2px 8px rgba(0, 0, 0, 0.08)',
    medium: '0 4px 20px rgba(0, 0, 0, 0.1)',
    large: '0 12px 40px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 60px rgba(0, 0, 0, 0.2)',
    glow: '0 0 20px rgba(153, 101, 21, 0.3)',
    cardHover: '0 12px 35px rgba(153, 101, 21, 0.15)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  transitions: {
    fast: '0.15s ease',
    normal: '0.3s ease',
    slow: '0.5s ease',
    bounce: '0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const slideInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  body {
    font-family: ${theme.fonts.secondary};
    font-size: 1.35rem;
    background-color: #FAF7F2;
    color: ${theme.colors.text};
    line-height: 1.65;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1 { font-size: 3.5rem; }
  h2 { font-size: 2.8rem; }
  h3 { font-size: 2.2rem; }
  h4 { font-size: 1.8rem; }
  h5 { font-size: 1.5rem; }
  h6 { font-size: 1.35rem; }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.fonts.primary};
    color: ${theme.colors.primary};
    margin-bottom: 0.85rem;
    line-height: 1.25;
  }

  a {
    color: ${theme.colors.accent};
    text-decoration: none;
    transition: color ${theme.transitions.normal};
  }

  a:hover {
    color: ${theme.colors.primaryLight};
    text-decoration: none;
  }

  button {
    cursor: pointer;
    font-family: ${theme.fonts.secondary};
  }

  input, select, textarea {
    font-family: ${theme.fonts.secondary};
  }

  ::selection {
    background: rgba(153, 101, 21, 0.2);
    color: ${theme.colors.text};
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.primary};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.primaryDark};
  }
`;
