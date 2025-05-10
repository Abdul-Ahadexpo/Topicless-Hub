import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              © {currentYear} Topicless Hub. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              Terms
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-gray-600 hover:text-primary-600 transition-colors">
              Help
            </a>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center">
            <span className="text-gray-600 text-sm flex items-center">
              Made with REACT.js By Nazuu~ in 2025
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;