import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/enhanced-button';
import { 
  BarChart3, 
  Users, 
  AlertTriangle, 
  Shield,
  TrendingUp,
  FileText,
  Clock,
  Ban,
  Eye,
  CheckCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();

  const flaggedContent = [
    {
      id: 1,
      content: "This is really offensive content that was detected...",
      user: "user_abc123",
      site: "twitter.com",
      timestamp: "5 minutes ago",
      severity: "high",
      status: "pending"
    },
    {
      id: 2,
      content: "Spam message with multiple links and...",
      user: "user_def456", 
      site: "reddit.com",
      timestamp: "15 minutes ago",
      severity: "medium",
      status: "pending"
    },
    {
      id: 3,
      content: "Harassment towards another user about...",
      user: "user_ghi789",
      site: "facebook.com", 
      timestamp: "1 hour ago",
      severity: "high",
      status: "reviewed"
    }
  ];

  const topOffenders = [
    { user: "user_abc123", reports: 15, blocked: true },
    { user: "user_def456", reports: 12, blocked: false },
    { user: "user_ghi789", reports: 8, blocked: true },
    { user: "user_jkl012", reports: 6, blocked: false }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor system activity and moderate content across the platform.
        </p>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value="2,847"
          description="Active users"
          icon={Users}
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Pending Reports"
          value="23"
          description="Requires review"
          icon={AlertTriangle}
          variant="warning"
          trend={{ value: 8, isPositive: false }}
        />
        <StatCard
          title="Blocked Users"
          value="156"
          description="Currently blocked"
          icon={Ban}
          variant="destructive"
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Detection Rate"
          value="97.2%"
          description="System accuracy"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 1.2, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Flagged Content */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Flagged Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flaggedContent.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm mb-1 line-clamp-2">{item.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.user} • {item.site} • {item.timestamp}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 ml-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.severity === 'high' 
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {item.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'pending'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-secondary/10 text-secondary'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Review
                    </Button>
                    <Button size="sm" variant="destructive">
                      <Ban className="h-3 w-3 mr-1" />
                      Block
                    </Button>
                    <Button size="sm" variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Reports
            </Button>
          </CardContent>
        </Card>

        {/* Top Offenders */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Offenders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topOffenders.map((offender, index) => (
                <div key={offender.user} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{offender.user}</p>
                      <p className="text-xs text-muted-foreground">
                        {offender.reports} reports
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {offender.blocked ? (
                      <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded-full">
                        Blocked
                      </span>
                    ) : (
                      <Button size="sm" variant="destructive">
                        Block
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Users
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary mb-1">99.8%</div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">1.2s</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">45.2K</div>
              <div className="text-sm text-muted-foreground">Checks Today</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
