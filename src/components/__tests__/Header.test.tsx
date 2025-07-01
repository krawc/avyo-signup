
import { render, screen, fireEvent } from '@/test-utils';
import { vi } from 'vitest';
import Header from '../Header';

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
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

describe('Header', () => {
  it('renders the logo', () => {
    render(<Header />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('shows user menu when logged in', () => {
    render(<Header />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens dropdown menu on click', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });
});
