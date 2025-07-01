
import { useState } from 'react';
import { MoreVertical, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ReportUserModal from './ReportUserModal';

interface UserActionsDropdownProps {
  userId: string;
  userName?: string;
  className?: string;
}

const UserActionsDropdown = ({ userId, userName, className }: UserActionsDropdownProps) => {
  const [showReportModal, setShowReportModal] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={className}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowReportModal(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Report User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={userId}
        reportedUserName={userName}
      />
    </>
  );
};

export default UserActionsDropdown;
