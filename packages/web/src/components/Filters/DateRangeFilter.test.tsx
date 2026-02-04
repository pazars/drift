import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DateRangeFilter } from './DateRangeFilter';

describe('DateRangeFilter', () => {
  beforeEach(() => {
    // Mock current date to 2024-06-15 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders filter header', () => {
    render(<DateRangeFilter onChange={() => {}} />);

    expect(screen.getByText(/date range/i)).toBeInTheDocument();
  });

  it('renders start and end date inputs', () => {
    render(<DateRangeFilter onChange={() => {}} />);

    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
  });

  it('displays provided date range values', () => {
    render(<DateRangeFilter startDate="2024-01-01" endDate="2024-06-15" onChange={() => {}} />);

    expect(screen.getByLabelText(/from/i)).toHaveValue('2024-01-01');
    expect(screen.getByLabelText(/to/i)).toHaveValue('2024-06-15');
  });

  it('calls onChange when start date changes', () => {
    const onChange = vi.fn();
    render(<DateRangeFilter endDate="2024-06-15" onChange={onChange} />);

    const startInput = screen.getByLabelText(/from/i);
    fireEvent.change(startInput, { target: { value: '2024-01-01' } });

    expect(onChange).toHaveBeenCalledWith({
      start: '2024-01-01',
      end: '2024-06-15',
    });
  });

  it('calls onChange when end date changes', () => {
    const onChange = vi.fn();
    render(<DateRangeFilter startDate="2024-01-01" onChange={onChange} />);

    const endInput = screen.getByLabelText(/to/i);
    fireEvent.change(endInput, { target: { value: '2024-06-30' } });

    expect(onChange).toHaveBeenCalledWith({
      start: '2024-01-01',
      end: '2024-06-30',
    });
  });

  it('renders quick preset buttons', () => {
    render(<DateRangeFilter onChange={() => {}} />);

    expect(screen.getByRole('button', { name: /last 30 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /last 90 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /this year/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all time/i })).toBeInTheDocument();
  });

  it('applies "Last 30 days" preset when clicked', () => {
    const onChange = vi.fn();
    render(<DateRangeFilter onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /last 30 days/i }));

    expect(onChange).toHaveBeenCalledWith({
      start: '2024-05-16',
      end: '2024-06-15',
    });
  });

  it('applies "Last 90 days" preset when clicked', () => {
    const onChange = vi.fn();
    render(<DateRangeFilter onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /last 90 days/i }));

    expect(onChange).toHaveBeenCalledWith({
      start: '2024-03-17',
      end: '2024-06-15',
    });
  });

  it('applies "This year" preset when clicked', () => {
    const onChange = vi.fn();
    render(<DateRangeFilter onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /this year/i }));

    expect(onChange).toHaveBeenCalledWith({
      start: '2024-01-01',
      end: '2024-06-15',
    });
  });

  it('clears date range when "All time" is clicked', () => {
    const onChange = vi.fn();
    render(<DateRangeFilter startDate="2024-01-01" endDate="2024-06-15" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /all time/i }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('shows active state for matching preset', () => {
    render(<DateRangeFilter startDate="2024-01-01" endDate="2024-06-15" onChange={() => {}} />);

    const thisYearButton = screen.getByRole('button', { name: /this year/i });
    expect(thisYearButton).toHaveClass('bg-blue-100');
  });
});
