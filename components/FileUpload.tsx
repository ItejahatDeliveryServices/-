import React, { useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        onFileSelect(file);
      } else {
        alert("Please upload a valid .docx Word file.");
      }
    }
  }, [onFileSelect, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200
        ${disabled ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed' : 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-500 cursor-pointer'}
      `}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept=".docx" 
        className="hidden" 
        id="file-upload" 
        onChange={handleChange}
        disabled={disabled}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Manuscript</h3>
        <p className="text-sm text-gray-500 mb-4">Drag & drop your .docx file here</p>
        <span className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          Browse Files
        </span>
      </label>
    </div>
  );
};