'use client';

import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Carregando...' }: LoadingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
        
        {/* Mensagem */}
        <p className="text-lg text-gray-700">{message}</p>
      </div>
    </div>
  );
} 