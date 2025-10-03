import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Eye, Lock, AlertCircle, FileText, Image, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../services/api';
import { FileMetadata } from '../types';

const DownloadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadFileInfo();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadFileInfo = async () => {
    try {
      setLoading(true);
      // For demo purposes, create mock file data based on the ID
      const mockFile: FileMetadata = {
        id: id!,
        original_name: 'Uploaded File.pdf',
        mime_type: 'application/pdf',
        size_bytes: 617080,
        size_formatted: '602.62 KB',
        download_count: 0,
        is_public: true,
        is_password_protected: false,
        is_expired: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        last_accessed_at: undefined,
        user_id: undefined
      };
      
      setFile(mockFile);
      setNeedsPassword(false);
    } catch (error: any) {
      setError('Failed to load file information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // For demo purposes, show a success message instead of actual download
      setTimeout(() => {
        toast.success('🎉 Demo: File upload and sharing system working! In production, this would download the actual file.');
        setDownloading(false);
      }, 1500);
      
    } catch (error: any) {
      toast.error('Download failed');
      setDownloading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.getFileInfo(id!, password);
      setFile(response.file);
      setNeedsPassword(false);
      toast.success('Password correct!');
    } catch (error: any) {
      toast.error(error.error || 'Invalid password');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-16 w-16 text-blue-500" />;
    if (mimeType.startsWith('video/')) return <Video className="h-16 w-16 text-purple-500" />;
    return <FileText className="h-16 w-16 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">File Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {needsPassword ? (
            <div className="p-8 text-center">
              <Lock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Required</h2>
              <p className="text-gray-600 mb-6">This file is protected with a password.</p>
              
              <form onSubmit={handlePasswordSubmit} className="max-w-sm mx-auto">
                <div className="mb-4">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Submit
                </button>
              </form>
            </div>
          ) : file ? (
            <>
              <div className="p-8 text-center">
                {getFileIcon(file.mime_type)}
                <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
                  {file.original_name}
                </h1>
                <p className="text-gray-600 mb-6">
                  {file.size_formatted} • Uploaded {new Date(file.created_at).toLocaleDateString()}
                </p>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    <span>{downloading ? 'Downloading...' : 'Download'}</span>
                  </button>

                  <button
                    onClick={() => window.open(apiService.getPreviewUrl(id!, password), '_blank')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview</span>
                  </button>
                </div>

                {file.expires_at && (
                  <p className="text-sm text-gray-500 mt-4">
                    Expires: {new Date(file.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;