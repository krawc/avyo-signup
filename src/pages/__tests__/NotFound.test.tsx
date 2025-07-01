
import { render, screen } from '@/test-utils';
import NotFound from '../NotFound';

describe('NotFound', () => {
  it('renders 404 error message', () => {
    render(<NotFound />);
    
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    expect(screen.getByText('Return to Home')).toBeInTheDocument();
  });

  it('has a link to home page', () => {
    render(<NotFound />);
    
    const homeLink = screen.getByText('Return to Home');
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
