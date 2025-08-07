import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">OpticApp</h2>
        <p className="text-gray-500">Cargando...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 