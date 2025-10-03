import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Overview */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Privacy Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              TypeAware is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
              By using TypeAware, you agree to the collection and use of information in accordance with this policy.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Information You Provide</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Account information (name, email, password) when you create an account
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Content you submit for analysis through our services
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Communications you send to us (support requests, feedback)
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Information We Collect Automatically</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Usage data (pages visited, features used, time spent)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Device information (IP address, browser type, operating system)
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Cookies and similar tracking technologies
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">We use the information we collect to:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Provide and maintain our services
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Process and analyze text content
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Improve our AI models and algorithms
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Communicate with you about our services
                </li>
              </ul>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Ensure security and prevent fraud
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Comply with legal obligations
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Provide customer support
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Analyze usage patterns and trends
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold">Our Security Measures Include:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Encryption of data in transit and at rest
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Regular security audits and updates
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Access controls and authentication requirements
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Secure data centers and infrastructure
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Information Sharing and Disclosure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold">We may share your information in the following circumstances:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  With service providers who assist us in operating our platform
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  When required by law or to protect our rights
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  In connection with a business transfer or acquisition
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  With your explicit consent
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You have certain rights regarding your personal information. Depending on your location, you may have the following rights:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Access to your personal information
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Correction of inaccurate information
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Deletion of your personal information
                </li>
              </ul>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Restriction of processing
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Data portability
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Objection to processing
                </li>
              </ul>
            </div>

            <p className="text-muted-foreground">
              To exercise these rights, please contact us at privacy@typeaware.com.
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Cookies and Tracking Technologies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We use cookies and similar tracking technologies to enhance your experience with our services.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold">Types of Cookies We Use:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  <strong>Essential Cookies:</strong> Required for the website to function properly
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  <strong>Analytics Cookies:</strong> Help us understand how you use our services
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  <strong>Preference Cookies:</strong> Remember your settings and preferences
                </li>
              </ul>
            </div>

            <p className="text-muted-foreground">
              You can control cookies through your browser settings. However, disabling certain cookies may affect the functionality of our services.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Contact Us About Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Email:</strong> privacy@typeaware.com</p>
              <p><strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105, United States</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>

        {/* Updates */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              We encourage you to review this Privacy Policy periodically for any changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
