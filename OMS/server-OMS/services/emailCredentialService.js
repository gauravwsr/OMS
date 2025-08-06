const crypto = require('crypto');
const User = require('../models/userModel');
const nodemailer = require('nodemailer');

// Email credential encryption service
class EmailCredentialService {
  constructor() {
    // Use environment variable for encryption key
    this.encryptionKey = process.env.EMAIL_ENCRYPTION_KEY || 'your-32-character-encryption-key!!';
    this.algorithm = 'aes-256-cbc';
    
    console.log('🔧 EmailCredentialService initialized');
  }

  // Encrypt email password
  encryptPassword(password) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.encryptionKey.slice(0, 32)), iv);
      let encrypted = cipher.update(password, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt password');
    }
  }

  // Decrypt email password
  decryptPassword(encryptedPassword) {
    try {
      const [ivHex, encrypted] = encryptedPassword.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.encryptionKey.slice(0, 32)), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt password');
    }
  }

  // Save user email credentials
  async saveEmailCredentials(userId, smtpEmail, smtpPassword) {
    try {
      // Validate email format
      if (!this.isValidEmail(smtpEmail)) {
        throw new Error('Invalid email format');
      }

      // Check if email belongs to allowed domain
      if (!this.isAllowedDomain(smtpEmail)) {
        throw new Error('Email must be from tars.co.in domain');
      }

      // Test credentials before saving (optional for auto-config)
      try {
        const testResult = await this.testEmailCredentials(smtpEmail, smtpPassword);
        if (!testResult.success) {
          console.log('⚠️ Email test failed during auto-config, but saving anyway:', testResult.message);
          // Continue saving even if test fails during auto-config
        }
      } catch (testError) {
        console.log('⚠️ Email test error during auto-config:', testError.message);
        // Continue saving even if test fails during auto-config
      }

      // Encrypt password
      const encryptedPassword = this.encryptPassword(smtpPassword);

      // Update user record
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'emailConfig.smtpEmail': smtpEmail,
            'emailConfig.smtpPassword': encryptedPassword,
            'emailConfig.isEmailConfigured': true,
            'emailConfig.lastEmailSync': new Date(),
          }
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'Email credentials saved successfully',
        emailConfigured: true,
        smtpEmail: smtpEmail
      };
    } catch (error) {
      throw new Error(`Failed to save email credentials: ${error.message}`);
    }
  }

  // Get user email credentials
  async getEmailCredentials(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.emailConfig || !user.emailConfig.isEmailConfigured) {
        return {
          configured: false,
          message: 'Email credentials not configured'
        };
      }

      // Decrypt password
      const decryptedPassword = this.decryptPassword(user.emailConfig.smtpPassword);

      return {
        configured: true,
        smtpEmail: user.emailConfig.smtpEmail,
        smtpPassword: decryptedPassword,
        lastSync: user.emailConfig.lastEmailSync
      };
    } catch (error) {
      throw new Error(`Failed to get email credentials: ${error.message}`);
    }
  }

  // Remove user email credentials
  async removeEmailCredentials(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            'emailConfig.smtpEmail': null,
            'emailConfig.smtpPassword': null,
            'emailConfig.isEmailConfigured': false,
            'emailConfig.lastEmailSync': null,
          }
        },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'Email credentials removed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to remove email credentials: ${error.message}`);
    }
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check if email belongs to allowed domain
  isAllowedDomain(email) {
    const allowedDomains = ['tars.co.in', 'yourdomain.com']; // Add your domains
    const domain = email.split('@')[1];
    return allowedDomains.includes(domain);
  }

  // Test email credentials by attempting connection
  async testEmailCredentials(smtpEmail, smtpPassword) {
    console.log('🔧 Testing email credentials for:', smtpEmail);
    
    try {
      // Create test transporter
      const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 587,
        secure: false,
        auth: {
          user: smtpEmail,
          pass: smtpPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('📧 Attempting SMTP connection...');
      
      // Verify connection
      await transporter.verify();
      
      console.log('✅ SMTP connection verified successfully');
      
      return {
        success: true,
        message: 'Email credentials verified successfully'
      };
    } catch (error) {
      console.error('❌ SMTP verification failed:', error.message);
      return {
        success: false,
        message: `Email verification failed: ${error.message}`
      };
    }
  }

  // Generate Hostinger email suggestions based on user info
  generateEmailSuggestions(user) {
    const baseName = user.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'user';
    const userId = user.userId || user.candidateId || '001';
    
    return [
      `${baseName}@tars.co.in`,
      `${baseName}.${userId}@tars.co.in`,
      `${baseName}${userId}@tars.co.in`,
      `${user.role ? user.role.toLowerCase() : 'employee'}.${baseName}@tars.co.in`
    ];
  }
}

module.exports = new EmailCredentialService();
