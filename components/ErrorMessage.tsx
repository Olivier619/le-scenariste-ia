
import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-center space-x-3">
      <i className="fas fa-exclamation-triangle"></i>
      <div>
        <h4 className="font-bold">Erreur</h4>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
