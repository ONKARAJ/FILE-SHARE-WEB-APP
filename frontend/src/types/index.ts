// User types
export interface User {
  id: string;
  email: string;
  name: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
  token_type: string;
}

// File types
export interface FileMetadata {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  size_formatted: string;
  user_id?: string;
  download_count: number;
  is_public: boolean;
  is_password_protected: boolean;
  is_expired: boolean;
  expires_at?: string;
  created_at: string;
  last_accessed_at?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  file: FileMetadata;
  shareable_link: string;
  can_preview: boolean;
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  uploaded_files: Array<{
    file: FileMetadata;
    shareable_link: string;
    can_preview: boolean;
  }>;
  errors?: Array<{
    file: string;
    error?: string;
    errors?: string[];
  }>;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  details?: any;
  data?: T;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  count: number;
  has_more: boolean;
}

export interface FilesListResponse {
  success: boolean;
  files: FileMetadata[];
  pagination: PaginationInfo;
}

// Upload progress types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadState {
  file: File;
  progress: UploadProgress;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: {
    file: FileMetadata;
    shareable_link: string;
    can_preview: boolean;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UploadOptions {
  is_public?: boolean;
  password?: string;
  expires_at?: string;
}

// Error types
export interface ApiError {
  error: string;
  details?: any;
  timestamp?: string;
  path?: string;
  method?: string;
}

// File preview types
export interface FilePreviewProps {
  file: FileMetadata;
  password?: string;
  onClose: () => void;
}

// Component prop types
export interface FileCardProps {
  file: FileMetadata;
  onDelete?: (fileId: string) => void;
  onUpdate?: (fileId: string, updates: Partial<FileMetadata>) => void;
  showActions?: boolean;
}

export interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  children?: React.ReactNode;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}