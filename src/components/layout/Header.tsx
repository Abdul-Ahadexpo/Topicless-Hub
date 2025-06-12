import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, User, Home, MessageSquare, BarChart, LightbulbIcon, Scale, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Question Storm', path: '/questions', icon: <MessageSquare size={18} /> },
    { name: 'Poll War', path: '/polls', icon: <BarChart size={18} /> },
    { name: 'Idea Drop', path: '/ideas', icon: <LightbulbIcon size={18} /> },
    { name: 'Would You Rather', path: '/wyr', icon: <Scale size={18} /> },
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
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-primary-600 font-bold text-xl">Topicless Hub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium rounded-md flex items-center space-x-2 transition-colors ${
                  location.pathname === item.path
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            
            {/* Admin Button */}
            {!isAdmin ? (
              <button
                onClick={() => setShowAdminLogin(true)}
                className="btn btn-outline flex items-center space-x-2 text-sm"
              >
                <Shield size={16} />
                <span>Admin</span>
              </button>
            ) : (
              <Link to="/admin" className="btn btn-accent flex items-center space-x-2 text-sm">
                <Shield size={16} />
                <span>Admin Panel</span>
              </Link>
            )}
            
            {currentUser ? (
              <div className="flex items-center space-x-4">
                <Link to="/account" className="btn btn-outline flex items-center space-x-2">
                  <User size={18} />
                  <span>My Account</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-outline flex items-center space-x-2">
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary flex items-center space-x-2">
                <LogIn size={18} />
                <span>Sign In</span>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2 ${
                  location.pathname === item.path
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            
            {/* Mobile Admin Button */}
            {!isAdmin ? (
              <button
                onClick={() => {
                  setShowAdminLogin(true);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Shield size={18} />
                <span>Admin</span>
              </button>
            ) : (
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-md text-base font-medium text-accent-600 hover:text-accent-700 hover:bg-accent-50 flex items-center space-x-2"
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
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={18} />
                  <span>My Account</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Admin Login</h2>
              <button
                onClick={() => setShowAdminLogin(false)}
                className="text-gray-500 hover:text-gray-700"
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