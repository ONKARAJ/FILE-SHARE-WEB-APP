import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Mail, Shield } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">FileShare</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              A secure and simple file sharing platform. Upload your files, 
              generate shareable links, and share them with anyone, anywhere.
              All files are encrypted and can be set to expire automatically.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-md font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Upload Files
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link 
                  to="/login" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link 
                  to="/register" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-md font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Secure Upload</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Link Expiration</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Password Protection</span>
              </li>
              <li className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>File Preview</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} FileShare. Built with React & Node.js.
            </p>
            
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:support@fileshare.com"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;