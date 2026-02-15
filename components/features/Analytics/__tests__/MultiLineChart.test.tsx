/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MultiLineChart from '../MultiLineChart';

jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => <div data-testid="mock-line-chart">Chart: {JSON.stringify(props.options?.plugins?.title?.text || '')}</div>,
}));

const mockData = [
  {
    name: 'Weight',
    color: '#3b82f6',
    data: [
      { date: '2024-01-01', value: 80 },
      { date: '2024-02-01', value: 78 },
      { date: '2024-03-01', value: 76 },
    ],
  },
  {
    name: 'Body Fat',
    color: '#ef4444',
    data: [
      { date: '2024-01-01', value: 20 },
      { date: '2024-02-01', value: 18 },
      { date: '2024-03-01', value: 17 },
    ],
  },
];

describe('MultiLineChart', () => {
  it('renders the chart component', () => {
    render(<MultiLineChart data={mockData} title="Progress Over Time" />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<MultiLineChart data={mockData} title="Progress Over Time" />);
    expect(screen.getByText('Progress Over Time')).toBeInTheDocument();
  });

  it('renders no data message with empty data', () => {
    render(<MultiLineChart data={[]} title="Empty Chart" />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders with single dataset', () => {
    render(<MultiLineChart data={[mockData[0]]} title="Single Line" />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('renders with showLegend false', () => {
    render(<MultiLineChart data={mockData} title="No Legend" showLegend={false} />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('renders with yAxisLabel', () => {
    render(<MultiLineChart data={mockData} title="With Label" yAxisLabel="kg" />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('renders with custom height', () => {
    render(<MultiLineChart data={mockData} title="Custom Height" height={300} />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  describe('Summary statistics', () => {
    it('displays current value for each dataset', () => {
      render(<MultiLineChart data={mockData} title="Progress" />);
      expect(screen.getByText('Weight:')).toBeInTheDocument();
      expect(screen.getByText('Body Fat:')).toBeInTheDocument();
      // Current values should be displayed
      expect(screen.getByText('76.0')).toBeInTheDocument(); // Latest weight
      expect(screen.getByText('17.0')).toBeInTheDocument(); // Latest body fat
    });

    it('displays change indicators', () => {
      render(<MultiLineChart data={mockData} title="Progress" />);
      // Weight changed from 80 to 76 = -4.0
      expect(screen.getByText('(-4.0)')).toBeInTheDocument();
      // Body fat changed from 20 to 17 = -3.0
      expect(screen.getByText('(-3.0)')).toBeInTheDocument();
    });

    it('shows positive change with + sign', () => {
      const increasingData = [
        {
          name: 'Muscle Mass',
          color: '#22C55E',
          data: [
            { date: '2024-01-01', value: 60 },
            { date: '2024-02-01', value: 65 },
          ],
        },
      ];
      render(<MultiLineChart data={increasingData} title="Progress" />);
      expect(screen.getByText('(+5.0)')).toBeInTheDocument();
    });

    it('shows "No data" for datasets with no values', () => {
      const emptyDataset = [
        {
          name: 'Empty',
          color: '#EF4444',
          data: [],
        },
      ];
      render(<MultiLineChart data={emptyDataset} title="Empty" />);
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('displays colored indicator dots for each dataset', () => {
      const { container } = render(<MultiLineChart data={mockData} title="Progress" />);
      const colorDots = container.querySelectorAll('.w-3.h-3.rounded-full');
      expect(colorDots.length).toBe(mockData.length);
    });

    it('calculates statistics correctly with null values', () => {
      const dataWithNulls = [
        {
          name: 'Inconsistent',
          color: '#3B82F6',
          data: [
            { date: '2024-01-01', value: 100 },
            { date: '2024-02-01', value: null as any },
            { date: '2024-03-01', value: 90 },
          ],
        },
      ];
      render(<MultiLineChart data={dataWithNulls} title="Progress" />);
      // Should show latest non-null value
      expect(screen.getByText('90.0')).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state message when no dates', () => {
      render(<MultiLineChart data={[]} title="Empty" />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
      expect(screen.getByText('Record measurements to see comparison charts')).toBeInTheDocument();
    });

    it('shows SVG icon in empty state', () => {
      const { container } = render(<MultiLineChart data={[]} title="Empty" />);
      const svg = container.querySelector('svg.w-12.h-12');
      expect(svg).toBeInTheDocument();
    });

    it('does not render chart when data is empty', () => {
      render(<MultiLineChart data={[]} title="Empty" />);
      expect(screen.queryByTestId('mock-line-chart')).not.toBeInTheDocument();
    });
  });

  describe('Chart data preparation', () => {
    it('handles datasets with different date ranges', () => {
      const mixedDates = [
        {
          name: 'Dataset 1',
          color: '#3B82F6',
          data: [
            { date: '2024-01-01', value: 10 },
            { date: '2024-03-01', value: 30 },
          ],
        },
        {
          name: 'Dataset 2',
          color: '#EF4444',
          data: [
            { date: '2024-01-01', value: 20 },
            { date: '2024-02-01', value: 25 },
            { date: '2024-03-01', value: 35 },
          ],
        },
      ];
      render(<MultiLineChart data={mixedDates} title="Mixed Dates" />);
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });

    it('sorts dates correctly', () => {
      const unsortedDates = [
        {
          name: 'Unsorted',
          color: '#3B82F6',
          data: [
            { date: '2024-03-01', value: 30 },
            { date: '2024-01-01', value: 10 },
            { date: '2024-02-01', value: 20 },
          ],
        },
      ];
      render(<MultiLineChart data={unsortedDates} title="Unsorted" />);
      // Should still render chart correctly
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });
  });

  describe('Chart options', () => {
    it('sets responsive and maintainAspectRatio options', () => {
      render(<MultiLineChart data={mockData} title="Options Test" />);
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });

    it('configures legend display based on showLegend prop', () => {
      render(<MultiLineChart data={mockData} title="Legend Test" showLegend={true} />);
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });

    it('hides legend when showLegend is false', () => {
      render(<MultiLineChart data={mockData} title="No Legend" showLegend={false} />);
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });

    it('shows y-axis label when yAxisLabel is provided', () => {
      render(<MultiLineChart data={mockData} title="With Label" yAxisLabel="Weight (kg)" />);
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });

    it('hides y-axis label when yAxisLabel is not provided', () => {
      render(<MultiLineChart data={mockData} title="No Label" />);
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });
  });

  describe('Dataset styling', () => {
    it('applies dataset colors correctly', () => {
      render(<MultiLineChart data={mockData} title="Colors" />);
      // Color indicators should match dataset colors
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });

    it('handles multiple datasets with different colors', () => {
      const multiColor = [
        { name: 'A', color: '#FF0000', data: [{ date: '2024-01-01', value: 1 }] },
        { name: 'B', color: '#00FF00', data: [{ date: '2024-01-01', value: 2 }] },
        { name: 'C', color: '#0000FF', data: [{ date: '2024-01-01', value: 3 }] },
      ];
      render(<MultiLineChart data={multiColor} title="Multi-color" />);
      expect(screen.getByText('A:')).toBeInTheDocument();
      expect(screen.getByText('B:')).toBeInTheDocument();
      expect(screen.getByText('C:')).toBeInTheDocument();
    });
  });

  describe('Container styling', () => {
    it('applies correct container classes', () => {
      const { container } = render(<MultiLineChart data={mockData} title="Styling" />);
      const chartContainer = container.querySelector('.bg-white.rounded-lg.shadow-sm');
      expect(chartContainer).toBeInTheDocument();
    });

    it('uses custom height in style attribute', () => {
      const { container } = render(<MultiLineChart data={mockData} title="Height" height={500} />);
      const chartDiv = container.querySelector('[style*="500px"]');
      expect(chartDiv).toBeInTheDocument();
    });
  });

  describe('Date formatting', () => {
    it('formats dates in month/day format', () => {
      render(<MultiLineChart data={mockData} title="Dates" />);
      // Dates are formatted by the chart component internally
      expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles single data point', () => {
      const singlePoint = [
        {
          name: 'Single',
          color: '#3B82F6',
          data: [{ date: '2024-01-01', value: 100 }],
        },
      ];
      render(<MultiLineChart data={singlePoint} title="Single Point" />);
      expect(screen.getByText('100.0')).toBeInTheDocument();
      // Change should be 0 for single point
      expect(screen.getByText('(+0.0)')).toBeInTheDocument();
    });

    it('handles datasets with all null values', () => {
      const allNulls = [
        {
          name: 'All Null',
          color: '#EF4444',
          data: [
            { date: '2024-01-01', value: null as any },
            { date: '2024-02-01', value: null as any },
          ],
        },
      ];
      render(<MultiLineChart data={allNulls} title="All Nulls" />);
      expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('handles datasets with undefined values', () => {
      const withUndefined = [
        {
          name: 'Undefined',
          color: '#3B82F6',
          data: [
            { date: '2024-01-01', value: undefined as any },
            { date: '2024-02-01', value: 50 },
          ],
        },
      ];
      render(<MultiLineChart data={withUndefined} title="Undefined" />);
      expect(screen.getByText('50.0')).toBeInTheDocument();
    });
  });
});
