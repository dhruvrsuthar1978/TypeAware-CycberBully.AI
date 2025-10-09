import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Gavel, Search, Filter } from 'lucide-react';

const ModerationQueue = ({ reports, onAction }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status.toLowerCase() === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || report.severity.toLowerCase() === filterSeverity;
    const matchesPlatform = filterPlatform === 'all' || report.platform.toLowerCase() === filterPlatform;
    const matchesSearch = searchTerm === '' ||
      report.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSeverity && matchesPlatform && matchesSearch;
  });

  const handleAction = (reportId, action) => {
    onAction(reportId, action);
  };

  return (
    <Card className="hover-lift border-0 bg-gradient-card shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span className="flex items-center gap-2 text-xl">
            <Gavel className="h-6 w-6 text-primary" />
            Moderation Queue
          </span>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 bg-background/50 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-36 bg-background/50 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-36 bg-background/50 backdrop-blur-sm border-border/50">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold text-foreground">Accused User ID</th>
                <th className="text-left p-4 font-semibold text-foreground">Reported Content</th>
                <th className="text-left p-4 font-semibold text-foreground">Severity</th>
                <th className="text-left p-4 font-semibold text-foreground">Platform</th>
                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id} className="border-b border-border/50 hover:bg-primary/5 transition-smooth group">
                  <td className="p-4">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">{report.userId}</div>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="truncate text-muted-foreground" title={report.content}>
                      {report.content.length > 50 ? `${report.content.substring(0, 50)}...` : report.content}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={report.severity === 'High' ? 'destructive' : report.severity === 'Medium' ? 'secondary' : 'outline'} className="font-medium">
                      {report.severity}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{report.platform}</div>
                  </td>
                  <td className="p-4">
                    <Badge variant={report.status === 'Pending' ? 'secondary' : report.status === 'Under Review' ? 'outline' : 'default'} className="font-medium">
                      {report.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAction(report.id, 'dismiss')} className="hover-scale">
                        Dismiss
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAction(report.id, 'warn')} className="hover-scale">
                        Warn
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAction(report.id, 'ban')} className="hover-scale">
                        Ban
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredReports.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Filter className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No reports match the current filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModerationQueue;