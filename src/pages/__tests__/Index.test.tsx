
import { render, screen } from '@/test-utils';
import { vi } from 'vitest';
import Index from '../Index';

// Mock the auth context for unauthenticated user
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

describe('Index', () => {
  it('renders main landing page', () => {
    render(<Index />);
    
    expect(screen.getByText('AVYO In-Gathering')).toBeInTheDocument();
    expect(screen.getByText(/AVYO In-Gathering App is designed to connect singles/)).toBeInTheDocument();
  });

  it('has start journey button', () => {
    render(<Index />);
    
    expect(screen.getByText('Start Your Journey')).toBeInTheDocument();
  });

  it('shows feature sections', () => {
    render(<Index />);
    
    expect(screen.getByText('Make Connections')).toBeInTheDocument();
    expect(screen.getByText('Shared Values')).toBeInTheDocument();
    expect(screen.getByText('Start Conversations')).toBeInTheDocument();
  });

  it('has registration CTA', () => {
    render(<Index />);
    
    expect(screen.getByText('Ready to join?')).toBeInTheDocument();
    expect(screen.getByText('Complete Registration Form')).toBeInTheDocument();
  });

  it('shows biblical quote', () => {
    render(<Index />);
    
    expect(screen.getByText(/For where two or three gather/)).toBeInTheDocument();
  });
});
