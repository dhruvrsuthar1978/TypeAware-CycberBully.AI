import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip
} from 'recharts';
import {
  Shield, Eye, Flag, AlertTriangle, CheckCircle, Clock,
  Activity, TrendingUp, Settings, Lightbulb, ExternalLink,
  Download, Trash2, FileText, Zap, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL, getAuthToken } from '@/utils/config';

const safetyTips = [
  'Cyberbullies often use sarcasm. Our AI is trained to detect sarcastic intent.',
  'Use positive language to reduce misunderstandings online.',
  'Reporting harmful content helps keep the community safe.',
  'The extension protects you in real-time across all monitored platforms.',
];

const CHART_COLORS = {
  primary: 'hsl(213 94% 58%)',
  accent:  'hsl(185 96% 42%)',
  grid:    'hsl(216 34% 16%)',
  muted:   'hsl(215 16% 52%)',
};

const monthlyData = [
  { month: 'Jul', scanned: 2100, detected: 45 },
  { month: 'Aug', scanned: 2400, detected: 52 },
  { month: 'Sep', scanned: 2800, detected: 38 },
  { month: 'Oct', scanned: 3200, detected: 41 },
  { month: 'Nov', scanned: 2900, detected: 29 },
  { month: 'Dec', scanned: 3100, detected: 33 },
];

const StatusIcon = ({ status }) => {
  if (status === 'Resolved')     return <CheckCircle className="h-4 w-4 text-security" />;
  if (status === 'Under Review') return <AlertTriangle className="h-4 w-4 text-primary" />;
  return <Clock className="h-4 w-4 text-warning" />;
};

const StatusBadge = ({ status }) => {
  const config = {
    Resolved:      'badge-success',
    Pending:       'badge-warning',
    'Under Review': 'badge-primary',
  };
  return <span className={config[status] || 'badge-warning'}>{status}</span>;
};

