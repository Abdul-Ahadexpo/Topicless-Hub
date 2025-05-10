import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, BarChart, LightbulbIcon, Scale } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();

  const features = [
    {
      name: 'Question Storm',
      description: 'Ask questions and share answers in real-time with our community.',
      icon: <MessageSquare className="h-6 w-6 text-primary-600" />,
      path: '/questions',
      color: 'bg-primary-50',
      borderColor: 'border-primary-200',
    },
    {
      name: 'Poll War',
      description: 'Create polls and see results update instantly. Add GIFs for extra fun!',
      icon: <BarChart className="h-6 w-6 text-secondary-600" />,
      path: '/polls',
      color: 'bg-secondary-50',
      borderColor: 'border-secondary-200',
    },
    {
      name: 'Daily Idea Drop',
      description: 'Share one creative idea daily and get reactions from others.',
      icon: <LightbulbIcon className="h-6 w-6 text-accent-600" />,
      path: '/ideas',
      color: 'bg-accent-50',
      borderColor: 'border-accent-200',
    },
    {
      name: 'Would You Rather',
      description: 'Create impossible choices and see how others would decide.',
      icon: <Scale className="h-6 w-6 text-primary-600" />,
      path: '/wyr',
      color: 'bg-primary-50',
      borderColor: 'border-primary-200',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 md:p-12 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Topicless Hub: Share, Vote & Connect
          </h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            A real-time platform for questions, polls, ideas, and impossible choices.
          </p>
          {currentUser ? (
            <Link
              to="/account"
              className="btn bg-white text-primary-700 hover:bg-gray-100 px-6 py-3 text-lg"
            >
              My Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="btn bg-white text-primary-700 hover:bg-gray-100 px-6 py-3 text-lg"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Our Interactive Features
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our diverse range of tools designed for real-time interaction and engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.name}
              to={feature.path}
              className={`p-6 rounded-lg border ${feature.borderColor} ${feature.color} hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start">
                <div className="bg-white p-3 rounded-lg mr-4">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{feature.name}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Join the Conversation?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Sign up now to start asking questions, creating polls, sharing ideas, and engaging with our community.
        </p>
        {currentUser ? (
          <Link to="/questions" className="btn btn-primary px-6 py-3">
            Start Exploring
          </Link>
        ) : (
          <Link to="/login" className="btn btn-primary px-6 py-3">
            Sign Up Now
          </Link>
        )}
      </section>
    </div>
  );
};

export default HomePage;