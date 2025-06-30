
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit, Upload, Save, X, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import PhoneInput from './PhoneInput';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  date_of_birth: string | null;
  age_range: string | null;
  gender: string | null;
  phone_number: string | null;
  city: string | null;
  state: string | null;
  church_name: string | null;
  marital_status: string | null;
  has_kids: string | null;
  life_verse: string | null;
  profile_picture_urls: string[] | null;
}

interface ProfileEditorProps {
  profile: Profile;
  onUpdate: (profile: Profile) => void;
  onCancel: () => void;
}

const ProfileEditor = ({ profile, onUpdate, onCancel }: ProfileEditorProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [newProfilePictures, setNewProfilePictures] = useState<File[]>([]);

  const ageRanges = [
    { value: 'Below 25', label: 'Below 25' },
    { value: '26-30', label: '26-30' },
    { value: '31-35', label: '31-35' },
    { value: '36-40', label: '36-40' },
    { value: '41-45', label: '41-45' },
    { value: '46-50', label: '46-50' },
    { value: '51-55', label: '51-55' },
    { value: '56-60', label: '56-60' },
    { value: '61-65', label: '61-65' },
    { value: '66-70', label: '66-70' },
    { value: '71-75', label: '71-75' },
    { value: '76+', label: '76+' },
  ];

  const maritalStatusOptions = [
    { value: 'single', label: 'Single' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' }
  ];

  const hasKidsOptions = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Yes' },
    { value: 'want_kids', label: 'Want Kids' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (phone: string, countryCode: string) => {
    setEditedProfile(prev => ({ 
      ...prev, 
      phone_number: countryCode + phone 
    }));
  };

  const getPhoneComponents = (fullPhone: string) => {
    if (!fullPhone) return { phone: '', countryCode: '+1' };
    
    const codes = ['+234', '+91', '+86', '+81', '+61', '+55', '+52', '+49', '+44', '+39', '+34', '+33', '+27', '+1'];
    
    for (const code of codes) {
      if (fullPhone.startsWith(code)) {
        return {
          countryCode: code,
          phone: fullPhone.substring(code.length)
        };
      }
    }
    
    return { phone: fullPhone, countryCode: '+1' };
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
    setNewProfilePictures(files);
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      let uploadedUrls = editedProfile.profile_picture_urls || [];

      // Upload new profile pictures if any
      if (newProfilePictures.length > 0) {
        uploadedUrls = [];
        for (const file of newProfilePictures) {
          const { data: storageData, error: storageError } = await supabase
            .storage
            .from('profile-pictures')
            .upload(`public/${profile.id}/${file.name}`, file);

          if (storageError) {
            console.error('Upload error:', storageError.message);
            continue;
          }

          const url = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(`public/${profile.id}/${file.name}`).data.publicUrl;

          uploadedUrls.push(url);
        }
      }

      console.log(editedProfile)

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          display_name: editedProfile.display_name,
          date_of_birth: editedProfile.date_of_birth,
          age_range: editedProfile.age_range,
          gender: editedProfile.gender,
          phone_number: editedProfile.phone_number,
          city: editedProfile.city,
          state: editedProfile.state,
          church_name: editedProfile.church_name,
          marital_status: editedProfile.marital_status,
          has_kids: editedProfile.has_kids,
          life_verse: editedProfile.life_verse,
          profile_picture_urls: uploadedUrls,
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      const updatedProfile = { ...editedProfile, profile_picture_urls: uploadedUrls };
      onUpdate(updatedProfile);
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { phone, countryCode } = getPhoneComponents(editedProfile.phone_number || '');

  return (
    <Card className="gradient-card border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="w-5 h-5" />
          Edit Profile
        </CardTitle>
        <CardDescription>
          Update your profile information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Picture */}
        <div className="space-y-4">
          <Label>Profile Pictures</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={editedProfile.profile_picture_urls?.[0] || ''} 
                alt="Profile" 
              />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="edit-profile-pictures"
              />
              <Label htmlFor="edit-profile-pictures">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Photos
                  </span>
                </Button>
              </Label>
              {newProfilePictures.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {newProfilePictures.length} photo(s) selected
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-firstName">First Name</Label>
            <Input
              id="edit-firstName"
              value={editedProfile.first_name || ''}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-lastName">Last Name</Label>
            <Input
              id="edit-lastName"
              value={editedProfile.last_name || ''}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-displayName">Display Name</Label>
          <Input
            id="edit-displayName"
            value={editedProfile.display_name || ''}
            onChange={(e) => handleInputChange('display_name', e.target.value)}
            placeholder="How you'd like to be called"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
            <Input
              id="edit-dateOfBirth"
              type="date"
              value={editedProfile.date_of_birth || ''}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-ageRange">Age Range</Label>
            <Select value={editedProfile.age_range || ''} onValueChange={(value) => handleInputChange('age_range', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select age range" />
              </SelectTrigger>
              <SelectContent>
                {ageRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-gender">Gender</Label>
          <Select value={editedProfile.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-city">City</Label>
            <Input
              id="edit-city"
              value={editedProfile.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-state">State</Label>
            <Input
              id="edit-state"
              value={editedProfile.state || ''}
              onChange={(e) => handleInputChange('state', e.target.value)}
              placeholder="State"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <PhoneInput
            value={phone}
            countryCode={countryCode}
            onChange={handlePhoneChange}
          />
        </div>

        {/* Additional Information */}
        <div className="space-y-2">
          <Label htmlFor="edit-churchName">Church Name</Label>
          <Input
            id="edit-churchName"
            value={editedProfile.church_name || ''}
            onChange={(e) => handleInputChange('church_name', e.target.value)}
            placeholder="Your church name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-maritalStatus">Marital Status</Label>
            <Select value={editedProfile.marital_status || ''} onValueChange={(value) => handleInputChange('marital_status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {maritalStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-hasKids">Children</Label>
            <Select value={editedProfile.has_kids || ''} onValueChange={(value) => handleInputChange('has_kids', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                {hasKidsOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-lifeVerse">Life Verse</Label>
          <Textarea
            id="edit-lifeVerse"
            value={editedProfile.life_verse || ''}
            onChange={(e) => handleInputChange('life_verse', e.target.value)}
            placeholder="Your favorite Bible verse"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            onClick={onCancel} 
            variant="outline"
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileEditor;
