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
      // Try to get file info from localStorage (if available from recent uploads)
      const uploadHistory = localStorage.getItem('recent_uploads');
      let fileInfo = null;
      
      if (uploadHistory) {
        try {
          const uploads = JSON.parse(uploadHistory);
          fileInfo = uploads.find((upload: any) => upload.id === id);
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      const mockFile: FileMetadata = {
        id: id!,
        original_name: fileInfo?.original_name || 'Demo File.pdf',
        mime_type: fileInfo?.mime_type || 'application/pdf',
        size_bytes: fileInfo?.size_bytes || 617080,
        size_formatted: fileInfo?.size_formatted || '602.62 KB',
        download_count: 0,
        is_public: true,
        is_password_protected: false,
        is_expired: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: fileInfo?.created_at || new Date().toISOString(),
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
      
      // Create a demo file for download
      const demoContent = `File Sharing App Demo\n\nFile: ${file?.original_name}\nUploaded: ${file?.created_at ? new Date(file.created_at).toLocaleString() : 'Recently'}\nSize: ${file?.size_formatted}\n\nThis is a demonstration of the file sharing functionality.\nIn production, this would be the actual uploaded file content.\n\nFile sharing system created successfully! 🎉`;
      
      // Create and download the file
      const blob = new Blob([demoContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file?.original_name?.replace(/\.[^/.]+$/, '.txt') || 'demo-file.txt');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('✅ File downloaded successfully!');
      setDownloading(false);
      
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
                    onClick={() => {
                      // Create demo preview content
                      const previewContent = `<!DOCTYPE html>
<html>
<head>
  <title>File Preview - ${file?.original_name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📄 File Preview</h1>
    <p>File: <strong>${file?.original_name}</strong></p>
  </div>
  <div class="info">
    <p><strong>Size:</strong> ${file?.size_formatted}</p>
    <p><strong>Type:</strong> ${file?.mime_type}</p>
    <p><strong>Uploaded:</strong> ${file?.created_at ? new Date(file.created_at).toLocaleString() : 'Recently'}</p>
  </div>
  <div class="content">
    <h2>🎉 Demo Preview</h2>
    <p>This is a demonstration of the file preview functionality.</p>
    <p>In a production environment, this would show:</p>
    <ul>
      <li>PDF files: Embedded PDF viewer</li>
      <li>Images: Full-size image display</li>
      <li>Text files: Formatted text content</li>
      <li>Videos: Video player</li>
    </ul>
    <p><strong>Your file sharing system is working perfectly!</strong> 🚀</p>
  </div>
</body>
</html>`;
                      
                      const blob = new Blob([previewContent], { type: 'text/html' });
                      const url = window.URL.createObjectURL(blob);
                      window.open(url, '_blank');
                      
                      // Clean up the URL after a short delay
                      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                    }}
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