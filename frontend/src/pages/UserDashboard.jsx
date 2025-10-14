import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, Tooltip, Legend } from 'recharts';
import { Shield, Eye, Flag, Calendar, AlertTriangle, CheckCircle, Clock, ExternalLink, Star, ThumbsUp, Lightbulb, Settings, Activity, TrendingUp, Zap, Download, FileText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const safetyTips = [
  "Did you know? Cyberbullies often use sarcasm. Our AI is trained to detect sarcastic intent.",
  "Tip: Use positive language to reduce misunderstandings online.",
  "Remember: Reporting harmful content helps keep the community safe.",
  "Stay aware: Our extension protects you in real-time across platforms."
];

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
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
  const [extensionStats, setExtensionStats] = useState({
    extensionActive: false,
    extensionVersion: null,
    lastPing: null,
    extensionReports: 0,
    extensionSettings: {},
    extensionActivity: []
  });

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

        // Fetch extension stats
        const extensionStatsResponse = await fetch('http://localhost:5000/api/extension/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-uuid': user?.uuid || 'unknown'
          }
        });

        if (extensionStatsResponse.ok) {
          const extensionData = await extensionStatsResponse.json();
          setExtensionStats({
            extensionActive: extensionData.extensionActive || false,
            extensionVersion: extensionData.extensionVersion || null,
            lastPing: extensionData.lastPing ? new Date(extensionData.lastPing) : null,
            extensionReports: extensionData.extensionReports || 0,
            extensionSettings: extensionData.extensionSettings || {},
            extensionActivity: extensionData.extensionActivity || []
          });
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
      {/* Hero Section - Modern Aurora Design */}
      <section className="relative overflow-hidden bg-gradient-aurora py-16 px-4 mb-8">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative group">
              <Shield className="h-12 w-12 text-white relative z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-white/40 rounded-full blur-xl animate-pulse-glow"></div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-white animate-fade-in">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-white/90 text-lg mt-2">Your personal safety dashboard</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* At-a-Glance Metrics - Modern Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Messages Scanned</p>
                  <p className="text-3xl font-bold text-foreground mb-1">{userStats.messagesScanned.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Since {userStats.accountCreated.toLocaleDateString()}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Eye className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Threats Detected</p>
                  <p className="text-3xl font-bold text-foreground mb-1">{userStats.threatsDetected}</p>
                  <p className="text-xs text-muted-foreground">Potential harm prevented</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-security/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Reports Submitted</p>
                  <p className="text-3xl font-bold text-foreground mb-1">{userStats.reportsSubmitted + extensionStats.extensionReports}</p>
                  <p className="text-xs text-muted-foreground">Helping keep community safe</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-security flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Flag className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Positivity Score</p>
                  <p className="text-3xl font-bold text-foreground mb-1">{userStats.positivityScore}%</p>
                  <p className="text-xs text-muted-foreground">Clean communication rate</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Star className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Panels - Glass Morphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card-strong hover-lift border-white/30 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-security/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-lg">Extension Status</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${extensionStats.extensionActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs font-medium ${extensionStats.extensionActive ? 'text-green-600' : 'text-red-600'}`}>
                    {extensionStats.extensionActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {extensionStats.extensionActive
                  ? `Browser extension v${extensionStats.extensionVersion} is protecting you in real-time`
                  : 'Browser extension is not active. Install and enable it for real-time protection.'
                }
              </p>
              <Button variant="outline" size="sm" className="w-full hover-scale" onClick={() => navigate('/extension')}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Extension
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card-strong hover-lift border-white/30 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground text-lg">Quick Settings</h3>
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Sensitivity Level</label>
                <select className="w-full border border-border rounded-lg p-2 bg-background/50 backdrop-blur-sm hover:border-primary transition-colors" defaultValue="medium" aria-label="Sensitivity Level">
                  <option value="low">Low (only severe language)</option>
                  <option value="medium">Medium (balanced)</option>
                  <option value="high">High (flags mild toxicity)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full hover-scale"
                  onClick={() => navigate('/settings')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Open Settings
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full hover-scale bg-primary text-white hover:bg-primary/90 hover:text-white"
                  onClick={() => {
                    // Add settings update logic here
                    toast({
                      title: "Settings Updated",
                      description: "Your settings have been saved successfully.",
                      variant: "success"
                    });
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Update Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-strong hover-lift border-white/30 overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-lg">Safety Tips</h3>
                <Lightbulb className="h-5 w-5 text-warning" />
              </div>
              <p className="text-sm text-muted-foreground mb-4 min-h-[3rem]">{safetyTips[selectedTipIndex]}</p>
              <Button variant="outline" size="sm" className="w-full hover-scale" onClick={() => {
                console.log('Learn More button clicked, navigating to /learn-more');
                navigate('/learn-more');
              }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Learn More
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Data Visualization & History */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Threat Detection Trends Chart */}
          <Card className="hover-lift border-0 bg-gradient-card shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-6 w-6 text-primary" />
                Threat Detection Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyActivity}>
                    <defs>
                      <linearGradient id="colorScanned" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDetected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                        boxShadow: 'var(--shadow-card)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="scanned" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }}
                      name="Messages Scanned"
                      fill="url(#colorScanned)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="detected" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                      name="Threats Detected"
                      fill="url(#colorDetected)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="hover-lift border-0 bg-gradient-card shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="h-6 w-6 text-security" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover-scale"
                  onClick={() => navigate('/reports')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Report
                </Button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {[...userAbuseHistory, ...extensionStats.extensionActivity].slice(0, 10).map((report, index) => (
                  <div key={report.id || `extension-${index}`} className="group relative">
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 rounded-xl transition-opacity"></div>
                    <div className="relative flex items-start space-x-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-smooth border border-transparent hover:border-primary/20">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                        {report.status === 'Resolved' ? <CheckCircle className="h-5 w-5 text-white" /> : report.status === 'Pending' ? <Clock className="h-5 w-5 text-white" /> : <AlertTriangle className="h-5 w-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-foreground">{report.platform || 'Extension'} Report</p>
                          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                            report.status === 'Resolved' ? 'bg-security/20 text-security' :
                            report.status === 'Pending' ? 'bg-warning/20 text-warning' :
                            'bg-primary/20 text-primary'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {report.status === 'Resolved' ? 'Threat successfully addressed and removed' :
                           report.status === 'Pending' ? 'Report submitted and under review' :
                           'New report flagged for investigation'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-danger/20 text-danger px-2 py-1 rounded-full font-medium">
                            {report.reason}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Abuse History Table */}
        <Card className="mt-8 hover-lift border-0 bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl">
                <Shield className="h-6 w-6 text-primary" />
                Abuse History
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover-scale text-danger hover:text-danger hover:bg-danger/10"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to clear your history? This action cannot be undone.')) {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('http://localhost:5000/api/reports/clear', {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });

                        if (response.ok) {
                          setUserAbuseHistory([]);
                          toast({
                            title: "History Cleared",
                            description: "Your abuse history has been successfully cleared.",
                            variant: "success"
                          });
                        } else {
                          throw new Error('Failed to clear history');
                        }
                      } catch (error) {
                        console.error('Error clearing history:', error);
                        toast({
                          title: "Error",
                          description: "Failed to clear history. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover-scale"
                  onClick={() => {
                    try {
                      const data = userAbuseHistory.map(report => ({
                        platform: report.platform,
                        content: report.content,
                        reason: report.reason,
                        status: report.status,
                        date: new Date(report.timestamp).toLocaleDateString()
                      }));
                      
                      const csvContent = "data:text/csv;charset=utf-8," + 
                        "Platform,Content,Reason,Status,Date\n" +
                        data.map(row => Object.values(row).join(",")).join("\n");
                      
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", "abuse_history.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      toast({
                        title: "Export Successful",
                        description: "Your data has been exported to 'abuse_history.csv'",
                        variant: "success"
                      });
                    } catch (error) {
                      console.error('Error exporting data:', error);
                      toast({
                        title: "Export Failed",
                        description: "Failed to export data. Please try again.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Platform</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Original Content</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Reason</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {[...userAbuseHistory, ...extensionStats.extensionActivity].map((report, index) => (
                    <tr key={report.id || `extension-${index}`} className="border-b border-border/50 hover:bg-primary/5 transition-smooth cursor-pointer group" onClick={() => alert(`Original: ${report.content}\nReason: ${report.reason}`)}>
                      <td className="py-4 px-4">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">{report.platform || 'Extension'}</span>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {report.content.replace(/.(?=.{4,}$)/g, '*')}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs bg-danger/20 text-danger px-3 py-1.5 rounded-full font-medium">
                          {report.reason}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className={`flex items-center space-x-2 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="text-sm font-medium">{report.status}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
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