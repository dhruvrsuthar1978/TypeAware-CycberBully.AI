import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, Shield, Users } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Please read these terms carefully before using TypeAware services.
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Agreement to Terms */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Agreement to Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              By accessing and using TypeAware ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </CardContent>
        </Card>

        {/* Description of Service */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Description of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              TypeAware provides AI-powered content moderation and analysis services designed to help users identify potentially harmful or inappropriate content.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold">Our Services Include:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Real-time text analysis and toxicity detection
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Content safety scoring and recommendations
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Browser extensions and API integrations
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Analytics and reporting tools
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              User Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold">Account Responsibilities:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  You are responsible for safeguarding your account credentials
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  You agree not to disclose your password to any third party
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  You must notify us immediately of any unauthorized use of your account
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  You are responsible for all activities that occur under your account
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Acceptable Use */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Acceptable Use Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You agree to use our services only for lawful purposes and in accordance with these Terms.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold">You agree NOT to:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Use the service for any illegal or unauthorized purpose
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Attempt to gain unauthorized access to our systems
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Interfere with or disrupt the service or servers
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Use the service to transmit harmful or malicious content
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Violate any applicable laws or regulations
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Content and Privacy */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Content and Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold">Content Guidelines:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  You retain ownership of content you submit for analysis
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  We may use anonymized data to improve our AI models
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  We do not store personal messages without explicit consent
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Content analysis is performed locally when possible
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The Service and its original content, features, and functionality are and will remain the exclusive property of TypeAware and its licensors.
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold">Our Intellectual Property Includes:</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  AI models and algorithms developed by TypeAware
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Software, code, and technical implementations
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  Brand names, logos, and trademarks
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                  User interface designs and layouts
                </li>
              </ul>
            </div>

            <p className="text-muted-foreground">
              You are granted a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Termination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion,
              for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>

            <p className="text-muted-foreground">
              If you wish to terminate your account, you may simply discontinue using the Service.
            </p>

            <p className="text-muted-foreground">
              All provisions of the Terms which by their nature should survive termination shall survive, including, without limitation,
              ownership provisions, warranty disclaimers, and limitations of liability.
            </p>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Disclaimer of Warranties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, TypeAware:
            </p>

            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                Excludes all representations and warranties relating to this website and its contents
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                Does not guarantee the accuracy, completeness, or reliability of AI analysis results
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                Is not responsible for any damages arising from the use of our services
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-primary rounded-full mt-2" />
                Does not warrant that the service will be uninterrupted or error-free
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Limitations of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              In no event shall TypeAware, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect,
              incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill,
              or other intangible losses, resulting from your use of the Service.
            </p>

            <p className="text-muted-foreground">
              Our total liability for any claim arising out of or relating to these Terms or our services shall not exceed the amount
              paid by you for the services in the twelve months preceding the claim.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Governing Law</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              These Terms shall be interpreted and governed by the laws of the State of California, United States,
              without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms
              will not be considered a waiver of those rights.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
              If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              What constitutes a material change will be determined at our sole discretion.
            </p>

            <p className="text-muted-foreground">
              By continuing to access or use our Service after any revisions become effective,
              you agree to be bound by the revised terms.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Email:</strong> legal@typeaware.com</p>
              <p><strong>Address:</strong> 123 Tech Street, San Francisco, CA 94105, United States</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
