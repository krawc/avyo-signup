
import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { vi } from 'vitest';
import Auth from '../Auth';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
      signUp: vi.fn(() => Promise.resolve({ error: null })),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('Auth', () => {
  it('renders login form by default', () => {
    render(<Auth />);
    
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('switches to signup form when link is clicked', () => {
    render(<Auth />);
    
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
  });

  it('requires all fields for signup', async () => {
    render(<Auth />);
    
    fireEvent.click(screen.getByText("Don't have an account? Sign up"));
    
    const firstNameInput = screen.getByPlaceholderText('John');
    const lastNameInput = screen.getByPlaceholderText('Smith');
    const emailInput = screen.getByPlaceholderText('john@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    
    expect(firstNameInput).toBeRequired();
    expect(lastNameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('has back to home button', () => {
    render(<Auth />);
    
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });
});
