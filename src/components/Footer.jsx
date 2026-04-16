import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-2 fixed bottom-0 left-0 right-0 z-20 h-10 sm:h-12 shadow-sm">
      <div className="container mx-auto px-3 sm:px-4 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs font-medium tracking-wide text-gray-600">
            Developed By <span className="text-blue-700">Deepak Sahu</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
