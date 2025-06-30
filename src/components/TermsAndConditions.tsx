
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TermsAndConditionsProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  termsType: 'messaging' | 'location_sharing';
}

const TermsAndConditions = ({ isOpen, onClose, onAccept, termsType }: TermsAndConditionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    if (!user) return;
    
    setIsAccepting(true);
    try {
      const { error } = await supabase
        .from('terms_acceptance')
        .upsert({
          user_id: user.id,
          terms_type: termsType,
          accepted: true,
          accepted_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Terms accepted",
        description: "You can now use this feature.",
      });
      
      onAccept();
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast({
        title: "Error",
        description: "Failed to accept terms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const getTermsContent = () => {
    if (termsType === 'messaging') {
      return {
        title: "Messaging Terms and Conditions",
        content: `
**MESSAGING TERMS AND CONDITIONS**

**Effective Date:** ${new Date().toLocaleDateString()}

**1. ACCEPTANCE OF TERMS**
By using our messaging feature, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the messaging feature.

**2. PURPOSE AND SCOPE**
Our messaging feature is designed to facilitate meaningful connections between Christian singles in a safe and respectful environment. All communications should align with Christian values and principles.

**3. USER CONDUCT**
You agree to:
- Communicate respectfully and courteously at all times
- Maintain appropriate language and content in all messages
- Respect other users' boundaries and preferences
- Not engage in harassment, bullying, or inappropriate behavior
- Not share personal contact information until you feel comfortable doing so
- Report any concerning behavior to our support team

**4. PROHIBITED CONTENT**
The following types of content are strictly prohibited:
- Offensive, vulgar, or inappropriate language
- Sexual content or solicitation
- Harassment or threats
- Spam or promotional content
- Content that violates Christian values or principles
- Sharing of personal information of other users without consent

**5. PRIVACY AND SAFETY**
- All messages are private between participating users
- We reserve the right to monitor conversations for safety purposes
- Users should exercise caution when sharing personal information
- Report any suspicious or concerning behavior immediately

**6. TERMINATION**
We reserve the right to suspend or terminate messaging privileges for users who violate these terms or engage in inappropriate behavior.

**7. CHANGES TO TERMS**
We may update these terms from time to time. Continued use of the messaging feature constitutes acceptance of any changes.

**8. CONTACT**
For questions about these terms, please contact our support team.

By clicking "I Agree," you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
        `
      };
    } else {
      return {
        title: "Location Sharing Terms and Conditions",
        content: `
**LOCATION SHARING TERMS AND CONDITIONS**

**Effective Date:** ${new Date().toLocaleDateString()}

**1. ACCEPTANCE OF TERMS**
By using our location sharing feature, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the location sharing feature.

**2. PURPOSE AND SCOPE**
Our location sharing feature allows you to share your current location with other users you've connected with, facilitating safe in-person meetings within the Christian community.

**3. LOCATION DATA COLLECTION AND USE**
When you use location sharing:
- Your precise location will be shared with selected users
- Location data is temporary and expires after a specified time
- We do not store your location data permanently
- Location sharing is entirely voluntary and can be stopped at any time

**4. SAFETY AND PRIVACY**
- Only share your location with people you trust
- Meet in public places for initial meetings
- Inform friends or family about your meeting plans
- Trust your instincts and prioritize your safety
- You can revoke location sharing at any time

**5. USER RESPONSIBILITIES**
You agree to:
- Use location sharing responsibly and safely
- Only share location when you feel comfortable doing so
- Meet in safe, public locations
- Respect others' privacy and safety
- Not use location information for stalking or harassment

**6. PROHIBITED USES**
You may not use location sharing to:
- Harass, stalk, or threaten other users
- Engage in any illegal activities
- Violate others' privacy or safety
- Share location information with unauthorized third parties

**7. TECHNICAL LIMITATIONS**
- Location accuracy may vary based on device and network conditions
- The service may not be available in all areas
- We are not responsible for technical failures or inaccuracies

**8. LIABILITY**
Users are responsible for their own safety when meeting others. We are not liable for any incidents that may occur during in-person meetings arranged through our platform.

**9. TERMINATION**
We reserve the right to suspend or terminate location sharing privileges for users who violate these terms or misuse the feature.

**10. CHANGES TO TERMS**
We may update these terms from time to time. Continued use of the location sharing feature constitutes acceptance of any changes.

By clicking "I Agree," you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
        `
      };
    }
  };

  const terms = getTermsContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{terms.title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-96 w-full rounded border p-4">
          <div className="text-sm whitespace-pre-line">
            {terms.content}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            I Disagree
          </Button>
          <Button onClick={handleAccept} disabled={isAccepting}>
            {isAccepting ? 'Processing...' : 'I Agree'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditions;
