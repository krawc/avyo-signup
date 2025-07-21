
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, User, Church } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isMagicLink, setIsMagicLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
      });
      navigate('/');
    }
    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        emailRedirectTo: redirectUrl,
      }
    });

    if (error) {
      toast({
        title: "Magic link failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email!",
        description: "We've sent you a magic link to log in.",
      });
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectUrl = `${window.location.origin}/post-registration`;
    
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: "Account already exists",
          description: "This email is already registered. Try logging in instead.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signup failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Check your email!",
        description: "We've sent you a confirmation link to complete your registration.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>

          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                <Church className="w-8 h-8 text-primary" />
                <CardTitle className="text-2xl">AVYO In-Gathering</CardTitle>
              </div>
              <CardDescription>
                {isLogin 
                  ? (isMagicLink ? 'Sign in with a magic link' : 'Welcome back to our community')
                  : 'Join our Christian community'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={isLogin ? (isMagicLink ? handleMagicLink : handleLogin) : handleSignup} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            placeholder="John"
                            className="bg-white/50 border-white/20 pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="Smith"
                          className="bg-white/50 border-white/20"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@example.com"
                      className="bg-white/50 border-white/20 pl-10"
                      required
                    />
                  </div>
                </div>

                {(!isLogin || !isMagicLink) && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className="bg-white/50 border-white/20 pl-10"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  type="submit"
                  className="w-full text-lg py-6 bg-primary hover:bg-primary/90 transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : (
                    isLogin ? (isMagicLink ? 'Send Magic Link' : 'Sign In') : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-4">
                {isLogin && (
                  <>
                    <Button
                      variant="link"
                      onClick={() => setIsMagicLink(!isMagicLink)}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {isMagicLink ? 'Sign in with password instead' : 'Sign in with magic link'}
                    </Button>
                    
                    {!isMagicLink && (
                      <Button
                        variant="link"
                        onClick={() => navigate('/password-reset')}
                        className="text-sm text-muted-foreground hover:text-primary"
                      >
                        Forgot your password?
                      </Button>
                    )}
                  </>
                )}
                
                {/* <Button
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setIsMagicLink(false);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-primary"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </Button> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
