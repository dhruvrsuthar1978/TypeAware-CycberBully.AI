import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/enhanced-button';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Clock,
  FileText,
  Download,
  Settings
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();

  const recentReports = [
    {
      id: 1,
      content: "Inappropriate comment detected",
      site: "twitter.com",
      timestamp: "2 hours ago",
      status: "blocked"
    },
    {
      id: 2,
      content: "Harassment detected",
      site: "reddit.com", 
      timestamp: "5 hours ago",
      status: "reported"
    },
    {
      id: 3,
      content: "Spam detected",
      site: "facebook.com",
      timestamp: "1 day ago", 
      status: "blocked"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your TypeAware protection activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Reports"
          value="47"
          description="This month"
          icon={FileText}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Blocked Users"
          value="8"
          description="Currently blocked"
          icon={Shield}
          variant="warning"
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="Protected Time"
          value="156h"
          description="Safe browsing time"
          icon={Clock}
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Detection Rate"
          value="94%"
          description="Accuracy this month"
          icon={TrendingUp}
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{report.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.site} • {report.timestamp}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    report.status === 'blocked' 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Extension Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Extension Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Browser Extension</span>
                <span className="px-2 py-1 text-xs bg-secondary/10 text-secondary rounded-full">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Protection Level</span>
                <span className="text-sm font-medium">High</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auto-blocking</span>
                <span className="px-2 py-1 text-xs bg-secondary/10 text-secondary rounded-full">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Updated</span>
                <span className="text-sm text-muted-foreground">2 days ago</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-card mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              Export Reports
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              Manage Blocks
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
