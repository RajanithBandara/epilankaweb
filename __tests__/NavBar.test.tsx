import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavBar from '@/components/layout/NavBar';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: any) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

describe('NavBar', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockUseRouter = useRouter as jest.Mock;
  const mockUsePathname = usePathname as jest.Mock;
  const mockPush = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });
    mockUsePathname.mockReturnValue('/');
    
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders navigation links and brand name', () => {
    render(<NavBar />);
    
    expect(screen.getByText('EpiWatch Lanka')).toBeInTheDocument();
    
    // Links
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('EpiGuard')).toBeInTheDocument();
  });

  it('renders login button when user is not authenticated', () => {
    render(<NavBar />);
    
    // There might be mobile and desktop login buttons
    const loginButtons = screen.getAllByText('Login');
    expect(loginButtons.length).toBeGreaterThan(0);
  });

  it('renders avatar/dashboard button when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        $id: '123',
        name: 'Test User',
        email: 'test@example.com'
      },
      loading: false,
    });

    render(<NavBar />);
    
    await waitFor(() => {
      // The button has title "Test User\ntest@example.com"
      const dashButton = screen.getByRole('button', { name: /go to dashboard/i });
      expect(dashButton).toBeInTheDocument();
      expect(dashButton).toHaveAttribute('title', 'Test User\ntest@example.com');
    });
  });

  it('navigates to dashboard when avatar is clicked', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        $id: '123',
        name: 'Test User',
        email: 'test@example.com'
      },
      loading: false,
    });

    render(<NavBar />);
    
    const dashButton = screen.getByRole('button', { name: /go to dashboard/i });
    await userEvent.click(dashButton);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
