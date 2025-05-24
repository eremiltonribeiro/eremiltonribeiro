import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GraphicalDashboard from './GraphicalDashboard';

// Mock Recharts to prevent actual rendering in tests, focusing on data logic
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-responsive-container">{children}</div>
    ),
    BarChart: ({ children, data }: { children: React.ReactNode, data: any[] }) => (
      <div data-testid="recharts-barchart" data-chartdata={JSON.stringify(data)}>{children}</div>
    ),
    XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="recharts-xaxis" data-datakey={dataKey}>XAxis</div>,
    YAxis: () => <div data-testid="recharts-yaxis">YAxis</div>,
    Tooltip: () => <div data-testid="recharts-tooltip">Tooltip</div>,
    Legend: () => <div data-testid="recharts-legend">Legend</div>,
    CartesianGrid: () => <div data-testid="recharts-cartesiangrid">CartesianGrid</div>,
    Bar: ({ dataKey }: { dataKey: string }) => <div data-testid="recharts-bar" data-datakey={dataKey}>Bar</div>,
  };
});

// Mock fetch globally
global.fetch = jest.fn();

// Sample data, ensuring vehicleId is used for mapping
const mockFuelRegistrations = [
  { id: 1, vehicleId: 1, date: '2023-01-01', liters: 50, fuelCost: 7500 },
  { id: 2, vehicleId: 2, date: '2023-01-05', liters: 70, fuelCost: 10500 },
  { id: 3, vehicleId: 1, date: '2023-01-10', liters: 60, fuelCost: 9000 },
];
const mockVehicles = [
  { id: 1, name: 'Truck A', plate: 'AAA111' },
  { id: 2, name: 'Truck B', plate: 'BBB222' },
];

describe('GraphicalDashboard', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
    // Default mock implementation for successful calls
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.toString().includes('/api/registrations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFuelRegistrations),
        } as Response);
      }
      if (url.toString().includes('/api/vehicles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVehicles),
        } as Response);
      }
      return Promise.reject(new Error(`Unknown endpoint: ${url}`));
    });
  });

  it('displays a loading message initially while fetching data', () => {
    render(<GraphicalDashboard />);
    expect(screen.getByText(/Data is being fetched.../i)).toBeInTheDocument();
  });

  it('displays an error message if fetching registrations fails', async () => {
    (fetch as jest.Mock).mockImplementationOnce((url) => {
       if (url.toString().includes('/api/registrations')) {
        return Promise.reject(new Error('API error registrations'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockVehicles) } as Response);
    });
    render(<GraphicalDashboard />);
    await waitFor(() => 
      expect(screen.getByText(/Error fetching data: API error registrations/i)).toBeInTheDocument()
    );
  });

  it('displays an error message if fetching vehicles fails', async () => {
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.toString().includes('/api/registrations')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockFuelRegistrations) } as Response);
      }
      if (url.toString().includes('/api/vehicles')) {
        return Promise.reject(new Error('API error vehicles'));
      }
      return Promise.reject(new Error(`Fallthrough error in mock: ${url}`));
    });
    render(<GraphicalDashboard />);
    await waitFor(() => 
      expect(screen.getByText(/Error fetching data: API error vehicles/i)).toBeInTheDocument()
    );
  });

  it('displays an error message if both API calls fail', async () => {
    (fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.reject(new Error('API error registrations')))
      .mockImplementationOnce(() => Promise.reject(new Error('API error vehicles')));
    render(<GraphicalDashboard />);
    await waitFor(() => 
      expect(screen.getByText(/Error fetching data: API error registrations/i)).toBeInTheDocument()
    );
  });

  it('processes fetched data and ensures no loading/error messages are present', async () => {
    // Fetch mock is already set up in beforeEach for successful calls
    render(<GraphicalDashboard />);

    await waitFor(() => {
      // Check that chart-related elements are present due to successful data processing
      // This implies chartData is processed
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument(); 
    });

    expect(screen.queryByText(/Data is being fetched.../i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Error fetching data/i)).not.toBeInTheDocument();
    // The "Processing data..." message is not explicitly in the component,
    // but the absence of loading/error and presence of chart implies processing is done.
  });

  it('renders the bar chart when data is successfully fetched and processed', async () => {
    // Fetch mock is set up in beforeEach
    render(<GraphicalDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('recharts-barchart')).toBeInTheDocument();
    });

    // Check for chart elements (mocked ones)
    expect(screen.getByTestId('recharts-xaxis')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-yaxis')).toBeInTheDocument();
    expect(screen.getByTestId('recharts-bar')).toBeInTheDocument();
    
    // Check if chart data is passed correctly to the mocked BarChart
    const barChartElement = screen.getByTestId('recharts-barchart');
    const chartDataAttribute = barChartElement.getAttribute('data-chartdata');
    const chartData = JSON.parse(chartDataAttribute || '[]');
    
    expect(chartData).toEqual([
      { name: 'Truck A', consumption: 110 }, // 50 + 60
      { name: 'Truck B', consumption: 70 },
    ]);
  });

  it('handles empty API responses gracefully and shows "no data" message', async () => {
    (fetch as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response))
      .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as Response));

    render(<GraphicalDashboard />);

    await waitFor(() => {
      // Component's current message for no data/empty chartData after successful fetch
      expect(screen.getByText(/No data available for chart or still processing.../i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Error fetching data/i)).not.toBeInTheDocument();
    
    // With mocks, chart components might still be in the DOM if "No data..." is inside the structure
    // but the key is that the specific "no data" message is shown.
    // If the chart was truly absent, these would fail or pass depending on component structure.
    // For now, focusing on the "no data" text.
    expect(screen.queryByTestId('recharts-bar')).not.toBeInTheDocument(); // Bar should not render if no data
  });
});
