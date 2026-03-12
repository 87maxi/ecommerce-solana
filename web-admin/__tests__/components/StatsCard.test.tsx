import { render, screen } from '@testing-library/react';

import { StatsCard } from '../../src/components/StatsCard';

describe('StatsCard', () => {
  const mockIcon = <svg data-testid="mock-icon" />;
  it('renders stats card with correct content', () => {
    render(
      <StatsCard
        title="Total Users"
        value="1,234"
        icon={mockIcon}
        color="bg-blue-500"
        description="Active users this month"
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Active users this month')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders without description', () => {
    render(
      <StatsCard
        title="Revenue"
        value="$12,345"
        icon={mockIcon}
        color="bg-green-500"
      />
    );

    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,345')).toBeInTheDocument();
    expect(
      screen.queryByText('Active users this month')
    ).not.toBeInTheDocument();
  });

  it('displays number values correctly', () => {
    render(
      <StatsCard title="Number Value" value={1234} description="Number test" />
    );

    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('displays string values correctly', () => {
    render(
      <StatsCard
        title="String Value"
        value="10.5 ETH"
        description="String test"
      />
    );

    expect(screen.getByText('10.5 ETH')).toBeInTheDocument();
  });

  it('applies correct color class', () => {
    render(
      <StatsCard
        title="Colored Card"
        value={100}
        description="Color test"
        color="bg-red-500"
      />
    );

    const indicator = screen.getByTestId('color-indicator');
    expect(indicator).toHaveClass('bg-red-500');
  });
});
