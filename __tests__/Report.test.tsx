import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('bad-words', () => {
  return {
    Filter: jest.fn().mockImplementation(() => ({
      addWords: jest.fn(),
      isProfane: jest.fn().mockReturnValue(false),
    })),
  };
});

import DiseaseReportPage from '@/components/dashboard-components/Report';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/contexts/LocationContext', () => ({
  useLocation: jest.fn(),
}));

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

describe('DiseaseReportPage', () => {
  const mockUseAuth = useAuth as jest.Mock;
  const mockUseLocation = useLocation as jest.Mock;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { $id: 'test-user-id' },
    });
    mockUseLocation.mockReturnValue({
      locationData: {
        nearest_area: {
          district_name: 'Colombo',
          province_name: 'Western'
        },
        user_location: { latitude: 6.9271, longitude: 79.8612 }
      },
      isLoading: false,
      error: null
    });
    
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the report form correctly', () => {
    render(<DiseaseReportPage />);
    
    expect(screen.getByText('Health Incident Report')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe symptoms, number of cases, affected age group, and timeline…/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Report/i })).toBeInTheDocument();
  });

  it('validates description length before submission', async () => {
    render(<DiseaseReportPage />);
    
    const textarea = screen.getByPlaceholderText(/Describe symptoms/i);
    await userEvent.type(textarea, 'Short text'); // Less than 20 chars
    
    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    await userEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/Too short — add at least/i)).toBeInTheDocument();
    });
  });

  it('shows loading state for location when location is loading', () => {
    mockUseLocation.mockReturnValue({
      locationData: null,
      isLoading: true,
      error: null
    });
    
    render(<DiseaseReportPage />);
    
    expect(screen.getByText('Detecting location…')).toBeInTheDocument();
  });
});
