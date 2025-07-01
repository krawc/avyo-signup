
import { renderHook, waitFor } from '@/test-utils';
import { vi } from 'vitest';
import { useTermsAcceptance } from '../useTermsAcceptance';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1' },
  }),
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      upsert: mockUpsert,
    })),
  },
}));

describe('useTermsAcceptance', () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockUpsert.mockClear();
    mockSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
        })),
      })),
    });
    mockUpsert.mockReturnValue(Promise.resolve({ error: null }));
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useTermsAcceptance('messaging'));
    
    expect(result.current.hasAccepted).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(typeof result.current.markAsAccepted).toBe('function');
  });

  it('updates accepted state when terms are found', async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { accepted: true }, 
            error: null 
          })),
        })),
      })),
    });

    const { result } = renderHook(() => useTermsAcceptance('messaging'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.hasAccepted).toBe(true);
  });

  it('calls markAsAccepted correctly', async () => {
    const { result } = renderHook(() => useTermsAcceptance('messaging'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    result.current.markAsAccepted();
    
    expect(mockUpsert).toHaveBeenCalledWith({
      user_id: '1',
      terms_type: 'messaging',
      accepted: true,
      accepted_at: expect.any(String),
    });
  });
});
