import React, { useState, useEffect } from 'react';
import { Shield, Eye, Flag, Calendar, AlertTriangle, CheckCircle, Clock, ExternalLink, Star, ThumbsUp, Lightbulb, Settings, Activity, TrendingUp, Zap, Download, FileText, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/reports/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserReports(data.reports || []);
        }
      } catch (error) {
        console.error('Error fetching user reports:', error);
        toast({
          title: "Error",
          description: "Failed to load reports. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserReports();
  }, [toast]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Reports</h1>
            <p className="text-muted-foreground">View and manage your submitted reports</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="hover-scale"
          >
            Back to Dashboard
          </Button>
        </div>

        {userReports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground mb-4">You haven't submitted any reports. Start monitoring your activity to flag potential issues.</p>
              <Button onClick={() => navigate('/dashboard')} className="hover-scale">
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Report History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Platform</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Content</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Reason</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-sm text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userReports.map((report) => (
                      <tr key={report.id} className="border-b border-border/50 hover:bg-primary/5 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-medium text-foreground">{report.platform}</span>
                        </td>
                        <td className="py-4 px-4 max-w-md">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.content ? report.content.replace(/.(?=.{4,}$)/g, '*') : 'Content not available'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs bg-danger/20 text-danger px-2 py-1 rounded-full font-medium">
                            {report.reason}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                            {getStatusIcon(report.status)}
                            <span className="text-sm font-medium">{report.status}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {new Date(report.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => {
                              if (report.content) {
                                alert(`Full Content: ${report.content}\nReason: ${report.reason}\nStatus: ${report.status}`);
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;
