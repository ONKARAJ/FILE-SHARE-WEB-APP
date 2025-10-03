import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  AuthResponse,
  LoginForm,
  RegisterForm,
  UploadResponse,
  MultipleUploadResponse,
  FileMetadata,
  FilesListResponse,
  ApiError,
  UploadOptions,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.is_public !== undefined) {
      formData.append('is_public', String(options.is_public));
    }
    
    if (options.password) {
      formData.append('password', options.password);
    }

    const response = await this.api.post<UploadResponse>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    
    return response.data;
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
