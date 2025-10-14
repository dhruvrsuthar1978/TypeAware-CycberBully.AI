# TypeAware Extension Deployment Guide

## Overview
TypeAware is an AI-powered browser extension for content moderation that detects harmful content across social media platforms including Twitter/X, YouTube, Reddit, Facebook, and Instagram.

## Features
- **Real-time Content Detection**: Analyzes text content for profanity, harassment, cyberbullying, threats, and hate speech
- **AI-Powered Analysis**: Uses advanced AI models for accurate content classification
- **Obfuscation Detection**: Identifies leetspeak and other text obfuscation techniques
- **Rephrasing Suggestions**: Provides constructive alternatives for flagged content
- **Cross-Platform Support**: Works on major social media platforms
- **Privacy-Focused**: Processes content locally and securely

## Deployment Steps

### 1. Chrome Web Store Deployment

#### Prerequisites
- Google Developer Account ($5 one-time fee)
- Extension ZIP file: `typeaware-extension-v1.0.0.zip`
- High-quality screenshots and promotional images
- Detailed description and privacy policy

#### Steps
1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Click "Add a new item"
3. Upload the `typeaware-extension-v1.0.0.zip` file
4. Fill in extension details:
   - Name: TypeAware
   - Description: AI-powered content moderation for safer online spaces
   - Category: Productivity
   - Languages: English
5. Upload store assets:
   - Icon (128x128 PNG)
   - Screenshots (1280x800 PNG, at least 3)
   - Promotional images
6. Set pricing (Free)
7. Add privacy policy URL
8. Submit for review

#### Review Process
- Initial review: 1-2 weeks
- Updates: 1-3 days
- Common rejection reasons:
  - Missing permissions justification
  - Inadequate privacy policy
  - Poor quality assets

### 2. Firefox Add-ons Deployment

#### Prerequisites
- Mozilla Developer Account (Free)
- Extension ZIP file (same as Chrome)
- Firefox-compatible manifest adjustments

#### Steps
1. Go to [Firefox Add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/)
2. Click "Submit a New Add-on"
3. Upload the extension ZIP
4. Fill in details similar to Chrome
5. Submit for review

### 3. Edge Add-ons Deployment

#### Prerequisites
- Microsoft Developer Account (Free)
- Same ZIP file works for Edge

#### Steps
1. Go to [Microsoft Edge Add-ons](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview)
2. Submit your extension
3. Follow the submission process

## Backend Deployment

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Render.com or similar hosting service
- Domain name (optional)

### Environment Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   NODE_ENV=production
   PORT=5000
   ```

### Database Setup
1. Create MongoDB Atlas cluster
2. Set up database user with read/write permissions
3. Whitelist IP addresses (0.0.0.0/0 for development)
4. Run database setup scripts:
   ```bash
   node scripts/setupDatabase.js
   node scripts/createAdminUser.js
   ```

### Production Deployment
1. Use Render.com for hosting:
   - Connect GitHub repository
   - Set build command: `npm install`
   - Set start command: `node server.js`
   - Add environment variables
   - Deploy

2. Alternative: Heroku, DigitalOcean, AWS

## Frontend Deployment

### Prerequisites
- Vercel account (Free)
- Domain name (optional)

### Deployment Steps
1. Connect GitHub repository to Vercel
2. Set build settings:
   - Framework: Vite
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```
4. Deploy

## Post-Deployment Checklist

### Extension
- [ ] Extension published on Chrome Web Store
- [ ] Extension published on Firefox Add-ons
- [ ] Extension published on Edge Add-ons
- [ ] Store listings optimized with keywords
- [ ] User reviews monitored
- [ ] Update process documented

### Backend
- [ ] API endpoints responding correctly
- [ ] Database connections stable
- [ ] Error logging configured
- [ ] SSL certificate valid
- [ ] Rate limiting active
- [ ] CORS properly configured

### Frontend
- [ ] Website loading correctly
- [ ] API calls working
- [ ] Responsive design verified
- [ ] SSL certificate valid
- [ ] Analytics configured

## Monitoring & Maintenance

### Analytics
- Track extension installations
- Monitor API usage
- User engagement metrics
- Content detection statistics

### Updates
- Regular security updates
- Feature enhancements
- Bug fixes
- Performance optimizations

### Support
- User feedback collection
- Issue tracking
- Documentation updates

## Security Considerations

### Extension Security
- Content Security Policy properly configured
- Minimal permissions requested
- No external script loading
- Secure API communication

### Backend Security
- Input validation and sanitization
- Rate limiting implemented
- Authentication required for sensitive endpoints
- HTTPS enforced
- Regular security audits

### Data Privacy
- GDPR compliance
- Clear privacy policy
- Data retention policies
- User data protection

## Troubleshooting

### Common Issues
1. **Extension not loading**: Check manifest.json syntax
2. **API connection failed**: Verify CORS settings and API URLs
3. **Content not detecting**: Check AI service status
4. **Database connection issues**: Verify MongoDB credentials

### Support Resources
- Chrome Web Store developer documentation
- Mozilla Add-ons documentation
- Render deployment guides
- Vercel deployment documentation

## Version History

### v1.0.0 (Current)
- Initial release
- AI-powered content detection
- Multi-platform support
- Real-time analysis
- Extension popup interface

---

For additional support or questions, please refer to the project documentation or create an issue in the repository.
