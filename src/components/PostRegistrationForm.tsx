
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Heart, Church, BookOpen } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface PostRegistrationFormProps {
  userEmail: string;
  onBack: () => void;
}

const PostRegistrationForm = ({ userEmail, onBack }: PostRegistrationFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    displayName: '',
    maritalStatus: '',
    hasKids: '',
    churchName: '',
    pastorName: '',
    lifeVerse: ''
  });

  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.displayName.trim() !== '';
      case 2:
        return formData.maritalStatus && formData.hasKids;
      case 3:
        return formData.lifeVerse.trim() !== '';
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === totalSteps) {
        // Simulate successful profile completion
        toast({
          title: "Profile completed successfully!",
          description: "Welcome to the AVYO In-Gathering community!",
        });
        // Here we would typically redirect to the main app
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
              <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
              <p className="text-muted-foreground">Step {step} of {totalSteps} • Welcome, {userEmail}!</p>
              
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
                {step === 1 && <><User className="w-5 h-5" /> How should we call you?</>}
                {step === 2 && <><Heart className="w-5 h-5" /> Tell us about your family</>}
                {step === 3 && <><BookOpen className="w-5 h-5" /> Share your faith journey</>}
              </CardTitle>
              <CardDescription>
                {step === 1 && "Choose a display name that represents you in our community."}
                {step === 2 && "Help us understand your family situation and church background."}
                {step === 3 && "Share your life verse and complete your spiritual profile."}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      placeholder="John S. or Pastor John"
                      className="bg-white/50 border-white/20"
                    />
                    <p className="text-sm text-muted-foreground">
                      This is how other community members will see you. You can use your first name, initials, or a title.
                    </p>
                  </div>

                  <div className="bg-accent/20 rounded-lg p-4">
                    <h4 className="font-medium text-accent-foreground mb-2">Display Name Tips:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Keep it friendly and approachable</li>
                      <li>• Consider including your role (Pastor, Mom, etc.)</li>
                      <li>• You can change this later in settings</li>
                      <li>• Use your real name or a recognizable nickname</li>
                    </ul>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">Marital Status *</Label>
                    <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange('maritalStatus', value)}>
                      <SelectTrigger className="bg-white/50 border-white/20">
                        <SelectValue placeholder="Select your marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                        <SelectItem value="engaged">Engaged</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hasKids">Do you have kids? *</Label>
                    <Select value={formData.hasKids} onValueChange={(value) => handleInputChange('hasKids', value)}>
                      <SelectTrigger className="bg-white/50 border-white/20">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="expecting">Expecting</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="churchName">Local Church (Optional)</Label>
                    <div className="relative">
                      <Church className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="churchName"
                        value={formData.churchName}
                        onChange={(e) => handleInputChange('churchName', e.target.value)}
                        placeholder="First Baptist Church of Dallas"
                        className="bg-white/50 border-white/20 pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pastorName">Pastor's Name (Optional)</Label>
                    <Input
                      id="pastorName"
                      value={formData.pastorName}
                      onChange={(e) => handleInputChange('pastorName', e.target.value)}
                      placeholder="Pastor Smith"
                      className="bg-white/50 border-white/20"
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="lifeVerse">Life Verse *</Label>
                    <Textarea
                      id="lifeVerse"
                      value={formData.lifeVerse}
                      onChange={(e) => handleInputChange('lifeVerse', e.target.value)}
                      placeholder="For I know the plans I have for you, declares the Lord... - Jeremiah 29:11"
                      className="bg-white/50 border-white/20 min-h-[120px] resize-none"
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      Share the Bible verse that means the most to you or guides your life.
                    </p>
                  </div>

                  <div className="bg-primary/10 rounded-lg p-6 text-center">
                    <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h4 className="font-medium text-primary mb-2">You're Almost Done!</h4>
                    <p className="text-sm text-muted-foreground">
                      Your life verse will be displayed on your profile and helps other believers connect with your faith journey.
                    </p>
                  </div>

                  {formData.lifeVerse && (
                    <div className="bg-white/60 rounded-lg p-4 border-l-4 border-primary">
                      <p className="italic text-foreground">"{formData.lifeVerse}"</p>
                    </div>
                  )}
                </>
              )}

              <Button 
                onClick={handleNext}
                className="w-full text-lg py-6 bg-primary hover:bg-primary/90 transition-all duration-300"
              >
                {step === totalSteps ? 'Complete Profile' : 'Continue'}
              </Button>
            </CardContent>
          </Card>

          {step === totalSteps && (
            <Card className="gradient-card border-0 shadow-lg mt-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    "Therefore encourage one another and build each other up" - 1 Thessalonians 5:11
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostRegistrationForm;
