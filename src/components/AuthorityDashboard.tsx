import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  XCircle,
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  Save
} from 'lucide-react';

type Issue = Tables<'issues'>;
type IssueStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: 'status-pending', icon: Clock, label: 'Pending' },
  in_progress: { color: 'status-in-progress', icon: TrendingUp, label: 'In Progress' },
  resolved: { color: 'status-resolved', icon: CheckCircle, label: 'Resolved' },
  rejected: { color: 'status-rejected', icon: XCircle, label: 'Rejected' },
};

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [updateForm, setUpdateForm] = useState({
    status: '' as IssueStatus | '',
    engineer_name: '',
    budget: '',
    resolution_notes: '',
  });

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching issues:', error);
    } else {
      setIssues(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpdateIssue = async () => {
    if (!selectedIssue || !updateForm.status) return;

    setUpdating(true);

    const updates: TablesUpdate<'issues'> = {
      status: updateForm.status as IssueStatus,
    };

    if (updateForm.engineer_name) {
      updates.engineer_name = updateForm.engineer_name;
    }

    if (updateForm.budget) {
      updates.budget = parseFloat(updateForm.budget);
    }

    if (updateForm.resolution_notes) {
      updates.resolution_notes = updateForm.resolution_notes;
    }

    if (updateForm.status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', selectedIssue.id);

    if (error) {
      toast({
        title: 'Error updating issue',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Issue updated!',
        description: 'The issue has been updated successfully.',
      });
      setDetailsOpen(false);
      fetchIssues();
    }

    setUpdating(false);
  };

  const openIssueDetails = (issue: Issue) => {
    setSelectedIssue(issue);
    setUpdateForm({
      status: issue.status,
      engineer_name: issue.engineer_name || '',
      budget: issue.budget?.toString() || '',
      resolution_notes: issue.resolution_notes || '',
    });
    setDetailsOpen(true);
  };

  const getFilteredIssues = () => {
    if (activeTab === 'all') return issues;
    return issues.filter((issue) => issue.status === activeTab);
  };

  const getStatusStats = () => {
    return {
      total: issues.length,
      pending: issues.filter((i) => i.status === 'pending').length,
      in_progress: issues.filter((i) => i.status === 'in_progress').length,
      resolved: issues.filter((i) => i.status === 'resolved').length,
    };
  };

  const stats = getStatusStats();
  const filteredIssues = getFilteredIssues();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">Authority Dashboard</h1>
            <p className="text-muted-foreground">Manage and resolve civic issues</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('in_progress')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover:shadow-lg transition-all cursor-pointer" onClick={() => setActiveTab('resolved')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Tabs */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>All Reported Issues</CardTitle>
              <CardDescription>Click on an issue to update its status and assign resources</CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-4 w-full md:w-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in_progress">Active</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No issues found</h3>
              <p className="text-muted-foreground">
                {activeTab === 'all' ? 'No issues have been reported yet' : `No ${activeTab.replace('_', ' ')} issues`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIssues.map((issue) => {
                const status = statusConfig[issue.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={() => openIssueDetails(issue)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <Badge variant="outline" className="capitalize text-xs">
                            {issue.category}
                          </Badge>
                          {issue.priority && issue.priority >= 4 && (
                            <Badge variant="destructive" className="text-xs">
                              High Priority
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {issue.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {issue.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                          {issue.engineer_name && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {issue.engineer_name}
                            </span>
                          )}
                          {issue.budget && (
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <DollarSign className="w-3 h-3" />
                              ₹{issue.budget.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <span className="flex items-center gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Details & Update Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Issue</DialogTitle>
            <DialogDescription>
              Update status, assign engineer, and allocate budget
            </DialogDescription>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-6 mt-4">
              {/* Issue Info */}
              <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                <h3 className="font-semibold text-lg">{selectedIssue.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedIssue.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    {selectedIssue.location}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {selectedIssue.category}
                  </Badge>
                </div>
              </div>

              {/* Update Form */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={updateForm.status}
                    onValueChange={(value) => setUpdateForm({ ...updateForm, status: value as IssueStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="engineer">Engineer Name</Label>
                    <Input
                      id="engineer"
                      placeholder="Assign an engineer"
                      value={updateForm.engineer_name}
                      onChange={(e) => setUpdateForm({ ...updateForm, engineer_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget (₹)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="Allocate budget"
                      value={updateForm.budget}
                      onChange={(e) => setUpdateForm({ ...updateForm, budget: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Resolution Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about the resolution or progress..."
                    rows={3}
                    value={updateForm.resolution_notes}
                    onChange={(e) => setUpdateForm({ ...updateForm, resolution_notes: e.target.value })}
                  />
                </div>

                <Button onClick={handleUpdateIssue} disabled={updating} className="w-full">
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

              {/* Timeline Info */}
              <div className="pt-4 border-t">
                <Label className="text-muted-foreground text-xs">Issue Timeline</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Reported</p>
                    <p className="text-sm font-medium">
                      {new Date(selectedIssue.created_at).toLocaleString()}
                    </p>
                  </div>
                  {selectedIssue.resolved_at && (
                    <div>
                      <p className="text-xs text-muted-foreground">Resolved</p>
                      <p className="text-sm font-medium">
                        {new Date(selectedIssue.resolved_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
