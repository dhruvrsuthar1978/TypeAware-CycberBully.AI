/* @ts-nocheck */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Extension = () => {
  const { toast } = useToast();

  const downloadExtension = () => {
    toast({
      title: "Extension Ready",
      description: "Extension files are being prepared for download..."
    });
    // In a real scenario, this would trigger a download of the extension zip
    console.log('Extension download initiated');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/30 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            TypeAware Browser Extension
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Enhance your browsing experience with real-time AI-powered content moderation across all websites.
          </p>
        </div>

        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Browser Extension
            </CardTitle>
            <CardDescription>
              Download our browser extension for real-time protection and safer browsing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              The TypeAware browser extension monitors and moderates content in real-time, helping you avoid harmful or toxic language while browsing the web.
            </p>
            <p className="mb-4 text-muted-foreground">
              🔹 Stay Protected Everywhere – Whether you’re on social media, chat platforms, or forums, TypeAware actively scans the text you type and the content you read.
            </p>
            <p className="mb-4 text-muted-foreground">
              🔹 Instant Detection & Alerts – Get notified immediately if harmful, offensive, or toxic language is detected in your conversations or feed.
            </p>
            <p className="mb-4 text-muted-foreground">
              🔹 Content Moderation on the Go – The extension highlights risky text, provides safer alternatives, and prevents unintentional use of abusive language.
            </p>
            <p className="mb-4 text-muted-foreground">
              🔹 Customizable Filters – Choose the level of sensitivity (mild, moderate, strict) based on your personal or organizational needs.
            </p>
            <p className="mb-4 text-muted-foreground">
              🔹 Lightweight & Secure – Runs smoothly in the background without slowing down your browsing. All checks are privacy-focused, ensuring your data remains safe.
            </p>
            <p className="mb-4 font-semibold text-foreground">
              👉 Download Now and make your browsing experience healthier, safer, and more respectful.
            </p>
            <Button 
              onClick={downloadExtension} 
              variant="premium" 
              size="lg" 
              className="min-w-[160px]"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Extension
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Extension;
