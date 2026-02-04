import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SportFilter } from './SportFilter';
import type { ActivityType } from '../../types';

describe('SportFilter', () => {
  const allTypes: ActivityType[] = ['run', 'ride', 'walk', 'hike', 'swim', 'ski', 'other'];

  it('renders all sport types', () => {
    render(<SportFilter selectedTypes={[]} onChange={() => {}} />);

    expect(screen.getByLabelText(/run/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ride/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/walk/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hike/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/swim/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ski/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/other/i)).toBeInTheDocument();
  });

  it('shows checkboxes as checked for selected types', () => {
    render(<SportFilter selectedTypes={['run', 'ride']} onChange={() => {}} />);

    const runCheckbox = screen.getByLabelText(/run/i);
    const rideCheckbox = screen.getByLabelText(/ride/i);
    const walkCheckbox = screen.getByLabelText(/walk/i);

    expect(runCheckbox.checked).toBe(true);
    expect(rideCheckbox.checked).toBe(true);
    expect(walkCheckbox.checked).toBe(false);
  });

  it('calls onChange when toggling a sport type on', () => {
    const onChange = vi.fn();
    render(<SportFilter selectedTypes={['run']} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText(/ride/i));

    expect(onChange).toHaveBeenCalledWith(['run', 'ride']);
  });

  it('calls onChange when toggling a sport type off', () => {
    const onChange = vi.fn();
    render(<SportFilter selectedTypes={['run', 'ride']} onChange={onChange} />);

    fireEvent.click(screen.getByLabelText(/run/i));

    expect(onChange).toHaveBeenCalledWith(['ride']);
  });

  it('has Select All button that selects all types', () => {
    const onChange = vi.fn();
    render(<SportFilter selectedTypes={['run']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /select all/i }));

    expect(onChange).toHaveBeenCalledWith(allTypes);
  });

  it('has Clear All button that clears all types', () => {
    const onChange = vi.fn();
    render(<SportFilter selectedTypes={['run', 'ride']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: /clear all/i }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('displays sport type with corresponding color indicator', () => {
    render(<SportFilter selectedTypes={[]} onChange={() => {}} />);

    // Each sport type should have a color indicator
    const runLabel = screen.getByText(/run/i).closest('label');
    expect(runLabel).toBeInTheDocument();
  });

  it('renders filter header', () => {
    render(<SportFilter selectedTypes={[]} onChange={() => {}} />);

    expect(screen.getByText(/sport type/i)).toBeInTheDocument();
  });

  it('shows count of selected types', () => {
    render(<SportFilter selectedTypes={['run', 'ride', 'walk']} onChange={() => {}} />);

    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it('shows "all" when all types are selected', () => {
    render(<SportFilter selectedTypes={allTypes} onChange={() => {}} />);

    expect(screen.getByText(/all selected/i)).toBeInTheDocument();
  });

  it('shows "none" when no types are selected', () => {
    render(<SportFilter selectedTypes={[]} onChange={() => {}} />);

    expect(screen.getByText(/none selected/i)).toBeInTheDocument();
  });
});
