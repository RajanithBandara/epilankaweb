import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuthPage from '@/components/AuthPage';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Appwrite account
jest.mock('@/lib/appwrite', () => ({
  account: {
    get: jest.fn().mockRejectedValue(new Error('No session')),
    createEmailPasswordSession: jest.fn(),
    createJWT: jest.fn(),
    deleteSession: jest.fn(),
    create: jest.fn(),
    createEmailToken: jest.fn(),
  },
  ID: {
    unique: () => 'unique-id',
  },
}));

describe('AuthPage', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockUseRouter = useRouter as jest.Mock;
  const mockPush = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      refreshUser: jest.fn(),
    });
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders login mode by default', async () => {
    render(<AuthPage />);
    
    // Check for login specific headers
    expect(screen.getByText('Access your workspace')).toBeInTheDocument();
    
    // Check for Email and Password inputs
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    
    // Full name should NOT be present in login mode
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
  });

  it('switches to signup mode when tab is clicked', async () => {
    render(<AuthPage />);
    
    const signupTab = screen.getByRole('button', { name: /Create account/i });
    await userEvent.click(signupTab);
    
    await waitFor(() => {
      expect(screen.getByText('Create your account')).toBeInTheDocument();
    });
    
    // Full name should be present in signup mode
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
  });

  it('shows error message on failed login submission', async () => {
    render(<AuthPage />);
    
    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    const { account } = require('@/lib/appwrite');
    account.createEmailPasswordSession.mockRejectedValue(new Error('Invalid credentials'));
    
    const submitBtn = screen.getAllByRole('button', { name: /Sign in/i })[1];
    await userEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
