const File = require('../models/File');
const { storageManager } = require('../utils/storageUtils');
const { 
  sanitizeFilename, 
  generateUniqueFilename, 
  validateFileUpload,
  isPreviewableFile 
} = require('../utils/fileUtils');
const { isAuthenticated } = require('../middleware/auth');

// Upload single file
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file
    const validation = validateFileUpload(req.file);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'File validation failed',
        details: validation.errors
      });
    }

    // Sanitize filename
    const originalName = sanitizeFilename(req.file.originalname);
    const storedName = generateUniqueFilename(originalName);

    // Store file
    const storageResult = await storageManager.storeFile(req.file, storedName);
    if (!storageResult.success) {
      return res.status(500).json({
        error: 'Failed to store file',
        details: storageResult.error
      });
    }

    // Get user IP
    const uploadIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

    // Create database record
    const fileRecord = await File.create({
      original_name: originalName,
      stored_name: storedName,
      mime_type: req.file.mimetype,
      size_bytes: req.file.size,
      user_id: req.user ? req.user.id : null,
      upload_ip: uploadIp,
      storage_type: storageResult.storageType,
      storage_path: storageResult.storagePath,
      is_public: req.body.is_public !== 'false', // Default to true unless explicitly false
      password: req.body.password || null,
      expires_at: req.body.expires_at || null
    });

    // Generate shareable link
    const shareableLink = `${process.env.FRONTEND_URL}/download/${fileRecord.id}`;

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: fileRecord.toPublicJSON(),
      shareable_link: shareableLink,
      can_preview: isPreviewableFile(fileRecord.mime_type)
    });

  } catch (error) {
    next(error);
  }
};

// Upload multiple files
const uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Validate file
        const validation = validateFileUpload(file);
        if (!validation.isValid) {
          errors.push({
            file: file.originalname,
            errors: validation.errors
          });
          continue;
        }

        // Sanitize filename
        const originalName = sanitizeFilename(file.originalname);
        const storedName = generateUniqueFilename(originalName);

        // Store file
        const storageResult = await storageManager.storeFile(file, storedName);
        if (!storageResult.success) {
          errors.push({
            file: file.originalname,
            error: `Failed to store: ${storageResult.error}`
          });
          continue;
        }

        // Get user IP
        const uploadIp = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

        // Create database record
        const fileRecord = await File.create({
          original_name: originalName,
          stored_name: storedName,
          mime_type: file.mimetype,
          size_bytes: file.size,
          user_id: req.user ? req.user.id : null,
          upload_ip: uploadIp,
          storage_type: storageResult.storageType,
          storage_path: storageResult.storagePath,
          is_public: req.body.is_public !== 'false',
          password: req.body.password || null,
          expires_at: req.body.expires_at || null
        });

        uploadedFiles.push({
          file: fileRecord.toPublicJSON(),
          shareable_link: `${process.env.FRONTEND_URL}/download/${fileRecord.id}`,
          can_preview: isPreviewableFile(fileRecord.mime_type)
        });

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        errors.push({
          file: file.originalname,
          error: fileError.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      uploaded_files: uploadedFiles,
      ...(errors.length > 0 && { errors })
    });

  } catch (error) {
    next(error);
  }
};

// Get file info
const getFileInfo = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is expired
    if (file.isExpired()) {
      return res.status(410).json({ error: 'File has expired' });
    }

    // If file is password protected and no password provided, don't return full info
    if (file.isPasswordProtected() && !req.body.password) {
      return res.status(200).json({
        id: file.id,
        original_name: file.original_name,
        size_formatted: file.formatSize(),
        is_password_protected: true,
        created_at: file.created_at,
        expires_at: file.expires_at
      });
    }

    // Verify password if provided
    if (file.isPasswordProtected() && req.body.password) {
      const isPasswordValid = await file.verifyPassword(req.body.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    res.json({
      success: true,
      file: file.toPublicJSON(),
      can_preview: isPreviewableFile(file.mime_type)
    });

  } catch (error) {
    next(error);
  }
};

// Download file
const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is expired
    if (file.isExpired()) {
      return res.status(410).json({ error: 'File has expired' });
    }

    // Verify password if file is protected
    if (file.isPasswordProtected()) {
      if (!password) {
        return res.status(401).json({ error: 'Password required' });
      }

      const isPasswordValid = await file.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Increment download count
    await file.incrementDownloadCount();

    // Get file stream
    try {
      const fileStream = await storageManager.getFile(file.storage_path, file.storage_type);
      
      // Set response headers
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Content-Length', file.size_bytes);

      // Stream file to response
      fileStream.pipe(res);

    } catch (streamError) {
      console.error('File streaming error:', streamError);
      return res.status(500).json({ error: 'Failed to retrieve file' });
    }

  } catch (error) {
    next(error);
  }
};

// Preview file (for images, PDFs, etc.)
const previewFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.query;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if file is expired
    if (file.isExpired()) {
      return res.status(410).json({ error: 'File has expired' });
    }

    // Check if file can be previewed
    if (!isPreviewableFile(file.mime_type)) {
      return res.status(422).json({ error: 'File cannot be previewed' });
    }

    // Verify password if file is protected
    if (file.isPasswordProtected()) {
      if (!password) {
        return res.status(401).json({ error: 'Password required' });
      }

      const isPasswordValid = await file.verifyPassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    }

    // Get file stream
    try {
      const fileStream = await storageManager.getFile(file.storage_path, file.storage_type);
      
      // Set response headers for preview
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', 'inline');

      // Stream file to response
      fileStream.pipe(res);

    } catch (streamError) {
      console.error('File streaming error:', streamError);
      return res.status(500).json({ error: 'Failed to retrieve file' });
    }

  } catch (error) {
    next(error);
  }
};

// Delete file (authenticated users only)
const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user owns the file (or is admin)
    if (!isAuthenticated(req) || (file.user_id && file.user_id !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete physical file
    await storageManager.deleteFile(file.storage_path, file.storage_type);

    // Delete database record
    await file.delete();

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// List user files (authenticated users only)
const listUserFiles = async (req, res, next) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const files = await File.findByUserId(req.user.id, limit, offset);
    
    res.json({
      success: true,
      files: files.map(file => file.toJSON()),
      pagination: {
        page,
        limit,
        count: files.length,
        has_more: files.length === limit
      }
    });

  } catch (error) {
    next(error);
  }
};

// Update file metadata (authenticated users only)
const updateFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { original_name, is_public, expires_at } = req.body;

    const file = await File.findById(id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user owns the file
    if (!isAuthenticated(req) || (file.user_id && file.user_id !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update file
    const updateData = {};
    if (original_name !== undefined) updateData.original_name = sanitizeFilename(original_name);
    if (is_public !== undefined) updateData.is_public = is_public;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    const updatedFile = await file.update(updateData);

    res.json({
      success: true,
      message: 'File updated successfully',
      file: updatedFile.toJSON()
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  getFileInfo,
  downloadFile,
  previewFile,
  deleteFile,
  listUserFiles,
  updateFile
};