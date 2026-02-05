import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TagFilter } from './TagFilter';

describe('TagFilter', () => {
  const availableTags = ['race', 'workout', 'commute'];

  it('renders nothing when no tags available', () => {
    const { container } = render(
      <TagFilter availableTags={[]} selectedTag={null} onChange={() => {}} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders dropdown with available tags', () => {
    render(<TagFilter availableTags={availableTags} selectedTag={null} onChange={() => {}} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('All activities')).toBeInTheDocument();
    expect(screen.getByText('race')).toBeInTheDocument();
    expect(screen.getByText('workout')).toBeInTheDocument();
    expect(screen.getByText('commute')).toBeInTheDocument();
  });

  it('shows "All activities" as default when no tag selected', () => {
    render(<TagFilter availableTags={availableTags} selectedTag={null} onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('');
  });

  it('shows selected tag', () => {
    render(<TagFilter availableTags={availableTags} selectedTag="race" onChange={() => {}} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('race');
  });

  it('calls onChange with tag when selected', () => {
    const onChange = vi.fn();
    render(<TagFilter availableTags={availableTags} selectedTag={null} onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'race' } });

    expect(onChange).toHaveBeenCalledWith('race');
  });

  it('calls onChange with null when "All activities" selected', () => {
    const onChange = vi.fn();
    render(<TagFilter availableTags={availableTags} selectedTag="race" onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('has accessible label', () => {
    render(<TagFilter availableTags={availableTags} selectedTag={null} onChange={() => {}} />);

    expect(screen.getByLabelText(/filter by tag/i)).toBeInTheDocument();
  });

  it('displays Tag header', () => {
    render(<TagFilter availableTags={availableTags} selectedTag={null} onChange={() => {}} />);

    expect(screen.getByText('Tag')).toBeInTheDocument();
  });
});
