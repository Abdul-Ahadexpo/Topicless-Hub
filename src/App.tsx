import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AccountPage from './pages/account/AccountPage';
import QuestionStormPage from './pages/questions/QuestionStormPage';
import PollWarPage from './pages/polls/PollWarPage';
import IdeaDropPage from './pages/ideas/IdeaDropPage';
import WouldYouRatherPage from './pages/wyr/WouldYouRatherPage';

function App() {
  return (
    <Router>
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
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;