
import { render, screen } from '@/test-utils';
import { vi } from 'vitest';
import QRScanner from '../QRScanner';

// Mock navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock ZXing library
vi.mock('@zxing/library', () => ({
  BrowserMultiFormatReader: vi.fn(() => ({
    listVideoInputDevices: vi.fn(() => Promise.resolve([])),
    decodeFromVideoDevice: vi.fn(),
    reset: vi.fn(),
  })),
}));

describe('QRScanner', () => {
  it('renders QR scanner page', () => {
    render(<QRScanner />);
    
    expect(screen.getByText('QR Code Scanner')).toBeInTheDocument();
    expect(screen.getByText('Scan QR codes to quickly navigate to links or pages')).toBeInTheDocument();
  });

  it('has back button', () => {
    render(<QRScanner />);
    
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('has start scanning button', () => {
    render(<QRScanner />);
    
    expect(screen.getByText('Start Scanning')).toBeInTheDocument();
  });

  it('has camera video element', () => {
    render(<QRScanner />);
    
    const video = screen.getByRole('generic', { hidden: true });
    expect(video.tagName).toBe('VIDEO');
  });

  it('shows instructions', () => {
    render(<QRScanner />);
    
    expect(screen.getByText(/Position the QR code within the camera view/)).toBeInTheDocument();
  });
});
