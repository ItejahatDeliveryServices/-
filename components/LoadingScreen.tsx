import React from 'react';
import { ProcessingStep } from '../types';

interface LoadingScreenProps {
  steps: ProcessingStep[];
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ steps }) => {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-900">Refining Your Masterpiece</h2>
        <p className="text-sm text-gray-500 mt-2">Our AI editor is reading, organizing, and polishing your book.</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-500
              ${step.status === 'completed' ? 'bg-green-100 text-green-600' : 
                step.status === 'processing' ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 
                'bg-gray-100 text-gray-400'}
            `}>
              {step.status === 'completed' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              step.status === 'pending' ? 'text-gray-400' : 'text-gray-700'
            }`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};