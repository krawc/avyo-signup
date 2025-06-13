
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Church } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SignupForm from '../components/SignupForm';
import PostRegistrationForm from '../components/PostRegistrationForm';
import EmailConfirmation from '../components/EmailConfirmation';

const PostRegistration = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'signup' | 'post-registration' | 'email-confirmation'>('welcome');
  const [userEmail, setUserEmail] = useState('');

  const handlePostRegistrationComplete = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Header />
      <PostRegistrationForm userEmail={userEmail} onBack={() => setCurrentStep('signup')} onComplete={handlePostRegistrationComplete} />;
    </div>
  );
};

export default PostRegistration;
