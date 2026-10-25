import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import Navbar from './Navbar';
import Footer from './Footer';
import { GlobalStyle } from '../styles/theme';
import ChatAssistant from './ChatAssistant';

const MainContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Content = styled.main`
  flex: 1;
  width: 100%;
`;

function Layout({ isAuthenticated = false, user = null, onLogout }) {
  return (
    <>
      <GlobalStyle />
      <MainContainer>
        <Navbar isAuthenticated={isAuthenticated} user={user} onLogout={onLogout} />
        <Content>
          <Outlet />
        </Content>
        <Footer />
        <ChatAssistant />
      </MainContainer>
    </>
  );
}

export default Layout;
