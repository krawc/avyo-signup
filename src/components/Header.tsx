import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Church, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrls } from '@/lib/utils';

const Header = () => {

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState('');

  const handleSignOut = async () => {
    await signOut();
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);
  

  const fetchProfile = async () => {
    if (!user) return;
  
    const { data, error } = await supabase
      .from('profiles')
      .select('profile_picture_urls')
      .eq('id', user.id)
      .single();
  
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    console.log(data)
  
    // If there are image URLs, generate signed versions
    if (data && data.profile_picture_urls.length > 0) {
      const signedUrls = await getSignedUrls(data.profile_picture_urls);
      setProfilePic(signedUrls[0])
    } else {
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/tch_logo.png" width="50"/>
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 border-1 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage className="" src={profilePic} alt="Profile" />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-background border shadow-lg" align="end">
                <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/account-settings')} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/auth')}>
                Login
              </Button>
              <Button onClick={() => navigate('/auth')}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
