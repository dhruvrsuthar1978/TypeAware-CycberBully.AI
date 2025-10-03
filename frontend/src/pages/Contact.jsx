import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get in touch with our team. We're here to help you with any questions about TypeAware.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Get In Touch
              </CardTitle>
              <CardDescription>
                Reach out to us through any of these channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-muted-foreground">support@typeaware.com</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Phone</p>
                  <p className="text-muted-foreground">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-muted-foreground">
                    123 Tech Street<br />
                    San Francisco, CA 94105<br />
                    United States
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Business Hours</p>
                  <p className="text-muted-foreground">
                    Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                    Saturday - Sunday: Closed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="How can we help you?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Tell us more about your inquiry..."
                />
              </div>

              <Button className="w-full">
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Quick answers to common questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">How does TypeAware work?</h4>
              <p className="text-muted-foreground">
                TypeAware uses advanced AI algorithms to analyze text in real-time, detecting potential toxicity, harassment, and other harmful content before it's posted.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Is my data secure?</h4>
              <p className="text-muted-foreground">
                Yes, we take data security very seriously. All text analysis is performed locally when possible, and we never store your personal messages without explicit consent.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Do you offer enterprise solutions?</h4>
              <p className="text-muted-foreground">
                Absolutely! We provide custom enterprise solutions with advanced features, dedicated support, and integration options. Contact us for more information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;
