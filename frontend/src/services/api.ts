import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  AuthResponse,
  LoginForm,
  RegisterForm,
  UploadResponse,
  FilesListResponse,
  ApiError,
  UploadOptions,
} from '../types';

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // TEMPORARY FIX: Force correct URL for production
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('🔧 API: FORCED - Using current production domain:', window.location.origin);
    return window.location.origin;
  }
  // If running in production (on Vercel), use the current domain
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    console.log('🔧 API: Using current domain for API calls:', window.location.origin);
    return window.location.origin;
  }
  // Otherwise use environment variable or localhost
  const fallbackUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  console.log('🔧 API: Using fallback URL:', fallbackUrl);
  return fallbackUrl;
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔧 API: Final API_BASE_URL:', API_BASE_URL);
console.log('🔧 API: Cache bust - Version 2024-10-03-10:27 UTC');

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: AxiosError): ApiError {
    if (error.response?.data) {
      return error.response.data as ApiError;
    }
    return {
      error: error.message || 'An unexpected error occurred',
    };
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  }

  async register(data: RegisterForm): Promise<AuthResponse> {
    const { confirmPassword, ...registerData } = data;
    const response = await this.api.post<AuthResponse>('/api/auth/register', registerData);
    return response.data;
  }

  async uploadFile(
    file: File,
    options: UploadOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    // Convert file to base64 for upload
    const fileContent = await this.fileToBase64(file);
    
    const uploadData = {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileContent: fileContent,
      ...options
    };

    console.log('🚀 Upload: Starting file upload:', file.name);
    console.log('🚀 Upload: API Base URL:', API_BASE_URL);
    console.log('🚀 Upload: Full URL will be:', `${API_BASE_URL}/api/upload`);
    console.log('🚀 Upload: Data:', uploadData);

    // Simulate upload progress
    if (onProgress) {
      const intervals = [10, 25, 50, 75, 90, 100];
      for (const progress of intervals) {
        setTimeout(() => onProgress(progress), 200 * (progress / 20));
      }
    }

    try {
      const response = await this.api.post<UploadResponse>('/api/upload', uploadData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('✅ Upload: Success!', response.data);
      
      // Store upload info in localStorage for demo purposes
      try {
        const uploadHistory = JSON.parse(localStorage.getItem('recent_uploads') || '[]');
        uploadHistory.push({
          id: response.data.file.id,
          original_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          size_formatted: response.data.file.size_formatted,
          created_at: response.data.file.created_at
        });
        // Keep only last 10 uploads
        if (uploadHistory.length > 10) uploadHistory.splice(0, uploadHistory.length - 10);
        localStorage.setItem('recent_uploads', JSON.stringify(uploadHistory));
      } catch (e) {
        // Ignore localStorage errors
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Upload: Error!', error);
      // Ensure error is properly formatted for React components
      const errorMessage = error?.response?.data?.error || error?.message || 'Upload failed';
      throw new Error(errorMessage);
    }
  }

  async getFileInfo(fileId: string, password?: string) {
    const url = `/api/files/${fileId}/info`;
    
    if (password) {
      const response = await this.api.post(url, { password });
      return response.data;
    } else {
      const response = await this.api.get(url);
      return response.data;
    }
  }

  async downloadFile(fileId: string, password?: string): Promise<Blob> {
    const url = `/api/files/${fileId}/download`;
    
    const config = {
      responseType: 'blob' as const,
    };
    
    if (password) {
      const response = await this.api.post(url, { password }, config);
      return response.data;
    } else {
      const response = await this.api.get(url, config);
      return response.data;
    }
  }

  getPreviewUrl(fileId: string, password?: string): string {
    const params = password ? `?password=${encodeURIComponent(password)}` : '';
    return `${API_BASE_URL}/api/files/${fileId}/preview${params}`;
  }

  async getUserFiles(page = 1, limit = 20): Promise<FilesListResponse> {
    const response = await this.api.get<FilesListResponse>(`/api/files?page=${page}&limit=${limit}`);
    return response.data;
  }

  async deleteFile(fileId: string) {
    const response = await this.api.delete(`/api/files/${fileId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
