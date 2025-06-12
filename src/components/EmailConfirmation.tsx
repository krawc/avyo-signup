
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

interface EmailConfirmationProps {
  userEmail: string;
  onBack: () => void;
}

const EmailConfirmation = ({ userEmail, onBack }: EmailConfirmationProps) => {
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const resendConfirmation = async () => {
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: userEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      toast({
        title: "Error resending email",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Confirmation email sent!",
        description: "Please check your inbox and spam folder.",
      });
    }
    setIsResending(false);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Confirm Your Email</CardTitle>
              <CardDescription className="text-base">
                We've sent a confirmation email to:
                <br />
                <strong className="text-foreground">{userEmail}</strong>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-accent/20 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Please check your inbox and click the confirmation link to activate your account.
                </p>
                <p className="text-xs text-muted-foreground">
                  Don't forget to check your spam folder if you don't see the email.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={resendConfirmation}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Resend Confirmation Email
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={onBack}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Once confirmed, you'll be able to complete your profile and join the community.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmation;
