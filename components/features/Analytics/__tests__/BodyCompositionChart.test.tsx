/** @jest-environment jsdom */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import BodyCompositionChart from '../BodyCompositionChart';

// Mock chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <span data-testid="chart-labels">{JSON.stringify(data.labels)}</span>
      <span data-testid="chart-datasets">{data.datasets.length} datasets</span>
    </div>
  ),
}));

describe('BodyCompositionChart', () => {
  it('renders without crashing', () => {
    render(<BodyCompositionChart data={[]} />);
    expect(screen.getByText('Body Composition')).toBeInTheDocument();
  });

  it('displays header and description', () => {
    render(<BodyCompositionChart data={[]} />);
    expect(screen.getByText('Body Composition')).toBeInTheDocument();
    expect(screen.getByText(/Track changes in weight/)).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<BodyCompositionChart data={[]} />);
    expect(screen.getByText('No body composition data')).toBeInTheDocument();
    expect(screen.getByText(/Record weight and body fat/)).toBeInTheDocument();
  });

  it('renders chart when data is provided', () => {
    const data = [
      { date: '2025-01-01', weight: 80 },
      { date: '2025-01-15', weight: 79 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders chart with correct number of datasets for weight only', () => {
    const data = [
      { date: '2025-01-01', weight: 80 },
      { date: '2025-01-15', weight: 79 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByTestId('chart-datasets')).toHaveTextContent('1 datasets');
  });

  it('renders additional datasets when bodyFat and muscleMass are provided', () => {
    const data = [
      { date: '2025-01-01', weight: 80, bodyFat: 20, muscleMass: 35 },
      { date: '2025-01-15', weight: 79, bodyFat: 19, muscleMass: 36 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByTestId('chart-datasets')).toHaveTextContent('3 datasets');
  });

  it('renders insights section when data has more than 1 data point', () => {
    const data = [
      { date: '2025-01-01', weight: 80, bodyFat: 20, muscleMass: 35 },
      { date: '2025-01-15', weight: 79, bodyFat: 19, muscleMass: 36 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByText('Composition Insights')).toBeInTheDocument();
  });

  it('does not render insights with only 1 data point', () => {
    const data = [{ date: '2025-01-01', weight: 80 }];

    render(<BodyCompositionChart data={data} />);
    expect(screen.queryByText('Composition Insights')).not.toBeInTheDocument();
  });

  it('shows weight change insight', () => {
    const data = [
      { date: '2025-01-01', weight: 80 },
      { date: '2025-01-15', weight: 78 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByText('Weight Change')).toBeInTheDocument();
    expect(screen.getByText('-2.0 kg')).toBeInTheDocument();
  });

  it('shows positive weight change with plus sign', () => {
    const data = [
      { date: '2025-01-01', weight: 78 },
      { date: '2025-01-15', weight: 80 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByText('+2.0 kg')).toBeInTheDocument();
  });

  it('shows body fat change insight', () => {
    const data = [
      { date: '2025-01-01', weight: 80, bodyFat: 20 },
      { date: '2025-01-15', weight: 79, bodyFat: 18 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByText('Body Fat Change')).toBeInTheDocument();
    expect(screen.getByText('-2.0%')).toBeInTheDocument();
  });

  it('shows muscle mass change insight', () => {
    const data = [
      { date: '2025-01-01', weight: 80, muscleMass: 35 },
      { date: '2025-01-15', weight: 81, muscleMass: 37 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByText('Muscle Mass Change')).toBeInTheDocument();
    expect(screen.getByText('+2.0 kg')).toBeInTheDocument();
  });

  it('shows recomposition recommendation', () => {
    const data = [
      { date: '2025-01-01', weight: 80, bodyFat: 20, muscleMass: 35 },
      { date: '2025-01-15', weight: 81, bodyFat: 18, muscleMass: 37 },
    ];

    render(<BodyCompositionChart data={data} />);
    // Weight gain + body fat decrease + muscle gain = recomposition
    expect(screen.getByText(/ideal body recomposition/)).toBeInTheDocument();
  });

  it('shows weight loss recommendation', () => {
    const data = [
      { date: '2025-01-01', weight: 85, bodyFat: 22 },
      { date: '2025-01-15', weight: 83, bodyFat: 20 },
    ];

    render(<BodyCompositionChart data={data} />);
    expect(screen.getByText(/losing weight and body fat/)).toBeInTheDocument();
  });

  it('uses custom height prop', () => {
    const data = [
      { date: '2025-01-01', weight: 80 },
      { date: '2025-01-15', weight: 79 },
    ];

    const { container } = render(<BodyCompositionChart data={data} height={300} />);
    const chartContainer = container.querySelector('[style*="height"]');
    expect(chartContainer).toHaveStyle({ height: '300px' });
  });

  it('uses default height of 400px', () => {
    const data = [
      { date: '2025-01-01', weight: 80 },
      { date: '2025-01-15', weight: 79 },
    ];

    const { container } = render(<BodyCompositionChart data={data} />);
    const chartContainer = container.querySelector('[style*="height"]');
    expect(chartContainer).toHaveStyle({ height: '400px' });
  });

  it('formats dates correctly in chart labels', () => {
    // Use mid-month dates to avoid timezone-related day shifts crossing month boundaries
    const data = [
      { date: '2025-01-15', weight: 80 },
      { date: '2025-02-15', weight: 79 },
    ];

    render(<BodyCompositionChart data={data} />);
    const labels = screen.getByTestId('chart-labels');
    expect(labels.textContent).toContain('Jan');
    expect(labels.textContent).toContain('Feb');
  });
});
