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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { 
  Plus, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Eye,
  XCircle,
  TrendingUp,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { z } from 'zod';

type Issue = Tables<'issues'>;

const issueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  category: z.string().min(1, 'Please select a category'),
  location: z.string().min(5, 'Location must be at least 5 characters').max(200),
});

const categories = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'streetlight', label: 'Streetlight' },
  { value: 'water', label: 'Water Supply' },
  { value: 'garbage', label: 'Garbage Collection' },
  { value: 'road', label: 'Road Damage' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'other', label: 'Other' },
] as const;

type IssueCategory = typeof categories[number]['value'];

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: 'status-pending', icon: Clock, label: 'Pending' },
  in_progress: { color: 'status-in-progress', icon: TrendingUp, label: 'In Progress' },
  resolved: { color: 'status-resolved', icon: CheckCircle, label: 'Resolved' },
  rejected: { color: 'status-rejected', icon: XCircle, label: 'Rejected' },
};

export default function CitizenDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IssueCategory | '',
    location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchIssues = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('citizen_id', user.id)
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
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB',
          variant: 'destructive',
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!imageFile) return null;
    
    setUploadingImage(true);
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('issue-images')
      .upload(fileName, imageFile);
    
    setUploadingImage(false);
    
    if (error) {
      console.error('Image upload error:', error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('issue-images')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      issueSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    if (!user) return;

    setSubmitting(true);

    // Upload image if present
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage(user.id);
    }

    const { error } = await supabase.from('issues').insert({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category as IssueCategory,
      location: formData.location.trim(),
      citizen_id: user.id,
      image_url: imageUrl,
    });

    if (error) {
      toast({
        title: 'Error submitting issue',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Issue submitted!',
        description: 'Your issue has been reported successfully.',
      });
      setFormData({ title: '', description: '', category: '', location: '' });
      removeImage();
      setDialogOpen(false);
      fetchIssues();
    }

    setSubmitting(false);
  };

  const getStatusStats = () => {
    const stats = {
      total: issues.length,
      pending: issues.filter((i) => i.status === 'pending').length,
      in_progress: issues.filter((i) => i.status === 'in_progress').length,
      resolved: issues.filter((i) => i.status === 'resolved').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display">Citizen Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track and manage your reported issues</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Report New Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Report a New Issue</DialogTitle>
              <DialogDescription>
                Provide details about the civic issue you want to report
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Pothole on Main Street"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as IssueCategory })}
                >
                  <SelectTrigger className={errors.category ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter the address or location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={errors.location ? 'border-destructive' : ''}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">{errors.location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Photo (Optional)</Label>
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload an image
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Issue'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card">
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
        <Card className="glass-card">
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
        <Card className="glass-card">
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
        <Card className="glass-card">
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

      {/* Issues List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>My Reported Issues</CardTitle>
          <CardDescription>View and track all your submitted issues</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No issues reported yet</h3>
              <p className="text-muted-foreground mb-4">
                Click the button above to report your first civic issue
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => {
                const status = statusConfig[issue.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
                    onClick={() => {
                      setSelectedIssue(issue);
                      setDetailsOpen(true);
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{issue.title}</h3>
                          <Badge variant="outline" className="capitalize text-xs">
                            {issue.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {issue.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(issue.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <span className="flex items-center gap-1">
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Issue Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedIssue.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium capitalize">{selectedIssue.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusConfig[selectedIssue.status]?.color}`}>
                    {statusConfig[selectedIssue.status]?.label}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="font-medium">{selectedIssue.location}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedIssue.description}</p>
              </div>
              {selectedIssue.image_url && (
                <div>
                  <Label className="text-muted-foreground">Photo</Label>
                  <img 
                    src={selectedIssue.image_url} 
                    alt="Issue" 
                    className="w-full h-48 object-cover rounded-lg mt-2 border border-border"
                  />
                </div>
              )}
              {selectedIssue.engineer_name && (
                <div>
                  <Label className="text-muted-foreground">Assigned Engineer</Label>
                  <p className="font-medium">{selectedIssue.engineer_name}</p>
                </div>
              )}
              {selectedIssue.budget && (
                <div>
                  <Label className="text-muted-foreground">Allocated Budget</Label>
                  <p className="font-medium text-primary">₹{selectedIssue.budget.toLocaleString()}</p>
                </div>
              )}
              {selectedIssue.resolution_notes && (
                <div>
                  <Label className="text-muted-foreground">Resolution Notes</Label>
                  <p className="text-sm">{selectedIssue.resolution_notes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <Label className="text-muted-foreground text-xs">Reported On</Label>
                  <p className="text-sm">{new Date(selectedIssue.created_at).toLocaleString()}</p>
                </div>
                {selectedIssue.resolved_at && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Resolved On</Label>
                    <p className="text-sm">{new Date(selectedIssue.resolved_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
