
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { vi } from 'vitest';
import TermsAndConditions from '../TermsAndConditions';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1' },
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('TermsAndConditions', () => {
  const mockOnClose = vi.fn();
  const mockOnAccept = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnAccept.mockClear();
  });

  it('renders messaging terms when termsType is messaging', () => {
    render(
      <TermsAndConditions
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        termsType="messaging"
      />
    );

    expect(screen.getByText('Messaging Terms and Conditions')).toBeInTheDocument();
    expect(screen.getByText('I Agree')).toBeInTheDocument();
    expect(screen.getByText('I Disagree')).toBeInTheDocument();
  });

  it('renders location sharing terms when termsType is location_sharing', () => {
    render(
      <TermsAndConditions
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        termsType="location_sharing"
      />
    );

    expect(screen.getByText('Location Sharing Terms and Conditions')).toBeInTheDocument();
  });

  it('calls onClose when disagree button is clicked', () => {
    render(
      <TermsAndConditions
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        termsType="messaging"
      />
    );

    fireEvent.click(screen.getByText('I Disagree'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onAccept when agree button is clicked', async () => {
    render(
      <TermsAndConditions
        isOpen={true}
        onClose={mockOnClose}
        onAccept={mockOnAccept}
        termsType="messaging"
      />
    );

    fireEvent.click(screen.getByText('I Agree'));
    await waitFor(() => {
      expect(mockOnAccept).toHaveBeenCalled();
    });
  });
});
