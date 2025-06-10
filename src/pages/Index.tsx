
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Church, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SignupForm from '../components/SignupForm';
import PostRegistrationForm from '../components/PostRegistrationForm';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'signup' | 'post-registration'>('welcome');
  const [userEmail, setUserEmail] = useState('');

  const handleSignupComplete = (email: string) => {
    setUserEmail(email);
    setCurrentStep('post-registration');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <Church className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show main app content
  if (user) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-4 py-8">
          {/* Header with sign out */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <Church className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">AVYO In-Gathering</h1>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Welcome message */}
          <Card className="gradient-card border-0 shadow-lg max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <Heart className="w-8 h-8 text-primary" />
                Welcome to AVYO In-Gathering!
              </CardTitle>
              <CardDescription className="text-lg">
                Hello {user.email}! Your faith community awaits.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                You're now part of our growing Christian community. Here you can connect with believers, 
                share your faith journey, and grow together in Christ.
              </p>
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm text-primary font-medium">
                  "For where two or three gather in my name, there am I with them." - Matthew 18:20
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // For non-authenticated users, show existing signup flow
  if (currentStep === 'signup') {
    return <SignupForm onComplete={handleSignupComplete} onBack={() => setCurrentStep('welcome')} />;
  }

  if (currentStep === 'post-registration') {
    return <PostRegistrationForm userEmail={userEmail} onBack={() => setCurrentStep('signup')} />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Church className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">AVYO In-Gathering</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A Christian community where faith meets fellowship. Connect with believers, share your journey, and grow together in Christ.
          </p>
        </div>

        {/* Welcome Section */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl">Welcome Home</CardTitle>
              </div>
              <CardDescription className="text-base">
                Join a community of believers who are passionate about growing in faith and supporting one another through life's journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Connect with local believers in your area
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Share prayer requests and testimonies
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Find your church community
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Grow in faith together
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-6 h-6 text-primary" />
                <CardTitle className="text-2xl">Safe & Secure</CardTitle>
              </div>
              <CardDescription className="text-base">
                Our platform is designed with Christian values at its core, ensuring a safe, respectful environment for all believers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Verified Christian community members
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Privacy-focused and family-friendly
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Moderated discussions and content
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  Built on biblical principles
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="gradient-card border-0 shadow-lg max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Join?</CardTitle>
              <CardDescription>
                Create your account and become part of our growing faith community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full text-lg py-6 bg-primary hover:bg-primary/90 transition-all duration-300"
                >
                  Join Our Community
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setCurrentStep('signup')} 
                  className="w-full text-lg py-6 border-primary/20 hover:bg-primary/10 transition-all duration-300"
                >
                  Complete Registration Form
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                "For where two or three gather in my name, there am I with them." - Matthew 18:20
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
