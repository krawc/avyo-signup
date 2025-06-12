
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SignupForm from '@/components/SignupForm';
import PostRegistrationForm from '@/components/PostRegistrationForm';
import EmailConfirmation from '@/components/EmailConfirmation';

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'signup' | 'email-confirmation' | 'post-registration'>('signup');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (!loading && user) {
      // Check if user has completed post-registration
      if (user.email_confirmed_at) {
        // User is confirmed, check if they need to complete profile
        navigate('/profile');
      } else {
        // User exists but email not confirmed
        setCurrentStep('email-confirmation');
        setUserEmail(user.email || '');
      }
    }
  }, [user, loading, navigate]);

  const handleSignupSuccess = (email: string, needsConfirmation: boolean) => {
    setUserEmail(email);
    if (needsConfirmation) {
      setCurrentStep('email-confirmation');
    } else {
      setCurrentStep('post-registration');
    }
  };

  const handleEmailConfirmed = () => {
    setCurrentStep('post-registration');
  };

  const handlePostRegistrationComplete = () => {
    navigate('/profile');
  };

  const handleBackToSignup = () => {
    setCurrentStep('signup');
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'email-confirmation') {
    return (
      <EmailConfirmation 
        userEmail={userEmail}
        onBack={handleBackToSignup}
      />
    );
  }

  if (currentStep === 'post-registration') {
    return (
      <PostRegistrationForm
        userEmail={userEmail}
        onBack={handleBackToSignup}
        onComplete={handlePostRegistrationComplete}
      />
    );
  }

  return (
    <SignupForm 
      onSignupSuccess={handleSignupSuccess}
    />
  );
};

export default Auth;
