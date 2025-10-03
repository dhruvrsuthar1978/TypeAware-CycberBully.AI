import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Shield, Eye, Flag, Calendar, AlertTriangle, CheckCircle, Clock, ExternalLink, Star, ThumbsUp, Lightbulb, Settings, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const safetyTips = [
  "Did you know? Cyberbullies often use sarcasm. Our AI is trained to detect sarcastic intent.",
  "Tip: Use positive language to reduce misunderstandings online.",
  "Remember: Reporting harmful content helps keep the community safe.",
  "Stay aware: Our extension protects you in real-time across platforms."
];

const UserDashboard = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    messagesScanned: 0,
    threatsDetected: 0,
    reportsSubmitted: 0,
    positivityScore: 98,
    accountCreated: new Date()
  });
  const [userAbuseHistory, setUserAbuseHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTipIndex, setSelectedTipIndex] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch user analytics
        const analyticsResponse = await fetch('http://localhost:5000/api/analytics/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setUserStats({
            messagesScanned: analyticsData.messagesScanned || 0,
            threatsDetected: analyticsData.threatsDetected || 0,
            reportsSubmitted: analyticsData.reportsSubmitted || 0,
            positivityScore: analyticsData.positivityScore || 98,
            accountCreated: new Date(analyticsData.accountCreated || Date.now())
          });
        }

        // Fetch user reports
        const reportsResponse = await fetch('http://localhost:5000/api/reports/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setUserAbuseHistory(reportsData.reports || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Rotate safety tips every 10 seconds
    const tipInterval = setInterval(() => {
      setSelectedTipIndex((prev) => (prev + 1) % safetyTips.length);
    }, 10000);

    return () => clearInterval(tipInterval);
  }, []);

  const monthlyActivity = [
    { month: 'Jul', scanned: 2100, detected: 45 },
    { month: 'Aug', scanned: 2400, detected: 52 },
    { month: 'Sep', scanned: 2800, detected: 38 },
    { month: 'Oct', scanned: 3200, detected: 41 },
    { month: 'Nov', scanned: 2900, detected: 29 },
    { month: 'Dec', scanned: 3100, detected: 33 }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return 'text-security';
      case 'Pending': return 'text-warning';
      case 'Under Review': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="h-4 w-4" />;
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'Under Review': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 bg-green-50 border border-green-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Eye className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-green-800">User Dashboard</h1>
          </div>
          <p className="text-green-700">Welcome back, {user?.name}! Here's your personal activity overview.</p>
        </div>

        {/* At-a-Glance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Messages Scanned</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.messagesScanned.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Since {userStats.accountCreated.toLocaleDateString()}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Eye className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Threats Detected</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.threatsDetected}</p>
                  <p className="text-xs text-muted-foreground">Potential harm prevented</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reports Submitted</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.reportsSubmitted}</p>
                  <p className="text-xs text-muted-foreground">Helping to keep the community safe</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-security/10 text-security flex items-center justify-center">
                  <Flag className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Positivity Score</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.positivityScore}% Safe</p>
                  <p className="text-xs text-muted-foreground">Based on rephrases and clean messages</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
                  <Star className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Extension Status</h3>
                <div className="w-3 h-3 rounded-full bg-security"></div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">Browser extension is active</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => window.open('chrome://extensions/', '_blank')}>
                Configure Extension
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Quick Settings</h3>
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Sensitivity Level</label>
                <select className="w-full border rounded p-2" defaultValue="medium" aria-label="Sensitivity Level">
                  <option value="low">Low (only severe language)</option>
                  <option value="medium">Medium (balanced)</option>
                  <option value="high">High (flags mild toxicity)</option>
                </select>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Open Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">Safety Tips</h3>
                <Lightbulb className="h-5 w-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{safetyTips[selectedTipIndex]}</p>
              <Button variant="outline" size="sm" className="w-full">
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Data Visualization & History */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Threat Detection Trends Chart */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Threat Detection Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      label={{ value: 'Number of Events', angle: -90, position: 'insideLeft' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="scanned" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={1}
                      dot={false}
                      name="Messages Scanned"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="detected" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      name="Threats Detected"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-security" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {userAbuseHistory.slice(0, 10).map((report) => (
                  <div key={report.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      {report.status === 'Resolved' ? <CheckCircle className="h-4 w-4" /> : report.status === 'Pending' ? <Clock className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">{report.platform} Report</p>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          report.status === 'Resolved' ? 'bg-security/10 text-security' :
                          report.status === 'Pending' ? 'bg-warning/10 text-warning' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {report.status === 'Resolved' ? 'Threat successfully addressed and removed' :
                         report.status === 'Pending' ? 'Report submitted and under review' :
                         'New report flagged for investigation'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-danger/10 text-danger px-2 py-1 rounded-full">
                          {report.reason}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abuse History Table */}
        <Card className="mt-8 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Abuse History
              </div>
              <Button variant="outline" size="sm">
                Export Data
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Platform</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Original Content</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reason</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userAbuseHistory.map((report) => (
                    <tr key={report.id} className="border-b border-border hover:bg-muted/30 transition-smooth cursor-pointer" onClick={() => alert(`Original: ${report.content}\nReason: ${report.reason}`)}>
                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{report.platform}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {report.content.replace(/.(?=.{4,}$)/g, '*')}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-danger/10 text-danger px-2 py-1 rounded-full">
                          {report.reason}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="text-sm font-medium">{report.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(report.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
