// Meeting Notification Service
const nodemailer = require("nodemailer");

class MeetingNotificationService {
  constructor() {
    // Configure email transporter (using existing email configuration)
    this.transporter = nodemailer.createTransporter({
      host: "smtp.hostinger.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Send meeting invitation email
   */
  async sendMeetingInvitation(meetingData, invitedUser, inviteUrl) {
    try {
      const emailTemplate = this.generateInvitationEmail(
        meetingData,
        invitedUser,
        inviteUrl
      );

      const mailOptions = {
        from: process.env.SMTP_EMAIL || "noreply@yourcompany.com",
        to: invitedUser.email,
        subject: `Meeting Invitation: ${meetingData.roomName}`,
        html: emailTemplate,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Meeting invitation sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Failed to send meeting invitation:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send meeting reminder
   */
  async sendMeetingReminder(meetingData, participants) {
    try {
      const promises = participants.map((participant) => {
        const emailTemplate = this.generateReminderEmail(
          meetingData,
          participant
        );

        const mailOptions = {
          from: process.env.SMTP_EMAIL || "noreply@yourcompany.com",
          to: participant.email,
          subject: `Meeting Reminder: ${meetingData.roomName}`,
          html: emailTemplate,
        };

        return this.transporter.sendMail(mailOptions);
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled").length;

      console.log(`Meeting reminders sent: ${successful}/${results.length}`);
      return { success: true, sent: successful, total: results.length };
    } catch (error) {
      console.error("Failed to send meeting reminders:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate HTML email template for meeting invitation
   */
  generateInvitationEmail(meetingData, invitedUser, inviteUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Invitation</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .meeting-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }
          .join-button {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎥 Meeting Invitation</h1>
          <p>You've been invited to join a video conference</p>
        </div>
        
        <div class="content">
          <p>Hello ${invitedUser.name},</p>
          
          <p>You have been invited to join a video meeting. Here are the details:</p>
          
          <div class="meeting-details">
            <h3>${meetingData.roomName}</h3>
            <p><strong>Meeting Type:</strong> ${
              meetingData.roomType === "global"
                ? "Global Meeting"
                : "Team Meeting"
            }</p>
            ${
              meetingData.teamName
                ? `<p><strong>Team:</strong> ${meetingData.teamName}</p>`
                : ""
            }
            <p><strong>Created by:</strong> ${meetingData.createdByName} (${
      meetingData.createdByRole
    })</p>
            <p><strong>Created:</strong> ${new Date(
              meetingData.createdAt
            ).toLocaleString()}</p>
          </div>
          
          <p>Click the button below to join the meeting:</p>
          
          <a href="${inviteUrl}" class="join-button">Join Meeting</a>
          
          <p><small>This invitation link will expire in 24 hours.</small></p>
          
          <div class="footer">
            <p>This is an automated message from the OMS Video Conference System.</p>
            <p>If you have any issues joining the meeting, please contact your system administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML email template for meeting reminder
   */
  generateReminderEmail(meetingData, participant) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Reminder</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .meeting-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          }
          .join-button {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .urgent {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #b91c1c;
            padding: 12px;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⏰ Meeting Reminder</h1>
          <p>Don't forget about your upcoming meeting</p>
        </div>
        
        <div class="content">
          <p>Hello ${participant.name},</p>
          
          <div class="urgent">
            <strong>Reminder:</strong> You have an active meeting that you may want to join.
          </div>
          
          <div class="meeting-details">
            <h3>${meetingData.roomName}</h3>
            <p><strong>Meeting Type:</strong> ${
              meetingData.roomType === "global"
                ? "Global Meeting"
                : "Team Meeting"
            }</p>
            ${
              meetingData.teamName
                ? `<p><strong>Team:</strong> ${meetingData.teamName}</p>`
                : ""
            }
            <p><strong>Status:</strong> ${meetingData.meetingStatus}</p>
            <p><strong>Active Participants:</strong> ${
              meetingData.activeParticipants
            }</p>
          </div>
          
          <a href="${
            meetingData.roomUrl
          }" class="join-button">Join Meeting Now</a>
          
          <p>This meeting is currently active. You can join at any time using the link above.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send meeting started notification
   */
  async sendMeetingStartedNotification(meetingData, eligibleUsers) {
    try {
      const promises = eligibleUsers.map((user) => {
        const emailTemplate = this.generateMeetingStartedEmail(
          meetingData,
          user
        );

        const mailOptions = {
          from: process.env.SMTP_EMAIL || "noreply@yourcompany.com",
          to: user.email,
          subject: `Meeting Started: ${meetingData.roomName}`,
          html: emailTemplate,
        };

        return this.transporter.sendMail(mailOptions);
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter((r) => r.status === "fulfilled").length;

      console.log(
        `Meeting started notifications sent: ${successful}/${results.length}`
      );
      return { success: true, sent: successful, total: results.length };
    } catch (error) {
      console.error("Failed to send meeting started notifications:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate email for meeting started notification
   */
  generateMeetingStartedEmail(meetingData, user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Started</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .meeting-details {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #059669;
          }
          .join-button {
            display: inline-block;
            background: #059669;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .live-indicator {
            background: #dc2626;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔴 Meeting Started</h1>
          <p>A meeting you can join has just started</p>
        </div>
        
        <div class="content">
          <p>Hello ${user.name},</p>
          
          <div class="live-indicator">🔴 LIVE NOW</div>
          
          <div class="meeting-details">
            <h3>${meetingData.roomName}</h3>
            <p><strong>Meeting Type:</strong> ${
              meetingData.roomType === "global"
                ? "Global Meeting"
                : "Team Meeting"
            }</p>
            ${
              meetingData.teamName
                ? `<p><strong>Team:</strong> ${meetingData.teamName}</p>`
                : ""
            }
            <p><strong>Started by:</strong> ${meetingData.createdByName}</p>
            <p><strong>Current Participants:</strong> ${
              meetingData.activeParticipants
            }</p>
          </div>
          
          <p>Join now to participate in the discussion:</p>
          
          <a href="${meetingData.roomUrl}" class="join-button">Join Meeting</a>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new MeetingNotificationService();
