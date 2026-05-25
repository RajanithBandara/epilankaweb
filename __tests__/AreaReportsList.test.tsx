import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AreaReportsList from '@/components/shared/AreaReportsList';
import { useAuth } from '@/contexts/AuthContext';

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock resize observer which might be needed by some Radix UI components
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

describe('AreaReportsList', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { $id: 'test-user-id' },
    });
    
    // Clear mock fetch calls
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading state initially', () => {
    // Keep fetch pending
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<AreaReportsList />);
    
    expect(screen.getByText(/loading area reports.../i)).toBeInTheDocument();
  });

  it('renders no reports available state when no data is returned', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/map/locations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ locations: [] }),
        });
      }
      if (url.includes('/api/reports/location')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ reports: [] }),
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<AreaReportsList />);
    
    await waitFor(() => {
      expect(screen.getByText(/no reports available for the selected period/i)).toBeInTheDocument();
    });
  });

  it('renders fetched area reports and allows expansion', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/map/locations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ locations: [] }),
        });
      }
      if (url.includes('/api/reports/location')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            reports: [
              {
                report_id: '1',
                description: 'Test report description',
                district_info: {
                  district_name: 'Colombo',
                  province_name: 'Western'
                },
                extracted_data: {
                  disease_name: 'Dengue'
                },
                status: 'verified',
                score: 10,
                has_voted: false
              }
            ]
          }),
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<AreaReportsList />);
    
    // Wait for the loading to finish and component to render
    await waitFor(() => {
      expect(screen.queryByText(/loading area reports.../i)).not.toBeInTheDocument();
    });

    // Check if the district header is rendered
    expect(screen.getByText('Colombo')).toBeInTheDocument();
    expect(screen.getByText('Western')).toBeInTheDocument();
    
    // Check if summary stats are rendered
    expect(screen.getByText('Total Areas')).toBeInTheDocument();
    expect(screen.getByText('Total Reports')).toBeInTheDocument();

    // Try expanding the district to see the report
    const districtHeader = screen.getByText('Colombo').closest('button');
    expect(districtHeader).toBeInTheDocument();
    
    await userEvent.click(districtHeader!);
    
    // Check if report details are rendered inside expanded view
    await waitFor(() => {
      expect(screen.getByText('Dengue')).toBeInTheDocument();
      expect(screen.getByText('Test report description')).toBeInTheDocument();
    });
  });
});
