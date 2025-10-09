import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, UserX, Ban, Users } from 'lucide-react';

const UserManagement = ({ users, onAction }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (userId, action) => {
    onAction(userId, action);
  };

  return (
    <Card className="hover-lift border-0 bg-gradient-card shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl mb-4">
          <Users className="h-6 w-6 text-primary" />
          User Management
        </CardTitle>
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by User ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-background/50 backdrop-blur-sm border-border/50">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-semibold text-foreground">User ID</th>
                <th className="text-left p-4 font-semibold text-foreground">Total Reports</th>
                <th className="text-left p-4 font-semibold text-foreground">Risk Level</th>
                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                <th className="text-left p-4 font-semibold text-foreground">Last Active Date</th>
                <th className="text-left p-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.userId} className="border-b border-border/50 hover:bg-primary/5 transition-smooth group">
                  <td className="p-4">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">{user.userId}</div>
                    {user.name && <div className="text-xs text-muted-foreground">{user.name}</div>}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-semibold">{user.totalReports}</div>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.riskLevel === 'High' ? 'destructive' : user.riskLevel === 'Medium' ? 'secondary' : 'outline'} className="font-medium">
                      {user.riskLevel}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={
                      user.status === 'Active' ? 'default' :
                      user.status === 'Suspended' ? 'secondary' :
                      'destructive'
                    } className="font-medium">
                      {user.status}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-muted-foreground">{new Date(user.lastActive).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAction(user.userId, 'view')} className="hover-scale">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleAction(user.userId, 'suspend')} className="hover-scale">
                        <UserX className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAction(user.userId, 'ban')} className="hover-scale">
                        <Ban className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">No users match the current filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserManagement;