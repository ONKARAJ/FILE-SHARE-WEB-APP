import React, { useState } from 'react';
import { Link2, Shield, Clock, CheckCircle, Copy, Eye, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import DragDropZone from '../components/Upload/DragDropZone';
import apiService from '../services/api';
import { FileUploadState, UploadResponse } from '../types';

const HomePage: React.FC = () => {
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    const newUploadStates: FileUploadState[] = files.map((file) => ({
      file,
      progress: { loaded: 0, total: file.size, percentage: 0 },
      status: 'pending',
    }));

    setUploadStates(newUploadStates);
    setIsUploading(true);

    // Upload files one by one
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Update status to uploading
        setUploadStates((prev) =>
          prev.map((state, index) =>
            index === i ? { ...state, status: 'uploading' } : state
          )
        );

        const response: UploadResponse = await apiService.uploadFile(
          file,
          {},
          (percentage) => {
            setUploadStates((prev) =>
              prev.map((state, index) =>
                index === i
                  ? {
                      ...state,
                      progress: {
                        loaded: (percentage / 100) * file.size,
                        total: file.size,
                        percentage,
                      },
                    }
                  : state
              )
            );
          }
        );

        // Update to completed with result
        setUploadStates((prev) =>
          prev.map((state, index) =>
            index === i
              ? {
                  ...state,
                  status: 'completed',
                  result: {
                    file: response.file,
                    shareable_link: response.shareable_link,
                    can_preview: response.can_preview,
                  },
                }
              : state
          )
        );

        toast.success(`${file.name} uploaded successfully!`);
      } catch (error: any) {
        // Update to error
        setUploadStates((prev) =>
          prev.map((state, index) =>
            index === i
              ? {
                  ...state,
                  status: 'error',
                  error: error.error || 'Upload failed',
                }
              : state
          )
        );

        toast.error(`Failed to upload ${file.name}: ${error.error || 'Unknown error'}`);
      }
    }

    setIsUploading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearCompleted = () => {
    setUploadStates([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-200/20 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-pink-200/20 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Animated Hero Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl mb-6 animate-pulse-glow">
              <Upload className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent animate-gradient">Share Files</span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">Instantly ⚡</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Upload your files and get a <span className="font-semibold text-blue-600">shareable link</span> in seconds. 
            <br className="hidden md:block" />
            Secure, fast, and <span className="font-semibold text-purple-600">no registration required</span>. ✨
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>Auto Expiry</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
              <Link2 className="w-4 h-4 text-blue-500" />
              <span>Instant Links</span>
            </div>
          </div>
        </div>

        {/* Animated Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="group bg-gradient-to-br from-white/80 to-blue-50/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 w-fit mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">Secure & Private</h3>
            <p className="text-gray-600 leading-relaxed">
              Your files are encrypted and stored securely. Links expire automatically for maximum privacy protection. 🔒
            </p>
          </div>
          <div className="group bg-gradient-to-br from-white/80 to-green-50/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 w-fit mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
              <Link2 className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">Easy Sharing</h3>
            <p className="text-gray-600 leading-relaxed">
              Get a shareable link instantly. Share with anyone, anywhere in the world with just one click. 🌍
            </p>
          </div>
          <div className="group bg-gradient-to-br from-white/80 to-orange-50/60 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/30 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-4 w-fit mb-6 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">Auto Expiry</h3>
            <p className="text-gray-600 leading-relaxed">
              Links expire after 7 days by default. Your privacy is protected with automatic cleanup. ⏰
            </p>
          </div>
        </div>

        {/* Modern Upload Section */}
        <div className="bg-gradient-to-r from-white/90 to-blue-50/70 backdrop-blur-2xl rounded-3xl shadow-3xl p-10 mb-12 border border-white/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">Upload Your Files</h2>
              <p className="text-gray-600">Drag & drop files or click to browse • Max 5 files • 10 MB per file</p>
            </div>
            <div className="relative">
              <DragDropZone 
                onFilesSelected={handleFilesSelected}
                maxFiles={5}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="flex items-center space-x-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
                    <div>
                      <p className="text-blue-600 font-semibold">Processing your files...</p>
                      <p className="text-sm text-gray-500">Please wait while we upload your files securely</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Results */}
        {uploadStates.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Upload Status</h3>
              {uploadStates.some(state => state.status === 'completed') && (
                <button
                  onClick={clearCompleted}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-4">
              {uploadStates.map((uploadState, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`h-3 w-3 rounded-full ${
                        uploadState.status === 'completed' ? 'bg-green-500' :
                        uploadState.status === 'error' ? 'bg-red-500' :
                        uploadState.status === 'uploading' ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-300'
                      }`} />
                      <span className="font-medium text-gray-900">
                        {uploadState.file.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({formatFileSize(uploadState.file.size)})
                      </span>
                    </div>
                    
                    {uploadState.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>

                  {/* Progress Bar */}
                  {(uploadState.status === 'uploading' || uploadState.status === 'pending') && (
                    <div className="mb-3">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadState.progress.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadState.progress.percentage}% uploaded
                      </p>
                    </div>
                  )}

                  {/* Error Message */}
                  {uploadState.status === 'error' && (
                    <div className="text-red-600 text-sm mb-3">
                      Error: {uploadState.error}
                    </div>
                  )}

                  {/* Success Result */}
                  {uploadState.status === 'completed' && uploadState.result && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-800">
                          Share Link:
                        </span>
                        <div className="flex space-x-2">
                          {uploadState.result.can_preview && (
                            <button
                              onClick={() => window.open(uploadState.result!.shareable_link, '_blank')}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(uploadState.result!.shareable_link)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Copy Link"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded border text-xs text-gray-700 break-all">
                        {uploadState.result.shareable_link}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;