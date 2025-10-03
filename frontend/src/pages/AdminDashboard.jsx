/* @ts-nocheck */
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Shield, Users, Flag, TrendingUp, AlertTriangle, CheckCircle, Clock, Ban, Eye, Filter, Download, Search, Play, TestTube, Zap, Inbox, Gavel, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterModerator, setFilterModerator] = useState('all');
  const [filterReportType, setFilterReportType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReports, setSelectedReports] = useState([]);
  const [systemAnalytics, setSystemAnalytics] = useState({
    totalUsers: 0,
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    abuseTypes: {},
    platforms: {},
    monthlyGrowth: []
  });
  const [recentReports, setRecentReports] = useState([]);
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  // AI Testing states
  const [testText, setTestText] = useState('');
  const [aiResults, setAiResults] = useState(null);
  const [rephraseSuggestions, setRephraseSuggestions] = useState([]);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  // Mock data for demo mode
  const mockData = {
    systemAnalytics: {
      totalUsers: 15420,
      totalReports: 2847,
      resolvedReports: 2156,
      pendingReports: 691,
      abuseTypes: {
        'Harassment': 45,
        'Hate Speech': 23,
        'Bullying': 18,
        'Spam': 8,
        'Inappropriate': 6
      },
      platforms: {
        'Twitter': 35,
        'Facebook': 28,
        'Instagram': 22,
        'Discord': 10,
        'Reddit': 5
      },
      monthlyGrowth: [
        { month: 'Jan', reports: 120, users: 450 },
        { month: 'Feb', reports: 145, users: 520 },
        { month: 'Mar', reports: 168, users: 610 },
        { month: 'Apr', reports: 192, users: 680 },
        { month: 'May', reports: 215, users: 750 },
        { month: 'Jun', reports: 238, users: 820 }
      ]
    },
    recentReports: [
      {
        id: 'REP-001',
        userUuid: '550e8400-e29b-41d4-a716-446655440001',
        platform: 'Twitter',
        content: 'This is absolutely ridiculous! You people are all idiots!',
        reason: 'Harassment',
        severity: 'High',
        status: 'Pending'
      },
      {
        id: 'REP-002',
        userUuid: '550e8400-e29b-41d4-a716-446655440002',
        platform: 'Facebook',
        content: 'I hate this group and everyone in it. You all suck!',
        reason: 'Hate Speech',
        severity: 'Critical',
        status: 'Under Review'
      },
      {
        id: 'REP-003',
        userUuid: '550e8400-e29b-41d4-a716-446655440003',
        platform: 'Instagram',
        content: 'You\'re so stupid, why would anyone follow you?',
        reason: 'Bullying',
        severity: 'Medium',
        status: 'Resolved'
      }
    ],
    flaggedUsers: [
      {
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        reportsCount: 12,
        platforms: ['Twitter', 'Facebook'],
        riskLevel: 'High',
        status: 'Under Review',
        lastActivity: '2024-01-15T10:30:00Z'
      },
      {
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        reportsCount: 8,
        platforms: ['Instagram', 'Discord'],
        riskLevel: 'Medium',
        status: 'Active',
        lastActivity: '2024-01-14T15:45:00Z'
      },
      {
        uuid: '550e8400-e29b-41d4-a716-446655440003',
        reportsCount: 5,
        platforms: ['Twitter'],
        riskLevel: 'Low',
        status: 'Active',
        lastActivity: '2024-01-13T09:20:00Z'
      }
    ]
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // No token, switch to demo mode
          setDemoMode(true);
          setSystemAnalytics(mockData.systemAnalytics);
          setRecentReports(mockData.recentReports);
          setFlaggedUsers(mockData.flaggedUsers);
          setLoading(false);
          return;
        }

        // Try to fetch real data
        // Fetch system analytics
        const analyticsResponse = await fetch('http://localhost:5000/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setSystemAnalytics(analyticsData);
        }

        // Fetch recent reports
        const reportsResponse = await fetch('http://localhost:5000/api/admin/reports', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setRecentReports(reportsData.reports || []);
        }

        // Fetch flagged users
        const usersResponse = await fetch('http://localhost:5000/api/admin/flagged-users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setFlaggedUsers(usersData.users || []);
        }
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        // Fallback to demo mode
        setDemoMode(true);
        setSystemAnalytics(mockData.systemAnalytics);
        setRecentReports(mockData.recentReports);
        setFlaggedUsers(mockData.flaggedUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // AI Testing functions
  const testAI = async () => {
    if (!testText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to test",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: testText })
      });
      const data = await response.json();
      setAiResults(data);
      setRephraseSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('AI test failed:', error);
      toast({
        title: "Error",
        description: "Failed to test AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  // Filter functions
  const filteredReports = recentReports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status.toLowerCase() === filterStatus;
    const matchesModerator = filterModerator === 'all' || (report.assignedModerator && report.assignedModerator.toLowerCase() === filterModerator);
    const matchesReportType = filterReportType === 'all' || report.reason.toLowerCase() === filterReportType;
    const matchesSearch = searchTerm === '' ||
      report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.platform.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesModerator && matchesReportType && matchesSearch;
  });

  // Bulk actions
  const handleSelectReport = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReports.length === filteredReports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(filteredReports.map(report => report.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReports.length === 0) return;

    try {
      const response = await fetch('http://localhost:5000/api/admin/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, reportIds: selectedReports })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Bulk ${action} completed for ${selectedReports.length} reports`,
        });
        setSelectedReports([]);
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    }
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-white/90">System overview and management tools</p>
          {demoMode && (
            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">Demo Mode</Badge>
          )}
        </div>

        {/* High-Level KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover-lift cursor-pointer" onClick={() => window.location.href = '/admin/moderation'}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Reports</p>
                  <p className={`text-3xl font-bold ${systemAnalytics.pendingReports > 50 ? 'text-red-600' : systemAnalytics.pendingReports > 10 ? 'text-yellow-600' : 'text-foreground'}`}>{systemAnalytics.pendingReports}</p>
                </div>
                <Inbox className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Moderation Actions (24h)</p>
                  <p className="text-2xl font-bold text-foreground">127</p>
                  <p className="text-xs text-muted-foreground">85 warnings, 42 bans</p>
                </div>
                <Gavel className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users (24h)</p>
                  <p className="text-2xl font-bold text-foreground">8,542</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Status</p>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>API: Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Database: Healthy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span>AI Service: Degraded</span>
                    </div>
                  </div>
                </div>
                <Server className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Moderation Queue */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Moderation Queue
              </span>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under review">Under Review</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={filterModerator}
                  onChange={(e) => setFilterModerator(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Moderators</option>
                  <option value="me">Assigned to Me</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                <select
                  value={filterReportType}
                  onChange={(e) => setFilterReportType(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="harassment">Harassment</option>
                  <option value="hate speech">Hate Speech</option>
                  <option value="bullying">Bullying</option>
                  <option value="spam">Spam</option>
                </select>
              </div>
            </CardTitle>
            {selectedReports.length > 0 && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('dismiss')}>
                  Dismiss Selected ({selectedReports.length})
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleBulkAction('warn')}>
                  Warn Selected ({selectedReports.length})
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleBulkAction('ban')}>
                  Ban Selected ({selectedReports.length})
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <input
                        type="checkbox"
                        checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left p-2">Accused User</th>
                    <th className="text-left p-2">Reported Content</th>
                    <th className="text-left p-2">Reporter</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => handleSelectReport(report.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-2">
                        <div className="font-medium flex items-center gap-2">
                          User {report.userUuid.slice(-8)}
                          {report.reportsCount > 5 && <Badge variant="destructive" className="text-xs">Repeat</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{report.platform}</div>
                      </td>
                      <td className="p-2 max-w-xs">
                        <div className="truncate" title={report.content}>
                          {report.content.length > 50 ? `${report.content.substring(0, 50)}...` : report.content}
                        </div>
                        <Badge variant={report.severity === 'Critical' ? 'destructive' : report.severity === 'High' ? 'secondary' : 'outline'} className="mt-1">
                          {report.severity}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">Anonymous</div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">2 hours ago</div>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                            Dismiss
                          </Button>
                          <Button size="sm" variant="secondary" className="text-xs px-2 py-1">
                            Warn
                          </Button>
                          <div className="relative">
                            <select className="text-xs px-2 py-1 border rounded bg-destructive text-destructive-foreground">
                              <option value="">Ban</option>
                              <option value="1day">1 Day</option>
                              <option value="7days">7 Days</option>
                              <option value="permanent">Permanent</option>
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Trends */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Threats by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(systemAnalytics.abuseTypes).map(([key, value]) => ({ name: key, value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Threats Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={systemAnalytics.monthlyGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Line type="monotone" dataKey="reports" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Offenders */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Offenders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Rank</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Total Reports</th>
                    <th className="text-left p-2">Active Reports</th>
                    <th className="text-left p-2">Risk Score</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Last Report</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedUsers.map((user, index) => (
                    <tr key={user.uuid} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div className="font-medium">#{index + 1}</div>
                      </td>
                      <td className="p-2">
                        <div className="font-medium">User {user.uuid.slice(-8)}</div>
                        <div className="text-xs text-muted-foreground">{user.platforms.join(', ')}</div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm font-medium">{user.reportsCount}</div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">{Math.floor(user.reportsCount * 0.7)}</div>
                      </td>
                      <td className="p-2">
                        <div className="text-sm font-medium">{user.reportsCount * 10}</div>
                      </td>
                      <td className="p-2">
                        <Badge variant={user.riskLevel === 'High' ? 'destructive' : user.riskLevel === 'Medium' ? 'secondary' : 'outline'}>
                          {user.riskLevel}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">2 days ago</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI Testing Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              AI Testing Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Text</label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to test AI detection..."
                  rows={3}
                />
              </div>
              <Button onClick={testAI} disabled={testing} className="flex items-center gap-2">
                {testing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Zap className="h-4 w-4" />}
                {testing ? 'Testing...' : 'Test AI'}
              </Button>
              {aiResults && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">AI Results</h4>
                  <pre className="text-sm">{JSON.stringify(aiResults, null, 2)}</pre>
                </div>
              )}
              {rephraseSuggestions.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Rephrase Suggestions</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {rephraseSuggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

