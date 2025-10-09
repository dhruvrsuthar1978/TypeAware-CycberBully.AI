import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Inbox, Gavel, Users, Server } from 'lucide-react';

const KpiCards = ({ pendingReports, moderationActions, activeUsers }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pending Reports</p>
              <p className={`text-4xl font-bold mb-1 ${pendingReports > 50 ? 'text-red-600' : pendingReports > 10 ? 'text-yellow-600' : 'text-foreground'}`}>
                {pendingReports}
              </p>
              <p className="text-xs text-muted-foreground">
                {pendingReports > 50 ? 'High priority' : pendingReports > 10 ? 'Moderate' : 'Under control'}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Inbox className="h-7 w-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Moderation Actions</p>
              <p className="text-4xl font-bold text-foreground mb-1">{moderationActions.total}</p>
              <p className="text-xs text-muted-foreground">
                {moderationActions.warnings} warnings, {moderationActions.bans} bans
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Gavel className="h-7 w-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active Users (24h)</p>
              <p className="text-4xl font-bold text-foreground mb-1">{activeUsers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover-lift-strong border-0 bg-gradient-card overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-security/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">System Status</p>
              <div className="text-sm space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium">API: Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs font-medium">Database: Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                  <span className="text-xs font-medium">AI Service: Degraded</span>
                </div>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Server className="h-7 w-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KpiCards;