const UserDashboard = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const { toast }   = useToast();
  const [tipIdx, setTipIdx]  = useState(0);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    messagesScanned: 0, threatsDetected: 0, reportsSubmitted: 0,
    positivityScore: 98, accountCreated: new Date(),
  });
  const [userAbuseHistory, setUserAbuseHistory] = useState([]);
  const [extensionActive, setExtensionActive]   = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getAuthToken();
        if (!token) { setLoading(false); return; }

        const [analyticsRes, reportsRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/analytics/user`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/reports/user`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
          const d = await analyticsRes.value.json();
          setUserStats({
            messagesScanned: d.messagesScanned || 0,
            threatsDetected: d.threatsDetected || 0,
            reportsSubmitted: d.reportsSubmitted || 0,
            positivityScore: d.positivityScore || 98,
            accountCreated: new Date(d.accountCreated || Date.now()),
          });
        }
        if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
          const d = await reportsRes.value.json();
          setUserAbuseHistory(d.reports || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const ti = setInterval(() => setTipIdx((p) => (p + 1) % safetyTips.length), 10000);
    return () => clearInterval(ti);
  }, []);

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all report history? This cannot be undone.')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/reports/clear`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUserAbuseHistory([]);
        toast({ title: 'History cleared' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Failed to clear history' });
    }
  };

  const handleExport = () => {
    try {
      const csv =
        'Platform,Content,Reason,Status,Date\n' +
        userAbuseHistory
          .map((r) =>
            [
              r.platform || 'Extension',
              (r.content || '').replace(/,/g, ' '),
              r.reason,
              r.status,
              new Date(r.timestamp).toLocaleDateString(),
            ].join(',')
          )
          .join('\n');
      const a = Object.assign(document.createElement('a'), {
        href: 'data:text/csv;charset=utf-8,' + encodeURI(csv),
        download: 'abuse_history.csv',
      });
      a.click();
      toast({ title: 'Exported', description: 'Saved as abuse_history.csv' });
    } catch {
      toast({ variant: 'destructive', title: 'Export failed' });
    }
  };

  const name = user?.name || user?.username || 'User';

  /* ── KPI Cards ───────────────────────────────────────────── */
  const kpis = [
    {
      label: 'Messages Scanned',
      value: userStats.messagesScanned.toLocaleString(),
      sub: `Since ${userStats.accountCreated.toLocaleDateString()}`,
      icon: Eye,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Threats Detected',
      value: userStats.threatsDetected,
      sub: 'Potential harm prevented',
      icon: AlertTriangle,
      color: 'text-danger',
      bg: 'bg-danger/10',
    },
    {
      label: 'Reports Submitted',
      value: userStats.reportsSubmitted,
      sub: 'Helping keep community safe',
      icon: Flag,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Positivity Score',
      value: `${userStats.positivityScore}%`,
      sub: 'Clean communication rate',
      icon: Star,
      color: 'text-security',
      bg: 'bg-security/10',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome back, {name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-security px-2.5 py-1.5 rounded-md bg-security/10 border border-security/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-security opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-security" />
            </span>
            Protected
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
            <FileText className="h-4 w-4 mr-1.5" />
            All Reports
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">

        {/* KPI grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="ta-card p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
                <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`h-4 w-4 ${k.color}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold tab-nums ${k.color} mb-1`}>{k.value}</p>
              <p className="text-xs text-muted-foreground">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick panels */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Extension status */}
          <div className="ta-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Extension Status</h3>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${extensionActive ? 'text-security' : 'text-danger'}`}>
                <span className={`inline-flex h-1.5 w-1.5 rounded-full ${extensionActive ? 'bg-security' : 'bg-danger'}`} />
                {extensionActive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              {extensionActive
                ? 'Browser extension is protecting you in real-time.'
                : 'Extension not detected. Install it for real-time protection.'}
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/extension')}>
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Configure Extension
            </Button>
          </div>

          {/* Quick settings */}
          <div className="ta-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Quick Settings</h3>
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sensitivity Level</label>
              <select
                className="ta-input text-xs"
                defaultValue="medium"
                aria-label="Sensitivity Level"
              >
                <option value="low">Low — severe language only</option>
                <option value="medium">Medium — balanced</option>
                <option value="high">High — flags mild toxicity</option>
              </select>
            </div>
            <Button size="sm" className="w-full" onClick={() => navigate('/settings')}>
              Open Full Settings
            </Button>
          </div>

          {/* Safety tips */}
          <div className="ta-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Safety Tips</h3>
              <Lightbulb className="h-4 w-4 text-warning" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4 min-h-[3.5rem]">
              {safetyTips[tipIdx]}
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/learn-more')}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Learn More
            </Button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Line chart */}
          <div className="ta-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Detection Trends</h3>
              <Badge variant="secondary" className="ml-auto text-xs">Last 6 months</Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis dataKey="month" stroke={CHART_COLORS.muted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke={CHART_COLORS.muted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220 44% 8%)',
                      border: '1px solid hsl(216 34% 16%)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: 'hsl(210 38% 94%)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="scanned"
                    stroke={CHART_COLORS.muted}
                    strokeWidth={2}
                    dot={false}
                    name="Scanned"
                  />
                  <Line
                    type="monotone"
                    dataKey="detected"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2.5}
                    dot={{ fill: CHART_COLORS.primary, r: 3 }}
                    name="Detected"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart */}
          <div className="ta-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Monthly Scans</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                  <XAxis dataKey="month" stroke={CHART_COLORS.muted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke={CHART_COLORS.muted} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(220 44% 8%)',
                      border: '1px solid hsl(216 34% 16%)',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="scanned" fill={CHART_COLORS.accent} radius={[3, 3, 0, 0]} name="Scanned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Abuse history table */}
        <div className="ta-card overflow-hidden">
          <div className="page-header">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Abuse History</h3>
              <Badge variant="secondary" className="text-xs">{userAbuseHistory.length} records</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleExport} className="text-xs gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                className="text-xs gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          </div>

          {userAbuseHistory.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No reports yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Install the extension to start tracking</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="ta-table">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Content</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {userAbuseHistory.map((r, idx) => (
                    <tr key={r.id || idx}>
                      <td className="font-medium text-foreground">{r.platform || 'Extension'}</td>
                      <td className="max-w-xs">
                        <p className="text-muted-foreground truncate text-xs">
                          {(r.content || '').replace(/.(?=.{4,}$)/g, '•')}
                        </p>
                      </td>
                      <td>
                        <span className="badge-danger text-xs">{r.reason || '—'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={r.status} />
                          <StatusBadge status={r.status || 'Pending'} />
                        </div>
                      </td>
                      <td className="text-xs text-muted-foreground tab-nums">
                        {r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
