
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, User, Calendar, MapPin, Mail, Phone, Lock } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface SignupFormProps {
  onComplete: () => void;
  onBack: () => void;
}

const SignupForm = ({ onComplete, onBack }: SignupFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    city: '',
    state: '',
    email: '',
    password: '',
    profilePictures: [] as File[]
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 3;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 5) {
      toast({
        title: "Too many files",
        description: "Please select up to 5 profile pictures.",
        variant: "destructive"
      });
      return;
    }
    setFormData(prev => ({ ...prev, profilePictures: files }));
  };

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.firstName && formData.lastName && formData.dateOfBirth && formData.gender;
      case 2:
        return formData.city && formData.state && formData.email;
      case 3:
        return formData.profilePictures.length > 0;
      default:
        return false;
    }
  };

  const handleSignup = async () => {
    //e.preventDefault();

    setIsSubmitting(true);

    const redirectUrl = `${window.location.origin}/post-registration`;
    
    const { data: signupData, error } = await supabase.auth.signUp({
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
      setIsSubmitting(false);
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

    const user = signupData?.user;

    if (user) {
      // 1. Upload profile pictures
      const uploadedUrls = [];
      for (const file of formData.profilePictures) {
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('profile-pictures')
          .upload(`public/${user.id}/${file.name}`, file);

        if (storageError) {
          console.error('Upload error:', storageError.message);
          continue;
        }

        const url = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(`public/${user.id}/${file.name}`).data.publicUrl;

        uploadedUrls.push(url);
      }

      // 2. Insert profile into `profiles` table
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        city: formData.city,
        state: formData.state,
        phone_number: formData.phoneNumber,
        profile_picture_urls: uploadedUrls,
      });

      if (profileError) {
        console.error('Profile insert error:', profileError.message);
      }
    }
    setIsSubmitting(false);
      toast({
        title: "Check your email!",
        description: "We've sent you a confirmation link to complete your registration.",
      });
    }
    onComplete();
    //setLoading(false);
  };


  const handleNext = () => {
    if (validateStep(step)) {
      if (step === totalSteps) {
        // Simulate successful registration
        handleSignup()
      } else {
        setStep(step + 1);
      }
    } else {
      toast({
        title: "Please complete all required fields",
        description: "All fields marked with * are required.",
        variant: "destructive"
      });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={handlePrevious}
              className="mb-4 hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Join Our Community</h1>
              <p className="text-muted-foreground">Step {step} of {totalSteps}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 mt-4">
                <div 
                  className="bg-primary rounded-full h-2 transition-all duration-300"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <Card className="gradient-card border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {step === 1 && <><User className="w-5 h-5" /> What's your name?</>}
                {step === 2 && <><MapPin className="w-5 h-5" /> Where do you live?</>}
                {step === 3 && <><Upload className="w-5 h-5" /> Share your photo</>}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Let's start with some basic information about you."}
                {step === 2 && "Help us connect you with believers in your area."}
                {step === 3 && "Upload a clear photo of yourself (showing your face)."}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="John"
                        className="bg-white/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Smith"
                        className="bg-white/50 border-white/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="bg-white/50 border-white/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className="bg-white/50 border-white/20">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Dallas"
                        className="bg-white/50 border-white/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="TX"
                        className="bg-white/50 border-white/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="john.smith@email.com"
                        className="bg-white/50 border-white/20 pl-10"
                      />
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="(555) 123-4567"
                        className="bg-white/50 border-white/20 pl-10"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">Upload Your Profile Pictures</p>
                      <p className="text-muted-foreground mb-4">
                        Choose 1-5 clear photos that show your face. This helps build trust in our community.
                      </p>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="profile-pictures"
                      />
                      <Label htmlFor="profile-pictures">
                        <Button variant="outline" className="cursor-pointer" asChild>
                          <span>Choose Photos</span>
                        </Button>
                      </Label>
                    </div>

                    {formData.profilePictures.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Selected Photos:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {formData.profilePictures.map((file, index) => (
                            <div key={index} className="bg-muted rounded p-2 text-sm">
                              {file.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-accent/20 rounded-lg p-4">
                      <h4 className="font-medium text-accent-foreground mb-2">Photo Guidelines:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Show your face clearly</li>
                        <li>• Use recent photos</li>
                        <li>• Keep it family-friendly</li>
                        <li>• Good lighting preferred</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}

              <Button 
                onClick={handleNext}
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90 transition-all duration-300"
              >
                {step === totalSteps ? 'Create Account' : 'Continue'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
