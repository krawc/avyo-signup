
import { render, screen, fireEvent } from '@/test-utils';
import { vi } from 'vitest';
import AccountSettings from '../AccountSettings';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    signOut: vi.fn(),
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(() => Promise.resolve({ error: null })),
    },
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AccountSettings', () => {
  it('renders account settings page', () => {
    render(<AccountSettings />);
    
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('displays user email', () => {
    render(<AccountSettings />);
    
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('has password change form', () => {
    render(<AccountSettings />);
    
    expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
  });

  it('has delete account section', () => {
    render(<AccountSettings />);
    
    expect(screen.getByText('Delete Account')).toBeInTheDocument();
    expect(screen.getByText('Permanently delete your account and all associated data')).toBeInTheDocument();
  });

  it('has back to profile button', () => {
    render(<AccountSettings />);
    
    expect(screen.getByText('Back to Profile')).toBeInTheDocument();
  });
});
