// Use shared file storage
const { files, generateId, formatFileSize } = require('./fileStorage');

const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

async function handler(req, res) {
  // Set comprehensive CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  console.log('📡 API: Request received:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Handle real file upload with base64 encoded content
    const { fileName, fileSize, fileType, fileContent } = req.body;
    
    if (!fileName || !fileContent) {
      return res.status(400).json({ error: 'File name and content are required' });
    }

    // Validate file content is base64
    if (!fileContent.startsWith('data:')) {
      return res.status(400).json({ error: 'Invalid file content format' });
    }

    // Generate unique file ID
    const fileId = generateId();
    
    // Create file metadata and store actual file content
    const fileData = {
      id: fileId,
      original_name: fileName,
      mime_type: fileType || 'application/octet-stream',
      size_bytes: fileSize || 0,
      size_formatted: formatFileSize(fileSize || 0),
      download_count: 0,
      is_public: true,
      is_password_protected: false,
      is_expired: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      created_at: new Date().toISOString(),
      last_accessed_at: null,
      // Store the actual file content
      file_content: fileContent, // base64 data URL
    };

    // Store complete file data (metadata + content)
    files.set(fileId, fileData);
    
    console.log(`💾 Stored file ${fileId}: ${fileName} (${formatFileSize(fileSize || 0)})`);

    // Generate shareable link to frontend download page
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || req.headers['x-forwarded-host'] || 'localhost';
    const baseUrl = req.headers.origin || `${protocol}://${host}`;
    const shareableLink = `${baseUrl}/download/${fileId}`;
    
    console.log('🔗 Generated share link:', shareableLink);

    // Determine if file can be previewed
    const previewableTypes = ['image/', 'text/', 'application/pdf'];
    const canPreview = previewableTypes.some(type => fileData.mime_type?.startsWith(type));

    // Return metadata only (don't send file content back in response)
    const { file_content, ...fileMetadata } = fileData;

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: fileMetadata,
      shareable_link: shareableLink,
      can_preview: canPreview,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = handler;
module.exports.config = config;
