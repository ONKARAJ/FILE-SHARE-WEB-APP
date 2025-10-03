const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { ensureUploadDirectory, deleteFile } = require('./fileUtils');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;
const USE_S3 = process.env.USE_AWS_S3 === 'true' && BUCKET_NAME;
const LOCAL_UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Upload file to S3
const uploadToS3 = async (filePath, key, mimetype) => {
  try {
    const fileContent = fs.readFileSync(filePath);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: mimetype,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD_IA' // Cost-effective for infrequent access
    };

    const result = await s3.upload(params).promise();
    return {
      success: true,
      location: result.Location,
      key: result.Key,
      etag: result.ETag
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Download file from S3 as stream
const downloadFromS3 = (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key
  };

  return s3.getObject(params).createReadStream();
};

// Get S3 file metadata
const getS3FileMetadata = async (key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    const result = await s3.headObject(params).promise();
    return {
      success: true,
      contentLength: result.ContentLength,
      contentType: result.ContentType,
      lastModified: result.LastModified,
      etag: result.ETag
    };
  } catch (error) {
    console.error('S3 metadata error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate signed URL for temporary access
const generateSignedUrl = (key, expiresIn = 3600) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn // URL expires in seconds
    };

    return {
      success: true,
      url: s3.getSignedUrl('getObject', params)
    };
  } catch (error) {
    console.error('S3 signed URL error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Store file locally
const storeFileLocally = async (file, storedName) => {
  try {
    await ensureUploadDirectory(LOCAL_UPLOAD_DIR);
    const localPath = path.join(LOCAL_UPLOAD_DIR, storedName);
    
    // Move file from temp location to upload directory
    fs.renameSync(file.path, localPath);
    
    return {
      success: true,
      path: localPath,
      relativePath: path.relative(process.cwd(), localPath)
    };
  } catch (error) {
    console.error('Local storage error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get local file stream
const getLocalFileStream = (filePath) => {
  try {
    return fs.createReadStream(filePath);
  } catch (error) {
    console.error('Local file stream error:', error);
    throw error;
  }
};

// Delete local file
const deleteLocalFile = async (filePath) => {
  return await deleteFile(filePath);
};

// Generic storage interface
class StorageManager {
  constructor() {
    this.useS3 = USE_S3;
  }

  async storeFile(file, storedName) {
    if (this.useS3) {
      // First store locally temporarily
      const localResult = await storeFileLocally(file, storedName);
      if (!localResult.success) {
        return localResult;
      }

      // Upload to S3
      const s3Key = `uploads/${storedName}`;
      const s3Result = await uploadToS3(localResult.path, s3Key, file.mimetype);
      
      // Clean up local temp file
      await deleteLocalFile(localResult.path);

      if (s3Result.success) {
        return {
          success: true,
          storageType: 's3',
          storagePath: s3Key,
          location: s3Result.location
        };
      } else {
        return s3Result;
      }
    } else {
      // Store locally
      const result = await storeFileLocally(file, storedName);
      if (result.success) {
        return {
          success: true,
          storageType: 'local',
          storagePath: result.relativePath,
          location: result.path
        };
      } else {
        return result;
      }
    }
  }

  async getFile(storagePath, storageType) {
    if (storageType === 's3') {
      return downloadFromS3(storagePath);
    } else {
      const fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(process.cwd(), storagePath);
      return getLocalFileStream(fullPath);
    }
  }

  async deleteFile(storagePath, storageType) {
    if (storageType === 's3') {
      return await deleteFromS3(storagePath);
    } else {
      const fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(process.cwd(), storagePath);
      return await deleteLocalFile(fullPath);
    }
  }

  async getFileMetadata(storagePath, storageType) {
    if (storageType === 's3') {
      return await getS3FileMetadata(storagePath);
    } else {
      try {
        const fullPath = path.isAbsolute(storagePath) ? storagePath : path.join(process.cwd(), storagePath);
        const stats = fs.statSync(fullPath);
        return {
          success: true,
          contentLength: stats.size,
          lastModified: stats.mtime
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  async generateDownloadUrl(storagePath, storageType, expiresIn = 3600) {
    if (storageType === 's3') {
      return generateSignedUrl(storagePath, expiresIn);
    } else {
      // For local storage, return a direct path (handled by express static middleware)
      return {
        success: true,
        url: `/uploads/${path.basename(storagePath)}`
      };
    }
  }
}

const storageManager = new StorageManager();

module.exports = {
  storageManager,
  StorageManager,
  uploadToS3,
  downloadFromS3,
  getS3FileMetadata,
  deleteFromS3,
  generateSignedUrl,
  storeFileLocally,
  getLocalFileStream,
  deleteLocalFile,
  USE_S3
};