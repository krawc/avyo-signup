
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import MatchesTable from './MatchesTable';

interface Match {
  user_id: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    profile_picture_urls: string[] | null;
  };
  compatibility_score: number;
}

interface AllMatchesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onMatchResponse: (targetUserId: string, response: 'yes' | 'no') => void;
  onInteractionAttempt?: () => void;
}

const AllMatchesPopup = ({ 
  isOpen, 
  onClose, 
  eventId, 
  onMatchResponse, 
  onInteractionAttempt 
}: AllMatchesPopupProps) => {
  const { user } = useAuth();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadAllMatches();
    }
  }, [isOpen, eventId, user]);

  const loadAllMatches = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-filtered-matches', {
        body: { eventId, excludeUserIds: [], limit: 50 }
      });

      if (error) throw error;

      const matchesWithSignedUrls = await Promise.all(
        (data || []).map(async (match: Match) => {
          const rawUrls: string[] = match.profile?.profile_picture_urls || [];
          const signedUrls = await getSignedUrls(rawUrls);
          
          return {
            ...match,
            profile: {
              ...match.profile,
              profile_picture_urls: signedUrls,
            }
          };
        })
      );

      setAllMatches(matchesWithSignedUrls);
    } catch (error) {
      console.error('Error loading all matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchResponse = (targetUserId: string, response: 'yes' | 'no') => {
    onMatchResponse(targetUserId, response);
    setAllMatches(prev => prev.filter(match => match.user_id !== targetUserId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>All Potential Matches</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[70vh] w-full">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Loading all matches...</div>
            </div>
          ) : allMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No more matches available.
            </div>
          ) : (
            <div className="p-4">
              <MatchesTable 
                eventId={eventId}
                excludeUserIds={[]}
                onMatchResponse={handleMatchResponse}
                matches={allMatches}
              />
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const getSignedUrls = async (urls: string[]): Promise<string[]> => {
  if (!urls || urls.length === 0) return [];
  
  try {
    const signedUrls = await Promise.all(
      urls.map(async (url) => {
        if (!url) return '';
        
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const bucketPath = `profile-pictures/${fileName}`;
        
        const { data } = await supabase.storage
          .from('profile-pictures')
          .createSignedUrl(bucketPath, 3600);
        
        return data?.signedUrl || '';
      })
    );
    
    return signedUrls;
  } catch (error) {
    console.error('Error creating signed URLs:', error);
    return urls;
  }
};

export default AllMatchesPopup;
