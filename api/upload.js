// Simple in-memory storage for demo (in production, use a database)
const files = new Map();

// Simple ID generator for demo
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

async function handler(req, res) {
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
    // For demo purposes, simulate file upload with JSON data
    const { fileName, fileSize, fileType } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ error: 'File name is required' });
    }

    // Generate unique file ID
    const fileId = generateId();
    
    // Create file metadata
    const fileMetadata = {
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
    };

    // Store file metadata
    files.set(fileId, fileMetadata);

    // Generate shareable link
    const shareableLink = `${req.headers.origin || 'https://file-share-web-gn6nfomae-onkar-rajs-projects.vercel.app'}/download/${fileId}`;

    // For demo, determine if file can be previewed
    const previewableTypes = ['image/', 'text/', 'application/pdf'];
    const canPreview = previewableTypes.some(type => fileMetadata.mime_type?.startsWith(type));

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

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = handler;
module.exports.config = config;
