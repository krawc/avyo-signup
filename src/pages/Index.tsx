
import { useState } from 'react';
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
              <CardDescription className="text-lg">
                Hello {user.email}! Your faith community awaits.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                You're now part of our growing Christian community. Here you can connect with believers, 
                share your faith journey, and grow together in Christ.
              </p>
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
              <Church className="w-12 h-12 text-blue-600" />
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                AVYO In-Gathering
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Connecting single people within the same event through faith and shared values
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mb-8 border border-blue-100">
              <p className="text-lg text-gray-700 font-medium">
                "AVYO In-Gathering App is designed to connect singles gathered in a specific event, allowing them to interact and match other singles of the same faith and values on the platform."
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

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stories of Faith & Connection
            </h2>
            <p className="text-xl text-muted-foreground">
              See how believers are finding meaningful relationships through our platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="gradient-card border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  "I found my prayer partner and now my best friend through AVYO. It's amazing to connect with someone who truly understands my faith journey."
                </p>
                <div className="text-sm font-medium">Sarah M.</div>
                <div className="text-xs text-muted-foreground">Youth Retreat 2024</div>
              </CardContent>
            </Card>
            
            <Card className="gradient-card border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  "The platform helped me connect with like-minded believers at our church conference. We're still in touch and growing together in faith!"
                </p>
                <div className="text-sm font-medium">David L.</div>
                <div className="text-xs text-muted-foreground">Faith Conference</div>
              </CardContent>
            </Card>
            
            <Card className="gradient-card border-0 shadow-lg md:col-span-2 lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-blue-500 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  "What I love most is knowing that everyone here shares my values. It makes conversations so much more meaningful and authentic."
                </p>
                <div className="text-sm font-medium">Rachel K.</div>
                <div className="text-xs text-muted-foreground">Singles Ministry</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Church className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Ready to Connect Through Faith?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Join thousands of believers who are building meaningful relationships grounded in Christian values. 
              Your faith community is waiting to welcome you home.
            </p>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 mb-8">
              <h3 className="text-xl font-semibold mb-4 text-blue-700">Complete Your Faith Profile</h3>
              <p className="text-muted-foreground mb-6">
                Fill out our thoughtful questionnaire to help us connect you with believers who share your values, 
                interests, and spiritual journey.
              </p>
              
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 mb-4"
                onClick={() => setCurrentStep('signup')} 
              >
                Complete Registration Form
              </Button>
              
              <div className="bg-blue-50 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-700 font-medium">
                  "For where two or three gather in my name, there am I with them." - Matthew 18:20
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
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
