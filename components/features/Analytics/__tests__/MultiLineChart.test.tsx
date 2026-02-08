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
});
