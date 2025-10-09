import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, LayoutDashboard, Users, Zap } from 'lucide-react';
import KpiCards from '@/components/dashboard/KpiCards';
import ModerationQueue from '@/components/dashboard/ModerationQueue';
import SystemAnalytics from '@/components/dashboard/SystemAnalytics';
import UserManagement from '@/components/dashboard/UserManagement';
import AiTools from '@/components/dashboard/AiTools';

const AdminDashboard = () => {
  const [demoMode] = useState(true);

  // Mock data for demo mode
  const mockData = {
    kpi: {
      pendingReports: 691,
      moderationActions: { total: 127, warnings: 85, bans: 42 },
      activeUsers: 8542,
    },
    reports: [
      {
        id: 'REP-001',
        userId: 'User1234',
        content: 'This is absolutely ridiculous! You people are all idiots!',
        reason: 'Harassment',
        severity: 'High',
        platform: 'Twitter',
        status: 'Pending',
      },
      {
        id: 'REP-002',
        userId: 'User5678',
        content: 'I hate this group and everyone in it. You all suck!',
        reason: 'Hate Speech',
        severity: 'Critical',
        platform: 'Facebook',
        status: 'Under Review',
      },
      {
        id: 'REP-003',
        userId: 'User9012',
        content: "You're so stupid, why would anyone follow you?",
        reason: 'Bullying',
        severity: 'Medium',
        platform: 'Instagram',
        status: 'Resolved',
      },
    ],
    abuseTypes: {
      Harassment: 45,
      'Hate Speech': 23,
      Bullying: 18,
      Spam: 8,
      Inappropriate: 6,
    },
    monthlyGrowth: [
      { month: 'Jan', reports: 120, users: 450 },
      { month: 'Feb', reports: 145, users: 520 },
      { month: 'Mar', reports: 168, users: 610 },
      { month: 'Apr', reports: 192, users: 680 },
      { month: 'May', reports: 215, users: 750 },
      { month: 'Jun', reports: 238, users: 820 },
    ],
    users: [
      {
        userId: 'User1234',
        totalReports: 12,
        riskLevel: 'High',
        status: 'Under Review',
        lastActive: '2024-01-15T10:30:00Z',
      },
      {
        userId: 'User5678',
        totalReports: 8,
        riskLevel: 'Medium',
        status: 'Active',
        lastActive: '2024-01-14T15:45:00Z',
      },
      {
        userId: 'User9012',
        totalReports: 5,
        riskLevel: 'Low',
        status: 'Active',
        lastActive: '2024-01-13T09:20:00Z',
      },
    ],
  };

  const handleReportAction = (reportId, action) => {
    alert(`Action "${action}" on report ${reportId} triggered.`);
  };

  const handleUserAction = (userId, action) => {
    alert(`Action "${action}" on user ${userId} triggered.`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Modern Aurora Design */}
      <section className="relative overflow-hidden bg-gradient-aurora py-16 px-4 mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-pattern-grid opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Shield className="h-14 w-14 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-white/40 rounded-full blur-xl animate-pulse-glow"></div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white animate-fade-in">
                  Admin Dashboard
                </h1>
                <p className="text-white/90 text-lg mt-2">System monitoring and moderation control</p>
              </div>
            </div>
            {demoMode && (
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-xl px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors">
                Demo Mode
              </Badge>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl bg-muted/50 backdrop-blur-sm p-1.5 text-muted-foreground border border-border/50 shadow-card">
            <TabsTrigger 
              value="overview" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted/80"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="user-management"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted/80"
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger 
              value="ai-tools"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-muted/80"
            >
              <Zap className="h-4 w-4 mr-2" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-fade-in">
            <KpiCards
              pendingReports={mockData.kpi.pendingReports}
              moderationActions={mockData.kpi.moderationActions}
              activeUsers={mockData.kpi.activeUsers}
            />
            <ModerationQueue reports={mockData.reports} onAction={handleReportAction} />
            <SystemAnalytics abuseTypes={mockData.abuseTypes} monthlyGrowth={mockData.monthlyGrowth} />
          </TabsContent>

          <TabsContent value="user-management" className="animate-fade-in">
            <UserManagement users={mockData.users} onAction={handleUserAction} />
          </TabsContent>

          <TabsContent value="ai-tools" className="animate-fade-in">
            <AiTools />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;