import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Lock, Mail, User } from 'lucide-react';

interface SignupFormProps {
  onSignupSuccess: (email: string, needsConfirmation: boolean) => void;
}

const SignupForm = ({ onSignupSuccess }: SignupFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    } else {
      // Signup flow
      if (step === 1) {
        if (!formData.email || !formData.password) {
          toast({
            title: "Missing fields",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return;
        }
        setStep(2);
      } else if (step === 2) {
        if (!formData.firstName || !formData.lastName) {
          toast({
            title: "Missing fields",
            description: "Please provide your first and last name.",
            variant: "destructive",
          });
          return;
        }
        setStep(3);
      } else if (step === 3) {
        setIsLoading(true);
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
            }
          }
        });

        if (error) {
          toast({
            title: "Signup failed",
            description: error.message,
            variant: "destructive",
          });
        } else if (data.user) {
          // Check if email confirmation is required
          const needsConfirmation = !data.session;
          onSignupSuccess(formData.email, needsConfirmation);
        }
        
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">{isLogin ? 'Login' : 'Create Account'}</CardTitle>
              <CardDescription>
                {isLogin ? 'Enter your credentials to access your account' : 'Join our community and discover new events!'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        required
                        className="bg-white/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter your password"
                        required
                        className="bg-white/50 border-white/20"
                      />
                    </div>
                  </>
                )}

                {!isLogin && step === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter your first name"
                        required
                        className="bg-white/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter your last name"
                        required
                        className="bg-white/50 border-white/20"
                      />
                    </div>
                  </>
                )}

                {(isLogin || step === 3) && (
                  <>
                    {!isLogin && (
                      <div className="mb-4 p-4 rounded-md bg-green-50 text-green-900 flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>Almost there! Confirm your details and create your account.</span>
                      </div>
                    )}
                    
                    {isLogin && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            required
                            className="bg-white/50 border-white/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter your password"
                            required
                            className="bg-white/50 border-white/20"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2V4M12 20V22M4.2 4.2L5.6 5.6M18.4 18.4L19.8 19.8M2 12H4M20 12H22M4.2 19.8L5.6 18.4M18.4 5.6L19.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{isLogin ? 'Logging in...' : 'Signing up...'}</span>
                    </div>
                  ) : (
                    isLogin ? 'Login' : (step === 3 ? 'Create Account' : 'Next')
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Button variant="link" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
