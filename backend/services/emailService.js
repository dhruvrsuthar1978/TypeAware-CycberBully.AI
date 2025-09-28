const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const path = require('path');
const handlebars = require('handlebars');

class EmailService {
  /**
   * @param {object} config - Email configuration.
   * @param {string} config.host - SMTP host.
   * @param {number} config.port - SMTP port.
   * @param {boolean} config.secure - Use SSL/TLS.
   * @param {object} config.auth - Authentication credentials.
   * @param {string} config.auth.user - SMTP user.
   * @param {string} config.auth.pass - SMTP password.
   * @param {object} config.defaults - Default mail options.
   * @param {string} config.defaults.from - Default from address.
   */
  constructor(config) {
    this.config = config || {};
    this.transporter = null;
    this.isConfigured = false;
    this.initializeTransporter();
  }

  /**
   * Initializes the Nodemailer transporter.
   * The transporter is only created if auth credentials are provided.
   */
  initializeTransporter() {
    try {
      if (this.config.auth && this.config.auth.user && this.config.auth.pass) {
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: this.config.auth,
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.isConfigured = true;
        console.log('📧 Email service initialized successfully');
      } else {
        console.log('⚠️ Email service not configured - SMTP credentials missing');
      }
    } catch (error) {
      console.error('❌ Error initializing email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Verifies the SMTP connection.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async verifyConnection() {
    if (!this.isConfigured) {
      return { success: false, message: 'Email service not configured' };
    }
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connection verified' };
    } catch (error) {
      console.error('Email service verification failed:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Renders email templates using Handlebars.
   * @param {string} templateName - The name of the template directory.
   * @param {object} data - Data to inject into the template.
   * @returns {Promise<{subject: string, html: string, text: string}>}
   * @private
   */
  async #renderTemplate(templateName, data) {
    const templatePath = path.join(__dirname, 'templates', templateName);
    try {
      const [subjectTpl, htmlTpl, textTpl] = await Promise.all([
        fs.readFile(path.join(templatePath, 'subject.hbs'), 'utf-8'),
        fs.readFile(path.join(templatePath, 'html.hbs'), 'utf-8'),
        fs.readFile(path.join(templatePath, 'text.hbs'), 'utf-8'),
      ]);

      const compile = (template) => handlebars.compile(template)(data);

      return {
        subject: compile(subjectTpl),
        html: compile(htmlTpl),
        text: compile(textTpl),
      };
    } catch (error) {
      console.error(`Error rendering email template "${templateName}":`, error);
      throw new Error(`Could not render template: ${templateName}`);
    }
  }

  /**
   * Sends an email using a specified template.
   * @param {string} to - Recipient's email address.
   * @param {string} template - The name of the template to use.
   * @param {object} data - Data to pass to the template.
   * @returns {Promise<{success: boolean, message: string, messageId?: string}>}
   */
  async send(to, template, data = {}) {
    if (!this.isConfigured) {
      console.log(`📧 Email to ${to} skipped: service not configured.`);
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const { subject, html, text } = await this.#renderTemplate(template, data);

      const mailOptions = {
        from: this.config.defaults.from,
        to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${to} [${subject}]`);

      return {
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error(`Error sending email to ${to}:`, error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Sends a welcome email to a new user.
   * @param {object} user - The user object.
   * @param {string} user.email - User's email.
   * @param {string} user.firstName - User's first name.
   */
  async sendWelcomeEmail(user) {
    const appName = process.env.APP_NAME || 'TypeAware';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return this.send(user.email, 'welcome', {
      firstName: user.firstName,
      appName,
      dashboardUrl: `${appUrl}/dashboard`,
    });
  }

  /**
   * Sends a password reset email.
   * @param {object} user - The user object.
   * @param {string} resetToken - The password reset token.
   */
  async sendPasswordResetEmail(user, resetToken) {
    const appName = process.env.APP_NAME || 'TypeAware';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return this.send(user.email, 'passwordReset', {
      firstName: user.firstName,
      appName,
      resetUrl: `${appUrl}/reset-password?token=${resetToken}`,
      expiryTime: '1 hour',
    });
  }

  /**
    * Sends an email verification link.
    * @param {object} user - The user object.
    * @param {string} verificationToken - The verification token.
    */
  async sendEmailVerification(user, verificationToken) {
    const appName = process.env.APP_NAME || 'TypeAware';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return this.send(user.email, 'emailVerification', {
        firstName: user.firstName,
        appName,
        verificationUrl: `${appUrl}/verify-email?token=${verificationToken}`,
    });
  }

  /**
   * Sends a report confirmation email.
   * @param {object} user - The user object.
   * @param {object} report - The report object.
   */
  async sendReportConfirmation(user, report) {
    const appName = process.env.APP_NAME || 'TypeAware';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return this.send(user.email, 'reportConfirmation', {
      firstName: user.firstName,
      appName,
      reportId: report._id,
      platform: report.platform,
      flagReason: report.flagReason,
      submittedAt: report.createdAt.toLocaleDateString(),
      dashboardUrl: `${appUrl}/dashboard`,
    });
  }

  /**
   * Sends an account suspension notification.
   * @param {object} user - The user object.
   * @param {string} reason - The reason for suspension.
   * @param {string} duration - The duration of the suspension.
   */
  async sendAccountSuspension(user, reason, duration) {
    const appName = process.env.APP_NAME || 'TypeAware';
    return this.send(user.email, 'accountSuspension', {
      firstName: user.firstName,
      appName,
      reason,
      duration,
      suspendedAt: new Date().toLocaleDateString(),
      supportEmail: process.env.SUPPORT_EMAIL || 'support@typeaware.com',
    });
  }

  /**
   * Sends a weekly summary email.
   * @param {object} user - The user object.
   * @param {object} stats - The weekly stats object.
   */
  async sendWeeklySummary(user, stats) {
    const appName = process.env.APP_NAME || 'TypeAware';
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    return this.send(user.email, 'weeklySummary', {
      firstName: user.firstName,
      appName,
      weekStart: stats.weekStart,
      weekEnd: stats.weekEnd,
      reportsSubmitted: stats.reportsSubmitted,
      threatsDetected: stats.threatsDetected,
      platformsUsed: stats.platformsUsed,
      totalScanned: stats.totalScanned,
      dashboardUrl: `${appUrl}/dashboard`,
      unsubscribeUrl: `${appUrl}/unsubscribe?token=${user.unsubscribeToken}`,
    });
  }

  /**
   * Sends emails in bulk to multiple recipients.
   * @param {Array<object>} recipients - Array of recipient objects, each with an email property.
   * @param {string} template - The name of the template to use.
   * @param {object} [data={}] - Common data for the template.
   * @returns {Promise<{success: boolean, total: number, successful: number, failed: number, results: Array<object>}>}
   */
  async sendBulkEmails(recipients, template, data = {}) {
    if (!this.isConfigured) {
      return { success: false, message: 'Email service not configured' };
    }

    const results = [];
    const batchSize = 10; // Send emails in batches to avoid rate limiting

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient =>
        this.send(recipient.email, template, { ...data, ...recipient })
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error sending bulk email batch:', error);
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      success: true,
      total: recipients.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Sends a test email to the configured SMTP user.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testEmailConfiguration() {
    if (!this.isConfigured) {
      return { success: false, message: 'Email service not configured' };
    }
    
    try {
      const testResult = await this.sendWelcomeEmail({
        email: this.config.auth.user,
        firstName: 'Test',
      });

      return {
        success: testResult.success,
        message: testResult.success ? 'Test email sent successfully' : testResult.message
      };
    } catch (error) {
      return {
        success: false,
        message: `Test email failed: ${error.message}`
      };
    }
  }

  /**
   * Get email service status.
   * @returns {object}
   */
  getServiceStatus() {
    const user = this.config.auth ? this.config.auth.user : undefined;
    return {
      configured: this.isConfigured,
      host: this.config.host || 'Not configured',
      port: this.config.port || 'Not configured',
      user: user ? `${user.substring(0, 3)}***` : 'Not configured'
    };
  }
}

// Create a configuration object from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  defaults: {
    from: `"${process.env.APP_NAME || 'TypeAware'}" <${process.env.SMTP_USER}>`,
  },
};

// Export a single, configured instance of the EmailService
module.exports = new EmailService(emailConfig);

