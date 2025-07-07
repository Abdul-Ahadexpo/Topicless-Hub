import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AccountPage from './pages/account/AccountPage';
import QuestionStormPage from './pages/questions/QuestionStormPage';
import PollWarPage from './pages/polls/PollWarPage';
import IdeaDropPage from './pages/ideas/IdeaDropPage';
import WouldYouRatherPage from './pages/wyr/WouldYouRatherPage';
import AdminPage from './pages/admin/AdminPage';
import BlogPage from './pages/blog/BlogPage';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/questions" element={<QuestionStormPage />} />
              <Route path="/polls" element={<PollWarPage />} />
              <Route path="/ideas" element={<IdeaDropPage />} />
              <Route path="/wyr" element={<WouldYouRatherPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/blog" element={<BlogPage />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;