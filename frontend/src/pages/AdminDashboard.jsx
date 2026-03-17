import React, { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield, LayoutDashboard, Users, Zap, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Activity, Flag, Eye, MoreHorizontal,
  AlertOctagon, Ban, MessageSquareOff
} from 'lucide-react';

const CHART_COLORS = {
  primary: 'hsl(213 94% 58%)',
  accent:  'hsl(185 96% 42%)',
  danger:  'hsl(0 84% 60%)',
  warning: 'hsl(38 92% 52%)',
  security:'hsl(160 84% 40%)',
  grid:    'hsl(216 34% 16%)',
  muted:   'hsl(215 16% 52%)',
};

const PIE_COLORS = [
  CHART_COLORS.danger,
  CHART_COLORS.warning,
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.security,
];

const mockData = {
  kpi: {
    pendingReports: 691,
    moderationActions: { total: 127, warnings: 85, bans: 42 },
    activeUsers: 8542,
    flagRate: 7.8,
  },
  reports: [
    { id: 'REP-001', userId: 'User1234', content: "This is absolutely ridiculous! You people are all idiots!", reason: 'Harassment', severity: 'High',     platform: 'Twitter',   status: 'Pending' },
    { id: 'REP-002', userId: 'User5678', content: "I hate this group and everyone in it.",                     reason: 'Hate Speech', severity: 'Critical', platform: 'Facebook',  status: 'Under Review' },
    { id: 'REP-003', userId: 'User9012', content: "You're so stupid, why would anyone follow you?",           reason: 'Bullying',    severity: 'Medium',   platform: 'Instagram', status: 'Resolved' },
    { id: 'REP-004', userId: 'User3456', content: "Get off this platform before I find you.",                 reason: 'Threat',      severity: 'Critical', platform: 'Discord',   status: 'Pending' },
  ],
  abuseTypes: [
    { name: 'Harassment', value: 45 },
    { name: 'Hate Speech', value: 23 },
    { name: 'Bullying',    value: 18 },
    { name: 'Spam',        value: 8 },
    { name: 'Threats',     value: 6 },
  ],
  monthlyGrowth: [
    { month: 'Jan', reports: 120, users: 450 },
    { month: 'Feb', reports: 145, users: 520 },
    { month: 'Mar', reports: 168, users: 610 },
    { month: 'Apr', reports: 192, users: 680 },
    { month: 'May', reports: 215, users: 750 },
    { month: 'Jun', reports: 238, users: 820 },
  ],
  users: [
    { userId: 'User1234', totalReports: 12, riskLevel: 'High',   status: 'Under Review', lastActive: '2024-01-15' },
    { userId: 'User5678', totalReports: 8,  riskLevel: 'Medium', status: 'Active',       lastActive: '2024-01-14' },
    { userId: 'User9012', totalReports: 5,  riskLevel: 'Low',    status: 'Active',       lastActive: '2024-01-13' },
    { userId: 'User3456', totalReports: 19, riskLevel: 'High',   status: 'Suspended',    lastActive: '2024-01-12' },
  ],
};

const SeverityBadge = ({ severity }) => {
  const map = {
    Critical: 'badge-danger',
    High:     'badge-warning',
    Medium:   'badge-primary',
    Low:      'badge-success',
  };
  return <span className={`${map[severity] || 'badge-primary'}`}>{severity}</span>;
};

const StatusBadge = ({ status }) => {
  const map = {
    Pending:       'badge-warning',
    'Under Review': 'badge-primary',
    Resolved:      'badge-success',
    Suspended:     'badge-danger',
    Active:        'badge-success',
  };
  return <span className={`${map[status] || 'badge-primary'}`}>{status}</span>;
};

const RiskBadge = ({ level }) => {
  const map = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };
  return <span className={map[level] || 'badge-primary'}>{level}</span>;
};

