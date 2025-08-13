import React, { useState } from 'react';
import { Upload, FileText, Image, Download, Trash2 } from 'lucide-react';

const CloudinaryDemo = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/emails/test-send', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      const result = await response.json();
      if (result.cloudinary && result.cloudinary.files) {
        setUploadResults(result.cloudinary.files);
        console.log('Cloudinary upload results:', result.cloudinary.files);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (format) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format?.toLowerCase())) {
      return <Image size={20} className="text-blue-500" />;
    }
    return <FileText size={20} className="text-gray-500" />;
  };

  return (
    <div className="cloudinary-demo" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Cloudinary Upload Demo</h2>
      
      <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #ddd', borderRadius: '8px', textAlign: 'center' }}>
        <Upload size={48} style={{ color: '#666', marginBottom: '10px' }} />
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ marginBottom: '10px', display: 'block', margin: '0 auto' }}
          accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
        />
        
        {files.length > 0 && (
          <div>
            <p>{files.length} file(s) selected</p>
            <button
              onClick={uploadFiles}
              disabled={uploading}
              style={{
                padding: '10px 20px',
                backgroundColor: uploading ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
            </button>
          </div>
        )}
      </div>

      {uploadResults.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Upload Results:</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {uploadResults.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}
              >
                {getFileIcon(file.format)}
                <div style={{ marginLeft: '10px', flex: 1 }}>
                  <div style={{ fontWeight: '500', color: '#333' }}>
                    {file.original_filename}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatFileSize(file.bytes)} • {file.format?.toUpperCase()} • {file.public_id}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href={file.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Download size={12} />
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryDemo;
