import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, Download, Link2, LogOut, User as UserIcon, CheckCircle, Copy, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import DragDropZone from '../components/Upload/DragDropZone';
import apiService from '../services/api';
import { FileUploadState, UploadResponse } from '../types';

const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [allUploadedFiles, setAllUploadedFiles] = useState<FileUploadState[]>([]);

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

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
        
        // Add to persistent uploaded files list
        const completedUpload = {
          file,
          progress: { loaded: file.size, total: file.size, percentage: 100 },
          status: 'completed' as const,
          result: {
            file: response.file,
            shareable_link: response.shareable_link,
            can_preview: response.can_preview,
          },
        };
        setAllUploadedFiles(prev => [...prev, completedUpload]);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Animated Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Online</span>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <p className="text-lg text-gray-700">
              Welcome back, <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.firstName || 'User'}</span>! ✨
            </p>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></div>
              {user?.emailAddresses[0]?.emailAddress}
            </p>
            {user?.createdAt && (
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2"></div>
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-2xl shadow-xl p-6 mb-8 border border-white/20 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 mr-6 shadow-lg">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {user?.firstName} {user?.lastName || ''}
                </h3>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <div className="h-1.5 w-1.5 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
                {user?.createdAt && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <div className="h-1 w-1 bg-gray-400 rounded-full mr-2"></div>
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <LogOut className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Animated Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-lg p-6 border border-blue-200/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">Total Files</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                  {allUploadedFiles.length}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transform transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allUploadedFiles.length / 10) * 100)}%`}}></div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl shadow-lg p-6 border border-green-200/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 group-hover:text-green-700 transition-colors">Uploads</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                  {allUploadedFiles.length}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-green-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transform transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allUploadedFiles.length / 10) * 100)}%`}}></div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl shadow-lg p-6 border border-purple-200/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl p-3 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
                <Download className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors">Downloads</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                  {allUploadedFiles.reduce((total, state) => {
                    return total + (state.result?.file.download_count || 0);
                  }, 0)}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-purple-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-violet-600 rounded-full transform transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allUploadedFiles.reduce((total, state) => total + (state.result?.file.download_count || 0), 0) / 50) * 100)}%`}}></div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl shadow-lg p-6 border border-orange-200/20 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-3 group-hover:rotate-12 transition-transform duration-500 shadow-lg">
                <Link2 className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 group-hover:text-orange-700 transition-colors">Active Links</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                  {allUploadedFiles.filter(state => 
                    state.result && 
                    !state.result.file.is_expired
                  ).length}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 bg-orange-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-600 rounded-full transform transition-all duration-1000 ease-out" style={{width: `${Math.min(100, (allUploadedFiles.filter(state => state.result && !state.result.file.is_expired).length / 10) * 100)}%`}}></div>
            </div>
          </div>
        </div>

        {/* Animated Upload Section */}
        <div className="bg-gradient-to-r from-white/80 to-blue-50/60 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/30 hover:shadow-3xl transition-all duration-700">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-3 mr-4 shadow-lg">
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">Upload Files</h2>
              <p className="text-sm text-gray-600">Drag & drop your files or click to browse</p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl">
            <DragDropZone 
              onFilesSelected={handleFilesSelected}
              maxFiles={5}
              disabled={isUploading}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                  <span className="text-blue-600 font-medium">Processing uploads...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Results */}
        {uploadStates.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
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

        {/* Recent Files */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Files</h2>
          </div>
          <div className="p-6">
            {allUploadedFiles.length > 0 ? (
              <div className="space-y-3">
                {allUploadedFiles.slice(-5).reverse().map((uploadState, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{uploadState.file.name}</p>
                        <p className="text-sm text-gray-500">{formatFileSize(uploadState.file.size)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {uploadState.result?.can_preview && (
                        <button
                          onClick={() => window.open(uploadState.result!.shareable_link, '_blank')}
                          className="p-2 text-gray-600 hover:text-blue-600"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(uploadState.result!.shareable_link)}
                        className="p-2 text-gray-600 hover:text-blue-600"
                        title="Copy Link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by uploading your first file above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;