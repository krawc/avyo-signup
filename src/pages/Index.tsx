
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Church } from 'lucide-react';
import SignupForm from '../components/SignupForm';
import PostRegistrationForm from '../components/PostRegistrationForm';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'signup' | 'post-registration'>('welcome');
  const [userEmail, setUserEmail] = useState('');

  const handleSignupComplete = (email: string) => {
    setUserEmail(email);
    setCurrentStep('post-registration');
  };

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
            <h1 className="text-4xl font-bold text-foreground">FaithConnect</h1>
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
              <Button 
                onClick={() => setCurrentStep('signup')} 
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90 transition-all duration-300"
              >
                Start Your Journey
              </Button>
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
