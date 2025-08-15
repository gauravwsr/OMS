// Utility functions for downloading files from Cloudinary and other sources

/**
 * Downloads a file from Cloudinary or any URL
 * @param {string} url - The file URL (Cloudinary or direct link)
 * @param {string} filename - The desired filename for download
 * @param {string} type - File type hint (e.g., 'resume', 'cv', 'document')
 * @returns {Promise<boolean>} - Success status
 */
export const downloadFile = async (url, filename, type = 'file') => {
  if (!url) {
    console.error('❌ Download URL is required');
    return false;
  }

  try {
    console.log(`📥 Starting download: ${filename || type}`);

    if (url.includes('cloudinary.com') || url.startsWith('https://res.cloudinary.com/')) {
      // Direct download from Cloudinary
      console.log('☁️ Downloading directly from Cloudinary');
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${type}_${Date.now()}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Cloudinary download initiated successfully');
      return true;
      
    } else {
      // Use server proxy for other files
      console.log('🔄 Downloading via server proxy');
      
      const proxyUrl = `http://localhost:5001/api/emails/download-file?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&type=${encodeURIComponent(type)}`;
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Server proxy failed: ${response.status} ${response.statusText}`);
      }
      
      // Create blob and download
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `${type}_${Date.now()}`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('✅ Proxy download completed successfully');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Download failed:', error);
    alert(`❌ Download failed: ${error.message}`);
    return false;
  }
};

/**
 * Downloads a resume/CV specifically
 * @param {Object} candidate - Candidate object with cvPath and fullName
 * @returns {Promise<boolean>} - Success status
 */
export const downloadResume = async (candidate) => {
  if (!candidate || !candidate.cvPath) {
    console.error('❌ Candidate or CV path not provided');
    return false;
  }

  const filename = `${candidate.fullName || 'candidate'}_CV.pdf`;
  return await downloadFile(candidate.cvPath, filename, 'resume');
};

/**
 * Downloads any document for a candidate
 * @param {Object} candidate - Candidate object
 * @param {string} documentPath - Path to document
 * @param {string} documentType - Type of document (e.g., 'panCard', 'aadhar')
 * @returns {Promise<boolean>} - Success status
 */
export const downloadCandidateDocument = async (candidate, documentPath, documentType) => {
  if (!candidate || !documentPath) {
    console.error('❌ Candidate or document path not provided');
    return false;
  }

  const filename = `${candidate.fullName || 'candidate'}_${documentType}`;
  return await downloadFile(documentPath, filename, documentType);
};

/**
 * Downloads email attachment from Cloudinary
 * @param {Object} attachment - Attachment object with cloudinary or secure_url
 * @returns {Promise<boolean>} - Success status
 */
export const downloadEmailAttachment = async (attachment) => {
  if (!attachment) {
    console.error('❌ Attachment object not provided');
    return false;
  }

  const url = attachment.cloudinary?.secure_url || attachment.secure_url;
  const filename = attachment.originalname || attachment.filename || attachment.name || 'attachment';
  
  if (!url) {
    console.error('❌ No download URL found in attachment');
    return false;
  }

  return await downloadFile(url, filename, 'attachment');
};

/**
 * Opens a file in a new tab for viewing
 * @param {string} url - The file URL
 * @param {string} filename - Optional filename for logging
 */
export const viewFile = (url, filename) => {
  if (!url) {
    console.error('❌ View URL is required');
    return;
  }

  console.log(`👁️ Opening file in new tab: ${filename || 'file'}`);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Gets a user-friendly file size display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Determines file type from URL or filename
 * @param {string} urlOrFilename - File URL or filename
 * @returns {Object} - File type info { type, icon, color }
 */
export const getFileTypeInfo = (urlOrFilename) => {
  if (!urlOrFilename) return { type: 'unknown', icon: '📄', color: '#6b7280' };
  
  const filename = urlOrFilename.toLowerCase();
  
  if (filename.includes('.pdf') || filename.includes('pdf')) {
    return { type: 'pdf', icon: '📄', color: '#ef4444' };
  } else if (filename.includes('.doc') || filename.includes('.docx')) {
    return { type: 'document', icon: '📝', color: '#2563eb' };
  } else if (filename.includes('.jpg') || filename.includes('.jpeg') || filename.includes('.png') || filename.includes('.gif')) {
    return { type: 'image', icon: '🖼️', color: '#10b981' };
  } else if (filename.includes('.xls') || filename.includes('.xlsx')) {
    return { type: 'spreadsheet', icon: '📊', color: '#059669' };
  } else if (filename.includes('.ppt') || filename.includes('.pptx')) {
    return { type: 'presentation', icon: '📺', color: '#dc2626' };
  } else if (filename.includes('.txt')) {
    return { type: 'text', icon: '📄', color: '#374151' };
  } else {
    return { type: 'file', icon: '📎', color: '#6b7280' };
  }
};

// Export all functions as default for convenience
export default {
  downloadFile,
  downloadResume,
  downloadCandidateDocument,
  downloadEmailAttachment,
  viewFile,
  formatFileSize,
  getFileTypeInfo
};
