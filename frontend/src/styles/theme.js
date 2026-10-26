import { createGlobalStyle, keyframes } from 'styled-components';

export const theme = {
  colors: {
    primary: '#996515',       // Marrón dorado (Encabezados)
    primaryLight: '#b8891f',  // Dorado más claro
    primaryDark: '#7a500f',   // Dorado más oscuro
    secondary: '#FFB6C1',     // Rosa Pálido (Fondo Principal)
    accent: '#c9942a',        // Dorado cálido (Acentos/Botones)
    text: '#1a1a2e',          // Casi negro azulado (Texto Principal)
    textLight: '#3a3542',     // Gris carbón (Texto Secundario)
    textMuted: '#4f4957',     // Gris cálido (Texto terciario, contraste > 7:1 sobre blanco y crema)
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
    // Serif decorativa solo para títulos; el texto corrido usa una sans más legible.
    primary: "'Cormorant Garamond', Georgia, serif",
    secondary: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif",
    // Los font-size del proyecto se calibraron para Cormorant (letra x pequeña).
    // Este ajuste fija la altura de la x de la sans para que el tamaño visual no se dispare.
    secondaryAdjust: '0.46',
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
    font-size-adjust: ${theme.fonts.secondaryAdjust};
    font-size: 1.35rem;
    background-color: #FAF7F2;
    background-image:
      radial-gradient(circle at 0% 0%, rgba(255, 182, 193, 0.18), transparent 38%),
      radial-gradient(circle at 100% 30%, rgba(201, 148, 42, 0.1), transparent 34%),
      radial-gradient(circle at 10% 90%, rgba(201, 148, 42, 0.08), transparent 30%);
    background-attachment: fixed;
    color: ${theme.colors.text};
    line-height: 1.65;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  p, li, td, label {
    overflow-wrap: break-word;
  }

  h1 { font-size: 3.5rem; }
  h2 { font-size: 2.8rem; }
  h3 { font-size: 2.2rem; }
  h4 { font-size: 1.8rem; }
  h5 { font-size: 1.5rem; }
  h6 { font-size: 1.35rem; }

  h1, h2, h3, h4, h5, h6 {
    font-family: ${theme.fonts.primary};
    font-size-adjust: none;
    /* Cormorant usa números de estilo antiguo: el 0 se confunde con la letra O. */
    font-variant-numeric: lining-nums;
    font-weight: 700;
    color: ${theme.colors.primary};
    margin-bottom: 0.85rem;
    line-height: 1.2;
    letter-spacing: 0.2px;
  }

  a {
    color: ${theme.colors.primaryDark};   /* #7a500f: 6.6:1 sobre crema (el dorado #c9942a daba 2.5:1) */
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration: none;
    transition: color ${theme.transitions.normal};
  }

  a:hover {
    color: ${theme.colors.primary};
    text-decoration: underline;
  }

  button {
    cursor: pointer;
    font-family: ${theme.fonts.secondary};
    font-size-adjust: ${theme.fonts.secondaryAdjust};
  }

  input, select, textarea {
    font-family: ${theme.fonts.secondary};
    font-size-adjust: ${theme.fonts.secondaryAdjust};
  }

  ::placeholder {
    color: #8a8392;
    opacity: 1;
  }

  a:focus-visible,
  button:focus-visible,
  [tabindex]:focus-visible {
    outline: 3px solid rgba(201, 148, 42, 0.55);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
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
