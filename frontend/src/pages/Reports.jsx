import { useState, useEffect } from 'react';
import { Shield, Flag, AlertTriangle, CheckCircle, Clock, FileText, Download, Search, Filter, ArrowLeft, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL, getAuthToken } from '@/utils/config';

const STATUS_CONFIG = {
  Resolved:     { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
  Pending:      { icon: Clock,       color: 'text-yellow-600',  bg: 'bg-yellow-500/10 border-yellow-200 dark:border-yellow-800',   dot: 'bg-yellow-500' },
  'Under Review': { icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-200 dark:border-blue-800',       dot: 'bg-blue-500' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
};

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/reports/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserReports(data.reports || []);
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: 'Failed to load reports.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filtered = userReports.filter((r) => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch = !search || r.platform?.toLowerCase().includes(search.toLowerCase()) || r.reason?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total:    userReports.length,
    resolved: userReports.filter((r) => r.status === 'Resolved').length,
    pending:  userReports.filter((r) => r.status === 'Pending').length,
  };

  const exportCsv = () => {
    const rows = userReports.map((r) => [r.platform, (r.content || '').replace(/,/g, ' '), r.reason, r.status, new Date(r.timestamp).toLocaleDateString()]);
    const csv = ['Platform,Content,Reason,Status,Date', ...rows.map((r) => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
    a.download = 'typeaware_reports.csv';
    a.click();
    toast({ title: 'Exported', description: 'Reports exported to CSV successfully.' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="relative bg-gradient-aurora py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-pattern-dots opacity-20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white">Your Reports</h1>
                <p className="text-white/80 mt-0.5">View and manage all submitted abuse reports</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="glass" size="sm" onClick={exportCsv} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="glass" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Reports', value: stats.total, icon: Flag, color: 'from-violet-500 to-purple-600' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'from-yellow-500 to-orange-500' },
          ].map((s, i) => (
            <Card key={i} className="border-0 bg-gradient-card shadow-card hover-lift">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display text-foreground">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ───────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by platform or reason..."
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {['all', 'Resolved', 'Pending', 'Under Review'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? 'bg-gradient-primary text-white shadow-card' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table / Empty state ───────────────────────── */}
        {filtered.length === 0 ? (
          <Card className="border-0 bg-gradient-card shadow-card">
            <CardContent className="py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Inbox className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No reports found</h3>
              <p className="text-muted-foreground mb-6">
                {userReports.length === 0
                  ? "You haven't submitted any reports yet. Start using the extension to flag harmful content."
                  : 'No reports match your current filters.'}
              </p>
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-gradient-card shadow-elegant overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                Report History
                <Badge variant="secondary" className="ml-auto text-xs">{filtered.length} records</Badge>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/40">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platform</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="py-3 px-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((report) => (
                    <tr key={report.id} className="hover:bg-primary/3 transition-colors group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(report.platform || 'E')[0]}
                          </div>
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{report.platform || 'Extension'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {report.content ? report.content.replace(/.(?=.{4,}$)/g, '•') : '—'}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-200 dark:border-red-900">
                          {report.reason || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <StatusBadge status={report.status || 'Pending'} />
                      </td>
                      <td className="py-4 px-5 text-sm text-muted-foreground whitespace-nowrap">
                        {report.timestamp ? new Date(report.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-4 px-5">
                        <button
                          onClick={() => alert(`Content: ${report.content || 'N/A'}\nReason: ${report.reason}\nStatus: ${report.status}`)}
                          className="text-xs text-primary hover:underline font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;
