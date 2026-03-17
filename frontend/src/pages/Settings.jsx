import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  User, Bell, Shield, Palette, Save, ChevronRight, CheckCircle,
  Mail, Phone, Globe, Key, Eye, EyeOff, Trash2, Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User,    desc: 'Personal information' },
  { id: 'notifications', label: 'Notifications',  icon: Bell,    desc: 'Alert preferences' },
  { id: 'privacy',       label: 'Privacy',        icon: Shield,  desc: 'Data & security' },
  { id: 'appearance',    label: 'Appearance',     icon: Palette, desc: 'Theme & language' },
];

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: '', bio: '' });
  const [notifications, setNotifications] = useState({ emailAlerts: true, pushNotifications: true, weeklyReports: false, threatAlerts: true, digestEmails: false });
  const [privacy, setPrivacy] = useState({ dataSharing: false, analytics: true, publicProfile: false, twoFactor: false });
  const [appearance, setAppearance] = useState({ theme: 'system', language: 'en', density: 'comfortable' });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    toast({ title: 'Settings saved', description: 'Your preferences have been updated.' });
  };

  const ToggleRow = ({ label, description, checked, onChange, badgeText }) => (
    <div className="flex items-center justify-between py-4">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Label className="font-medium">{label}</Label>
          {badgeText && <Badge variant="secondary" className="text-xs px-2 py-0">{badgeText}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* ── Aurora header ─────────────────────────────────── */}
      <div className="relative bg-gradient-aurora py-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-pattern-dots opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <User className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Account Settings</h1>
              <p className="text-white/80 mt-1">Manage your profile, notifications, and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar ───────────────────────────────────── */}
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="border-border/50 shadow-card sticky top-24">
              <CardContent className="p-3">
                <nav className="space-y-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                        activeTab === tab.id
                          ? 'bg-gradient-primary text-white shadow-card'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`}
                    >
                      <tab.icon className={`h-4 w-4 flex-shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tab.label}</p>
                        <p className={`text-xs truncate ${activeTab === tab.id ? 'text-white/70' : 'text-muted-foreground'}`}>{tab.desc}</p>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${activeTab === tab.id ? 'text-white rotate-90' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    </button>
                  ))}
                </nav>

                <Separator className="my-3" />

                {/* Danger zone mini */}
                <button
                  onClick={() => toast({ variant: 'destructive', title: 'Export started', description: 'Your data export will arrive by email.' })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all text-sm group"
                >
                  <Download className="h-4 w-4 group-hover:text-primary transition-colors" />
                  Export My Data
                </button>
              </CardContent>
            </Card>
          </aside>

          {/* ── Content ───────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <Card className="border-border/50 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your name, email, and profile details</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/40 border border-border/50">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold font-display shadow-lg">
                        {(user?.name?.[0] || 'U').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{user?.name || 'User'}</p>
                        <p className="text-sm text-muted-foreground">{user?.email || 'user@example.com'}</p>
                        <Badge className="mt-1 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                          {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="pl-10" placeholder="Your full name" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="pl-10" placeholder="your@email.com" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="pl-10" placeholder="+1 (555) 000-0000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Short Bio</Label>
                        <Input id="bio" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Community manager at..." />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <Key className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Update Password</Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <Card className="border-border/50 shadow-card animate-fade-in">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Decide how and when TypeAware contacts you</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="divide-y divide-border/50">
                  <ToggleRow label="Email Alerts" description="Receive email notifications for important security updates" checked={notifications.emailAlerts} onChange={(v) => setNotifications({ ...notifications, emailAlerts: v })} />
                  <ToggleRow label="Push Notifications" description="Get real-time push notifications on your device" checked={notifications.pushNotifications} onChange={(v) => setNotifications({ ...notifications, pushNotifications: v })} />
                  <ToggleRow label="Threat Alerts" description="Immediate alerts when high-severity threats are detected" checked={notifications.threatAlerts} onChange={(v) => setNotifications({ ...notifications, threatAlerts: v })} badgeText="Recommended" />
                  <ToggleRow label="Weekly Reports" description="Receive a weekly summary of your safety activity" checked={notifications.weeklyReports} onChange={(v) => setNotifications({ ...notifications, weeklyReports: v })} />
                  <ToggleRow label="Digest Emails" description="Daily digest of flagged content across your platforms" checked={notifications.digestEmails} onChange={(v) => setNotifications({ ...notifications, digestEmails: v })} />
                </CardContent>
              </Card>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fade-in">
                <Card className="border-border/50 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle>Privacy & Security</CardTitle>
                        <CardDescription>Control how your data is used and secured</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="divide-y divide-border/50">
                    <ToggleRow label="Two-Factor Authentication" description="Add an extra layer of security to your account" checked={privacy.twoFactor} onChange={(v) => setPrivacy({ ...privacy, twoFactor: v })} badgeText="Recommended" />
                    <ToggleRow label="Public Profile" description="Allow other users to see your TypeAware profile" checked={privacy.publicProfile} onChange={(v) => setPrivacy({ ...privacy, publicProfile: v })} />
                    <ToggleRow label="Usage Analytics" description="Help us improve TypeAware by sharing anonymous usage data" checked={privacy.analytics} onChange={(v) => setPrivacy({ ...privacy, analytics: v })} />
                    <ToggleRow label="Anonymized Data Sharing" description="Contribute anonymized threat data to improve community safety" checked={privacy.dataSharing} onChange={(v) => setPrivacy({ ...privacy, dataSharing: v })} />
                  </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-900/50 shadow-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                        <Trash2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                        <CardDescription>Irreversible account actions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                      <div>
                        <p className="font-medium text-sm">Delete All Reports</p>
                        <p className="text-xs text-muted-foreground">Permanently delete your abuse report history</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">Clear History</Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                      <div>
                        <p className="font-medium text-sm">Delete Account</p>
                        <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">Delete Account</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <Card className="border-border/50 shadow-card animate-fade-in">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>Customise how TypeAware looks and feels</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select value={appearance.theme} onValueChange={(v) => setAppearance({ ...appearance, theme: v })}>
                        <SelectTrigger><SelectValue placeholder="Select theme" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">☀️  Light</SelectItem>
                          <SelectItem value="dark">🌙  Dark</SelectItem>
                          <SelectItem value="system">💻  System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select value={appearance.language} onValueChange={(v) => setAppearance({ ...appearance, language: v })}>
                        <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">🇬🇧  English</SelectItem>
                          <SelectItem value="es">🇪🇸  Spanish</SelectItem>
                          <SelectItem value="fr">🇫🇷  French</SelectItem>
                          <SelectItem value="de">🇩🇪  German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Density</Label>
                      <Select value={appearance.density} onValueChange={(v) => setAppearance({ ...appearance, density: v })}>
                        <SelectTrigger><SelectValue placeholder="Layout density" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comfortable">Comfortable</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save bar */}
            <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground">
                {saved ? (
                  <span className="flex items-center gap-2 text-emerald-600 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Settings saved successfully
                  </span>
                ) : 'Changes are not saved yet'}
              </p>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
