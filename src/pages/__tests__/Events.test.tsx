
import { render, screen } from '@/test-utils';
import { vi } from 'vitest';
import Events from '../Events';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));

describe('Events', () => {
  it('renders events page header', () => {
    render(<Events />);
    
    expect(screen.getByText('AVYO In-Gathering Events')).toBeInTheDocument();
    expect(screen.getByText('Discover and join upcoming Christian community events')).toBeInTheDocument();
  });

  it('shows no events message when no events exist', async () => {
    render(<Events />);
    
    // Wait for loading to complete and check for no events message
    expect(await screen.findByText('No Events Yet')).toBeInTheDocument();
    expect(screen.getByText('Check back soon for upcoming events!')).toBeInTheDocument();
  });
});
