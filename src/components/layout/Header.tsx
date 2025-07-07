import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, Home, MessageSquare, BarChart, LightbulbIcon, Scale, Shield, BookOpen, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Question Storm', path: '/questions', icon: <MessageSquare size={18} /> },
    { name: 'Poll War', path: '/polls', icon: <BarChart size={18} /> },
    { name: 'Idea Drop', path: '/ideas', icon: <LightbulbIcon size={18} /> },
    { name: 'Would You Rather', path: '/wyr', icon: <Scale size={18} /> },
    { name: 'Blog', path: '/blog', icon: <BookOpen size={18} /> },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      setIsAdmin(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Niharuka2918') {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      alert('Incorrect admin password');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold text-xl">Topicless Hub</span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on all screen sizes, using hamburger for all */}
          <div className="hidden items-center space-x-4">
            {/* This section is now hidden to force hamburger menu on all devices */}
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Hamburger menu button - now shown on all screen sizes */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Universal menu */}
      {isMenuOpen && (
        <div className="bg-white dark:bg-gray-900 shadow-lg animate-fade-in border-t dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 max-h-[80vh] overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-3 py-3 rounded-md text-base font-medium flex items-center space-x-3 transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="border-t dark:border-gray-700 pt-2 mt-2">
              {/* Admin Button */}
              {!isAdmin ? (
                <button
                  onClick={() => {
                    setShowAdminLogin(true);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors"
                >
                  <Shield size={18} />
                  <span>Admin</span>
                </button>
              ) : (
                <Link
                  to="/admin"
                  className="block px-3 py-3 rounded-md text-base font-medium text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-900/20 flex items-center space-x-3 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </Link>
              )}
              
              {currentUser ? (
                <>
                  <Link
                    to="/account"
                    className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} />
                    <span>My Account</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-3 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-3 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-3 rounded-md text-base font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center space-x-3 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn size={18} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Admin Login</h2>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdminLogin}>
              <div className="mb-4">
                <label htmlFor="adminPassword" className="label">
                  Admin Password
                </label>
                <input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="input"
                  placeholder="Enter admin password"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;