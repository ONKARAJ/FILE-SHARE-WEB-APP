const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Simple in-memory storage for demo (in production, use a database)
const files = new Map();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parsing error:', err);
        return res.status(400).json({ error: 'Failed to parse file upload' });
      }

      const uploadedFile = files.file;
      if (!uploadedFile) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate unique file ID
      const fileId = uuidv4();
      const originalName = Array.isArray(uploadedFile.originalFilename) 
        ? uploadedFile.originalFilename[0] 
        : uploadedFile.originalFilename;
      
      const fileSize = Array.isArray(uploadedFile.size) 
        ? uploadedFile.size[0] 
        : uploadedFile.size;

      const mimeType = Array.isArray(uploadedFile.mimetype) 
        ? uploadedFile.mimetype[0] 
        : uploadedFile.mimetype;

      // For demo purposes, we'll store file metadata in memory
      // In production, save to database and cloud storage
      const fileMetadata = {
        id: fileId,
        original_name: originalName,
        mime_type: mimeType || 'application/octet-stream',
        size_bytes: fileSize,
        size_formatted: formatFileSize(fileSize),
        download_count: 0,
        is_public: true,
        is_password_protected: false,
        is_expired: false,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        created_at: new Date().toISOString(),
        last_accessed_at: null,
      };

      // Store file metadata
      files.set(fileId, fileMetadata);

      // Generate shareable link
      const shareableLink = `${req.headers.origin || 'https://file-share-web-app.vercel.app'}/download/${fileId}`;

      // For demo, determine if file can be previewed
      const previewableTypes = ['image/', 'text/', 'application/pdf'];
      const canPreview = previewableTypes.some(type => mimeType?.startsWith(type));

      res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        file: fileMetadata,
        shareable_link: shareableLink,
        can_preview: canPreview,
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}