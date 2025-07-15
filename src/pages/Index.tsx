
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Church, MessageCircle, UserCheck, ArrowRight, Star, Quote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SignupForm from '../components/SignupForm';
import PostRegistrationForm from '../components/PostRegistrationForm';
import EmailConfirmation from '../components/EmailConfirmation';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'signup' | 'post-registration' | 'email-confirmation'>('welcome');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => {
        navigate('/profile');
      }, 2000);

      return () => clearTimeout(timeout); // cleanup on unmount
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check for event ID in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    
    if (eventId) {
      localStorage.setItem('pendingEventId', eventId);
      // If user is not authenticated, show signup flow
      if (!user && !loading) {
        setCurrentStep('signup');
      }
    }
  }, [user, loading]);

  const handleSignupComplete = () => {
    setCurrentStep('email-confirmation');
  };

  const handlePostRegistrationComplete = () => {
    navigate('/profile');
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
        <Header />
        <div className="container mx-auto px-4 py-8">
          {/* Welcome message */}
          <Card className="gradient-card border-0 shadow-lg max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                Welcome to AVYO In-Gathering!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-primary/10 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary font-medium">
                  "For where two or three gather in my name, there am I with them." - Matthew 18:20
                </p>
              </div>
              <Button onClick={() => navigate('/profile')} className="w-full">
                View My Profile
              </Button>
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
    return <PostRegistrationForm userEmail={userEmail} onBack={() => setCurrentStep('signup')} onComplete={handlePostRegistrationComplete} />;
  }

  if (currentStep === 'email-confirmation') {
    return <EmailConfirmation userEmail={userEmail} onBack={() => setCurrentStep('signup')} />;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center gap-3 mb-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                AVYO In-Gathering
              </h1>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8 border border-blue-100">
              <p className="text-lg text-gray-700 font-medium">
                AVYO In-Gathering App is designed to connect singles gathered in a specific event, allowing them to interact and match other singles of the same faith and values on the platform.
              </p>
            </div>
            <Button 
              onClick={() => setCurrentStep('signup')} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-16 bg-white/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Connect Through Faith
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience meaningful connections that honor your values and beliefs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-pink-100 to-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-10 h-10 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Make Connections</h3>
              <p className="text-muted-foreground">
                Make connections with other singles at your event who share your faith journey
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Heart className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Shared Values</h3>
              <p className="text-muted-foreground">
                Get to know who shares the same values and discover meaningful compatibility
              </p>
            </div>
            
            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Start Conversations</h3>
              <p className="text-muted-foreground">
                Start chatting with your matches and take that relationship further
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Church className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to join?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Create you account and begin to connect!
            </p>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 mb-8">
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 mb-4"
                onClick={() => setCurrentStep('signup')} 
              >
                Complete Registration
              </Button>
              
              <div className="bg-blue-50 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-700 font-medium">
                  "For where two or three gather in my name, there am I with them." - Matthew 18:20
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-col sm:flex-row">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-green-600" />
                <span>Safe & Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Church className="w-4 h-4 text-blue-600" />
                <span>Faith-Centered</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-600" />
                <span>Meaningful Connections</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
