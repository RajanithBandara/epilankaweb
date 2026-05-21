import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBell from '@/components/dashboard-components/NotificationBell';
import { useNotifications } from '@/hooks/useNotifications';

// Mock the hook
jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: jest.fn(),
}));

// Mock NotificationPanel so we don't have to test its whole internal logic here
jest.mock('@/components/dashboard-components/NotificationPanel', () => {
  return function MockNotificationPanel({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="notification-panel">
        <button onClick={onClose}>Close Panel</button>
      </div>
    );
  };
});

describe('NotificationBell', () => {
  const mockUseNotifications = useNotifications as jest.Mock;

  beforeEach(() => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 0,
      latestNew: null,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the bell icon without badge when there are no unread notifications', () => {
    render(<NotificationBell />);
    
    expect(screen.getByTitle('Notifications')).toBeInTheDocument();
    
    // There shouldn't be any badge text showing unread counts
    expect(screen.queryByText(/[0-9]+/)).not.toBeInTheDocument();
  });

  it('renders a badge with the correct count when there are unread notifications', () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 5,
      latestNew: null,
    });

    render(<NotificationBell />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTitle('5 unread notifications')).toBeInTheDocument();
  });

  it('shows 99+ when unread count is greater than 99', () => {
    mockUseNotifications.mockReturnValue({
      unreadCount: 150,
      latestNew: null,
    });

    render(<NotificationBell />);
    
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('opens and closes the notification panel when clicked', async () => {
    render(<NotificationBell />);
    
    // Panel should not be open initially
    expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument();
    
    const bellButton = screen.getByTitle('Notifications');
    await userEvent.click(bellButton);
    
    // Panel should open
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    
    // Click the mock close button inside the panel
    const closeBtn = screen.getByText('Close Panel');
    await userEvent.click(closeBtn);
    
    // Panel should close
    await waitFor(() => {
      expect(screen.queryByTestId('notification-panel')).not.toBeInTheDocument();
    });
  });
});
