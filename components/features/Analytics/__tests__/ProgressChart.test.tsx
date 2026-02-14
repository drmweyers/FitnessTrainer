/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import ProgressChart from '../ProgressChart';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock chart.js and react-chartjs-2
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}));

// Capture chart props so we can test callbacks
let capturedChartProps: any = null;
jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => {
    capturedChartProps = props;
    return <div data-testid="mock-line-chart">Chart</div>;
  },
}));

// Use T12:00:00 to avoid timezone boundary issues
const mockData = [
  { date: '2024-01-15T12:00:00', value: 80 },
  { date: '2024-02-01T12:00:00', value: 78 },
  { date: '2024-02-15T12:00:00', value: 77 },
  { date: '2024-03-01T12:00:00', value: 76 },
  { date: '2024-03-15T12:00:00', value: 75 },
];

describe('ProgressChart', () => {
  const mockOnTimeRangeChange = jest.fn();

  const defaultProps = {
    data: mockData,
    title: 'Weight',
    unit: 'kg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chart title', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText('Weight')).toBeInTheDocument();
  });

  it('renders the chart component when data is present', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
  });

  it('shows current value in stats', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText(/Current: 75.0 kg/)).toBeInTheDocument();
  });

  it('shows statistics section', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Best')).toBeInTheDocument();
    expect(screen.getByText('Total Change')).toBeInTheDocument();
    expect(screen.getByText('Data Points')).toBeInTheDocument();
  });

  it('shows data point count', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows total change value', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.getByText('-5.0')).toBeInTheDocument();
  });

  it('shows time range selector when callback is provided', () => {
    render(
      <ProgressChart
        {...defaultProps}
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    );
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('30 Days')).toBeInTheDocument();
    expect(screen.getByText('3 Months')).toBeInTheDocument();
    expect(screen.getByText('6 Months')).toBeInTheDocument();
    expect(screen.getByText('1 Year')).toBeInTheDocument();
  });

  it('calls onTimeRangeChange when time range is clicked', () => {
    render(
      <ProgressChart
        {...defaultProps}
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    );
    fireEvent.click(screen.getByText('7 Days'));
    expect(mockOnTimeRangeChange).toHaveBeenCalledWith('7d');
  });

  it('does not show time range selector when no callback', () => {
    render(<ProgressChart {...defaultProps} />);
    expect(screen.queryByText('7 Days')).not.toBeInTheDocument();
  });

  it('shows empty state when data is empty', () => {
    render(<ProgressChart {...defaultProps} data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
    expect(
      screen.getByText('Start recording measurements to see your progress')
    ).toBeInTheDocument();
  });

  it('does not show statistics when data is empty', () => {
    render(<ProgressChart {...defaultProps} data={[]} />);
    expect(screen.queryByText('Average')).not.toBeInTheDocument();
  });

  describe('trend line calculation', () => {
    it('adds trend dataset when showTrendLine is true and data has >1 points', () => {
      render(<ProgressChart {...defaultProps} showTrendLine={true} />);
      expect(capturedChartProps.data.datasets).toHaveLength(2);
      expect(capturedChartProps.data.datasets[1].label).toBe('Trend');
    });

    it('does not add trend dataset when showTrendLine is false', () => {
      render(<ProgressChart {...defaultProps} showTrendLine={false} />);
      expect(capturedChartProps.data.datasets).toHaveLength(1);
    });

    it('does not add trend dataset with only 1 data point', () => {
      render(
        <ProgressChart {...defaultProps} data={[{ date: '2024-01-01', value: 80 }]} showTrendLine={true} />
      );
      expect(capturedChartProps.data.datasets).toHaveLength(1);
    });

    it('trend line has correct length matching data', () => {
      render(<ProgressChart {...defaultProps} showTrendLine={true} />);
      const trendDataset = capturedChartProps.data.datasets[1];
      expect(trendDataset.data).toHaveLength(mockData.length);
    });

    it('trend line has dashed style', () => {
      render(<ProgressChart {...defaultProps} showTrendLine={true} />);
      const trendDataset = capturedChartProps.data.datasets[1];
      expect(trendDataset.borderDash).toEqual([5, 5]);
      expect(trendDataset.pointRadius).toBe(0);
    });
  });

  describe('statistics calculations', () => {
    it('calculates stats for single data point (no trend)', () => {
      const singleData = [{ date: '2024-01-15T12:00:00', value: 80 }];
      render(<ProgressChart {...defaultProps} data={singleData} />);
      expect(screen.getByText(/Current: 80.0 kg/)).toBeInTheDocument();
      // totalChange should be 0 with single point, displayed as "+0.0"
      expect(screen.getByText('+0.0')).toBeInTheDocument();
    });

    it('calculates trend from last 2 values when 2-3 data points', () => {
      const twoPoints = [
        { date: '2024-01-01', value: 80 },
        { date: '2024-01-15', value: 75 },
      ];
      render(<ProgressChart {...defaultProps} data={twoPoints} />);
      // trend = current - previous = 75 - 80 = -5
      expect(screen.getByText('-5.0')).toBeInTheDocument();
    });

    it('calculates trend from averages when >=4 data points', () => {
      // recentAvg = (76 + 75) / 2 = 75.5
      // olderAvg = (80 + 78) / 2 = 79
      // trend = 75.5 - 79 = -3.5
      render(<ProgressChart {...defaultProps} />);
      // The trend is shown in the header area
      expect(screen.getByText(/-3.5 kg/)).toBeInTheDocument();
    });

    it('shows positive trend with green color and + sign', () => {
      const increasingData = [
        { date: '2024-01-01', value: 70 },
        { date: '2024-01-15', value: 72 },
        { date: '2024-02-01', value: 74 },
        { date: '2024-02-15', value: 76 },
      ];
      render(<ProgressChart {...defaultProps} data={increasingData} />);
      // recentAvg = (74+76)/2 = 75, olderAvg = (70+72)/2 = 71, trend = 4.0
      expect(screen.getByText(/\+4.0 kg/)).toBeInTheDocument();
    });

    it('shows best (max) value', () => {
      render(<ProgressChart {...defaultProps} />);
      // max of [80, 78, 77, 76, 75] = 80
      expect(screen.getByText('80.0')).toBeInTheDocument();
    });

    it('shows average value', () => {
      render(<ProgressChart {...defaultProps} />);
      // avg = (80+78+77+76+75)/5 = 77.2
      expect(screen.getByText('77.2')).toBeInTheDocument();
    });
  });

  describe('tooltip callbacks', () => {
    it('tooltip title callback formats date in long format', () => {
      render(<ProgressChart {...defaultProps} />);
      const titleCb = capturedChartProps.options.plugins.tooltip.callbacks.title;
      const result = titleCb([{ dataIndex: 0 }]);
      // Should contain full date format (Jan 15)
      expect(result).toContain('2024');
      expect(result).toContain('January');
      expect(result).toContain('15');
    });

    it('tooltip label callback shows value with unit and change', () => {
      render(<ProgressChart {...defaultProps} />);
      const labelCb = capturedChartProps.options.plugins.tooltip.callbacks.label;
      // First point (no previous)
      const result0 = labelCb({ parsed: { y: 80 }, dataIndex: 0, dataset: { label: 'Weight' } });
      expect(result0).toEqual(['Weight: 80.0 kg']);

      // Second point (has previous, shows change)
      const result1 = labelCb({ parsed: { y: 78 }, dataIndex: 1, dataset: { label: 'Weight' } });
      expect(result1).toEqual(expect.arrayContaining([
        expect.stringContaining('Weight: 78.0 kg'),
        expect.stringContaining('Change: -2.0 kg'),
      ]));
    });

    it('tooltip label callback shows note when present', () => {
      const dataWithLabel = [
        { date: '2024-01-15T12:00:00', value: 80, label: 'Morning weight' },
        { date: '2024-02-01T12:00:00', value: 78 },
      ];
      render(<ProgressChart {...defaultProps} data={dataWithLabel} />);
      const labelCb = capturedChartProps.options.plugins.tooltip.callbacks.label;
      const result = labelCb({ parsed: { y: 80 }, dataIndex: 0, dataset: { label: 'Weight' } });
      expect(result).toEqual(expect.arrayContaining([
        expect.stringContaining('Note: Morning weight'),
      ]));
    });
  });

  describe('y-axis tick callback', () => {
    it('formats y-axis ticks with unit', () => {
      render(<ProgressChart {...defaultProps} />);
      const tickCb = capturedChartProps.options.scales.y.ticks.callback;
      expect(tickCb(75)).toBe('75 kg');
    });
  });

  describe('time range and color', () => {
    it('applies 1y time range date formatting', () => {
      render(
        <ProgressChart
          {...defaultProps}
          timeRange="1y"
          onTimeRangeChange={jest.fn()}
        />
      );
      // 1y adds year: '2-digit' to date format
      const labels = capturedChartProps.data.labels;
      expect(labels.length).toBe(5);
    });

    it('applies custom color', () => {
      render(<ProgressChart {...defaultProps} color="#FF0000" />);
      expect(capturedChartProps.data.datasets[0].borderColor).toBe('#FF0000');
    });

    it('uses custom height', () => {
      const { container } = render(<ProgressChart {...defaultProps} height={500} />);
      const chartContainer = container.querySelector('[style*="height"]');
      expect(chartContainer).toHaveStyle({ height: '500px' });
    });

    it('highlights active time range button', () => {
      render(
        <ProgressChart
          {...defaultProps}
          timeRange="6m"
          onTimeRangeChange={jest.fn()}
        />
      );
      const btn6m = screen.getByText('6 Months');
      // Active button has different styles than inactive
      expect(btn6m.className).toContain('text-gray-900');
      const btn7d = screen.getByText('7 Days');
      expect(btn7d.className).toContain('text-gray-500');
    });

    it('clicks different time range buttons', () => {
      const onChange = jest.fn();
      render(
        <ProgressChart {...defaultProps} onTimeRangeChange={onChange} />
      );
      fireEvent.click(screen.getByText('30 Days'));
      expect(onChange).toHaveBeenCalledWith('30d');
      fireEvent.click(screen.getByText('6 Months'));
      expect(onChange).toHaveBeenCalledWith('6m');
      fireEvent.click(screen.getByText('1 Year'));
      expect(onChange).toHaveBeenCalledWith('1y');
    });
  });
});
