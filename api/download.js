// Use shared file storage
const { files, formatFileSize } = require('./fileStorage');

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

    console.log(`🔍 Download API: Looking for file ${fileId}`);
    console.log(`💾 Download API: Available files in storage:`, Array.from(files.keys()));
    console.log(`💾 Download API: Total files in storage:`, files.size);
    
    // Get the actual file from storage
    const fileData = files.get(fileId);
    
    if (!fileData) {
      console.log(`❌ Download API: File ${fileId} not found`);
      return res.status(404).json({ error: 'File not found or expired' });
    }
    
    // Check if file is expired
    if (fileData.expires_at && new Date(fileData.expires_at) < new Date()) {
      console.log(`⏰ Download API: File ${fileId} expired`);
      return res.status(410).json({ error: 'File has expired' });
    }
    
    console.log(`✅ Download API: Found file ${fileData.original_name}`);
    
    // Update last accessed time and download count
    fileData.last_accessed_at = new Date().toISOString();
    fileData.download_count = (fileData.download_count || 0) + 1;
    
    // Check if this is a request for the actual file download
    if (req.url.includes('/download') && req.query.action === 'download') {
      console.log(`💾 Download API: Serving file content for ${fileId}`);
      
      // Convert base64 back to binary for download
      const base64Data = fileData.file_content.split(',')[1]; // Remove data:mime;base64, prefix
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Set appropriate headers for file download
      res.setHeader('Content-Type', fileData.mime_type || 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.original_name}"`);
      
      return res.send(buffer);
    }
    
    // Check if this is a request for file preview
    if (req.url.includes('/download') && req.query.action === 'preview') {
      console.log(`🔍 Download API: Serving preview for ${fileId}`);
      
      // Convert base64 back to binary for preview
      const base64Data = fileData.file_content.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Set appropriate headers for inline preview
      res.setHeader('Content-Type', fileData.mime_type || 'application/octet-stream');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${fileData.original_name}"`);
      
      return res.send(buffer);
    }
    
    // Return file metadata for download page
    const { file_content, ...fileMetadata } = fileData; // Don't include file content in metadata response
    
    const baseUrl = req.headers.origin || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
    
    res.status(200).json({
      success: true,
      file: fileMetadata,
      download_url: `${baseUrl}/api/download?fileId=${fileId}&action=download`,
      preview_url: `${baseUrl}/api/download?fileId=${fileId}&action=preview`,
      message: 'File found'
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = handler;