import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:3000';

const AddImapDialog = ({ open, onOpenChange, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user: '',
    password: '',
    host: '',
    port: 993,
    tls: true
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user || !formData.password || !formData.host) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/imap-clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          port: parseInt(formData.port)
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add IMAP account');
      }

      // Reset form
      setFormData({
        user: '',
        password: '',
        host: '',
        port: 993,
        tls: true
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error('Failed to add IMAP account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add IMAP Account</DialogTitle>
          <DialogDescription>
            Enter your email account details to start syncing emails.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="user"
                type="email"
                placeholder="your-email@example.com"
                value={formData.user}
                onChange={(e) => handleChange('user', e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="host">
                IMAP Host <span className="text-red-500">*</span>
              </Label>
              <Input
                id="host"
                type="text"
                placeholder="imap.example.com"
                value={formData.host}
                onChange={(e) => handleChange('host', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Common hosts: imap.gmail.com, outlook.office365.com, imap.mail.yahoo.com
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                placeholder="993"
                value={formData.port}
                onChange={(e) => handleChange('port', e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="tls">Use TLS/SSL</Label>
                <p className="text-xs text-muted-foreground">
                  Secure connection (recommended)
                </p>
              </div>
              <Switch
                id="tls"
                checked={formData.tls}
                onCheckedChange={(checked) => handleChange('tls', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddImapDialog;