const AdminDashboard = () => {
  const [reportActions, setReportActions] = useState({});

  const handleReportAction = (reportId, action) => {
    setReportActions((prev) => ({ ...prev, [reportId]: action }));
  };

  const kpis = [
    { label: 'Pending Reports',     value: mockData.kpi.pendingReports.toLocaleString(), icon: Flag,         color: 'text-warning',  bg: 'bg-warning/10' },
    { label: 'Moderation Actions',  value: mockData.kpi.moderationActions.total,          icon: Shield,       color: 'text-primary',  bg: 'bg-primary/10' },
    { label: 'Active Users',        value: mockData.kpi.activeUsers.toLocaleString(),      icon: Users,        color: 'text-security', bg: 'bg-security/10' },
    { label: 'Flag Rate',           value: `${mockData.kpi.flagRate}%`,                   icon: AlertTriangle, color: 'text-danger',  bg: 'bg-danger/10' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-danger/15 border border-danger/25 flex items-center justify-center">
            <Shield className="h-4 w-4 text-danger" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">System monitoring & moderation</p>
          </div>
        </div>
        <Badge className="bg-warning/15 text-warning border-warning/25 text-xs">Demo Mode</Badge>
      </div>

      <div className="flex-1 p-6 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="ta-card p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold tab-nums ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-5">
          <TabsList className="bg-secondary border border-border rounded-lg p-1 h-auto">
            {[
              { value: 'overview',    label: 'Overview',        icon: LayoutDashboard },
              { value: 'queue',       label: 'Mod Queue',       icon: Flag },
              { value: 'users',       label: 'Users',           icon: Users },
              { value: 'ai-tools',    label: 'AI Tools',        icon: Zap },
            ].map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Monthly growth */}
              <div className="ta-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Monthly Growth</h3>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockData.monthlyGrowth} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                      <XAxis dataKey="month" stroke={CHART_COLORS.muted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis stroke={CHART_COLORS.muted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(220 44% 8%)', border: '1px solid hsl(216 34% 16%)', borderRadius: '6px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: CHART_COLORS.muted }} />
                      <Line type="monotone" dataKey="reports" stroke={CHART_COLORS.danger} strokeWidth={2.5} dot={false} name="Reports" />
                      <Line type="monotone" dataKey="users"   stroke={CHART_COLORS.primary} strokeWidth={2.5} dot={false} name="Users" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Abuse types pie */}
              <div className="ta-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold text-foreground">Abuse Type Breakdown</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="h-48 w-48 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mockData.abuseTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={3}>
                          {mockData.abuseTypes.map((_, idx) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(220 44% 8%)', border: '1px solid hsl(216 34% 16%)', borderRadius: '6px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 flex-1">
                    {mockData.abuseTypes.map((t, i) => (
                      <div key={t.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-xs text-muted-foreground">{t.name}</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground tab-nums">{t.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Moderation breakdown */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Actions',  value: mockData.kpi.moderationActions.total,    icon: Shield,            color: 'text-primary' },
                { label: 'Warnings Issued', value: mockData.kpi.moderationActions.warnings, icon: AlertTriangle,     color: 'text-warning' },
                { label: 'Bans Applied',    value: mockData.kpi.moderationActions.bans,     icon: Ban,               color: 'text-danger' },
              ].map((s, i) => (
                <div key={i} className="ta-card p-4 flex items-center gap-3">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                  <div>
                    <p className={`text-2xl font-bold tab-nums ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* MOD QUEUE */}
          <TabsContent value="queue" className="space-y-4">
            <div className="ta-card overflow-hidden">
              <div className="page-header">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-semibold text-foreground">Moderation Queue</h3>
                  <Badge className="bg-warning/15 text-warning border-warning/25 text-xs">
                    {mockData.reports.filter(r => r.status === 'Pending').length} pending
                  </Badge>
                </div>
              </div>
              <div className="divide-y divide-border">
                {mockData.reports.map((r) => (
                  <div key={r.id} className="p-4 hover:bg-primary/3 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-xs font-mono text-muted-foreground">{r.id}</span>
                          <SeverityBadge severity={r.severity} />
                          <StatusBadge status={reportActions[r.id] ? 'Resolved' : r.status} />
                          <span className="badge-primary text-xs">{r.platform}</span>
                        </div>
                        <p className="text-sm text-foreground mb-1 line-clamp-2">"{r.content}"</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>User: <span className="text-foreground font-medium">{r.userId}</span></span>
                          <span>Reason: <span className="text-danger font-medium">{r.reason}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2 text-security hover:bg-security/10 hover:text-security"
                          onClick={() => handleReportAction(r.id, 'confirmed')}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 px-2 text-warning hover:bg-warning/10 hover:text-warning"
                          onClick={() => handleReportAction(r.id, 'false_positive')}
                        >
                          <MessageSquareOff className="h-3.5 w-3.5 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <div className="ta-card overflow-hidden">
              <div className="page-header">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Flagged Users</h3>
                </div>
              </div>
              <table className="ta-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Reports</th>
                    <th>Risk Level</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.users.map((u) => (
                    <tr key={u.userId}>
                      <td className="font-mono text-xs text-foreground">{u.userId}</td>
                      <td className="tab-nums font-semibold text-foreground">{u.totalReports}</td>
                      <td><RiskBadge level={u.riskLevel} /></td>
                      <td><StatusBadge status={u.status} /></td>
                      <td className="text-xs text-muted-foreground tab-nums">{u.lastActive}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-danger">
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* AI TOOLS */}
          <TabsContent value="ai-tools">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Batch Analyze',   desc: 'Run AI analysis on multiple pieces of content at once.',    icon: Zap,          color: 'text-primary',  bg: 'bg-primary/10',  btn: 'Run Analysis' },
                { title: 'Retrain Model',   desc: 'Fine-tune the detection model with new flagged examples.', icon: Activity,     color: 'text-accent',   bg: 'bg-accent/10',   btn: 'Start Training' },
                { title: 'Export Dataset',  desc: 'Export labelled content for external model training.',      icon: AlertOctagon, color: 'text-warning',  bg: 'bg-warning/10',  btn: 'Export CSV' },
                { title: 'Model Metrics',   desc: 'View accuracy, recall, precision and F1 scores.',           icon: TrendingUp,   color: 'text-security', bg: 'bg-security/10', btn: 'View Metrics' },
              ].map((tool) => (
                <div key={tool.title} className="ta-card p-5">
                  <div className={`w-10 h-10 rounded-lg ${tool.bg} flex items-center justify-center mb-4`}>
                    <tool.icon className={`h-5 w-5 ${tool.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5">{tool.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{tool.desc}</p>
                  <Button size="sm" variant="outline" className="text-xs">{tool.btn}</Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
