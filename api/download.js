// Simple in-memory storage for demo (in production, use a database)
const files = new Map();

// For demo purposes, we'll create some sample file metadata
// In a real app, this would be shared with the upload endpoint
const sampleFiles = new Map();

async function handler(req, res) {
  // Set comprehensive CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  console.log('📡 Download API: Request received:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract file ID from query parameter
    const { fileId } = req.query;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // For demo purposes, return file info
    // In production, this would retrieve from database and return actual file
    const fileInfo = {
      id: fileId,
      original_name: 'Demo File.pdf',
      mime_type: 'application/pdf',
      size_bytes: 617080,
      size_formatted: '602.62 KB',
      download_count: 1,
      is_public: true,
      is_password_protected: false,
      is_expired: false,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    };

    // Return file metadata for download page
    res.status(200).json({
      success: true,
      file: fileInfo,
      download_url: `${req.headers.origin || 'https://file-share-web-1nond0wsd-onkar-rajs-projects.vercel.app'}/api/files/${fileId}/download`,
      message: 'File found - demo version'
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = handler;