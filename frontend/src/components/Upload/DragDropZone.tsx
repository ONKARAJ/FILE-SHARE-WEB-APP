import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { DragDropZoneProps } from '../../types';

const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFilesSelected,
  accept,
  maxFiles = 10,
  maxSize = 100 * 1024 * 1024, // 100MB
  disabled = false,
  children,
}) => {
  const [rejectedFiles, setRejectedFiles] = useState<any[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      if (fileRejections.length > 0) {
        setRejectedFiles(fileRejections);
      } else {
        setRejectedFiles([]);
      }
      
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxFiles,
    maxSize,
    disabled,
    multiple: maxFiles > 1,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearRejectedFiles = () => {
    setRejectedFiles([]);
  };

  if (children) {
    return (
      <div {...getRootProps()} className="w-full">
        <input {...getInputProps()} />
        {children}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive && !isDragReject
            ? 'border-blue-400 bg-blue-50'
            : isDragReject
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <Upload className={`h-12 w-12 ${
            isDragActive && !isDragReject
              ? 'text-blue-500'
              : isDragReject
              ? 'text-red-500'
              : 'text-gray-400'
          }`} />
          
          {isDragActive ? (
            isDragReject ? (
              <p className="text-red-600 font-medium">
                Some files are not supported
              </p>
            ) : (
              <p className="text-blue-600 font-medium">
                Drop your files here...
              </p>
            )
          ) : (
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                Upload your files
              </p>
              <p className="text-sm text-gray-500">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-gray-400">
                Max {maxFiles} file{maxFiles > 1 ? 's' : ''} • {formatFileSize(maxSize)} per file
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Rejected Files */}
      {rejectedFiles.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h4 className="text-sm font-medium text-red-800">
                Some files couldn't be uploaded
              </h4>
            </div>
            <button
              onClick={clearRejectedFiles}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            {rejectedFiles.map(({ file, errors }, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-700">{file.name}</span>
                </div>
                <ul className="ml-6 mt-1 space-y-1">
                  {errors.map((error: any, errorIndex: number) => (
                    <li key={errorIndex} className="text-red-600">
                      • {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropZone;