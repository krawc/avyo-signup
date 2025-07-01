
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName?: string;
}

const REPORT_REASONS = [
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Offensive or immoral material' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'other', label: 'Other' },
];

const ReportUserModal = ({ isOpen, onClose, reportedUserId, reportedUserName }: ReportUserModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;

    setIsSubmitting(true);
    
    try {
      const reason = selectedReason === 'other' ? customReason : selectedReason;
      
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_user_id: user.id,
          reported_user_id: reportedUserId,
          reason: reason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Report Submitted',
        description: 'Thank you for your report. Our team will review it and take appropriate action.',
      });

      onClose();
      setSelectedReason('');
      setCustomReason('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedReason('');
    setCustomReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report User</DialogTitle>
          <DialogDescription>
            Report {reportedUserName || 'this user'} for inappropriate behavior
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {REPORT_REASONS.map((reason) => (
              <div key={reason.value} className="flex items-center space-x-2">
                <RadioGroupItem value={reason.value} id={reason.value} />
                <Label htmlFor={reason.value}>{reason.label}</Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Please specify:</Label>
              <Textarea
                id="custom-reason"
                placeholder="Describe the issue..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || (selectedReason === 'other' && !customReason.trim()) || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserModal;
