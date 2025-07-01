
import { render, screen, fireEvent } from '@/test-utils';
import { vi } from 'vitest';
import PhoneInput from '../PhoneInput';

describe('PhoneInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders phone input with country code selector', () => {
    render(<PhoneInput value="" countryCode="+1" onChange={mockOnChange} />);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument();
  });

  it('calls onChange when phone number is entered', () => {
    render(<PhoneInput value="" countryCode="+1" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('(555) 123-4567');
    fireEvent.change(input, { target: { value: '1234567890' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('1234567890', '+1');
  });

  it('displays the correct value', () => {
    render(<PhoneInput value="1234567890" countryCode="+1" onChange={mockOnChange} />);
    
    const input = screen.getByDisplayValue('1234567890');
    expect(input).toBeInTheDocument();
  });
});
