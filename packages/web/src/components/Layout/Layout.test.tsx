import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Layout } from './Layout';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

describe('Layout', () => {
  it('renders header, sidebar, and main content', () => {
    render(
      <Layout>
        <div data-testid="main-content">Main content</div>
      </Layout>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('renders sidebar content', () => {
    render(
      <Layout sidebar={<div>Sidebar content</div>}>
        <div>Main content</div>
      </Layout>
    );

    expect(screen.getByText('Sidebar content')).toBeInTheDocument();
  });

  it('toggles sidebar visibility on mobile', () => {
    render(
      <Layout sidebar={<div>Sidebar content</div>}>
        <div>Main content</div>
      </Layout>
    );

    const toggleButton = screen.getByLabelText(/toggle sidebar/i);
    expect(toggleButton).toBeInTheDocument();
  });
});

describe('Header', () => {
  it('renders app title', () => {
    render(<Header />);

    expect(screen.getByText('Drift')).toBeInTheDocument();
  });

  it('renders activity count when provided', () => {
    render(<Header activityCount={42} />);

    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('renders toggle button when onToggleSidebar provided', () => {
    const onToggle = vi.fn();
    render(<Header onToggleSidebar={onToggle} />);

    const toggleButton = screen.getByLabelText(/toggle sidebar/i);
    fireEvent.click(toggleButton);

    expect(onToggle).toHaveBeenCalled();
  });
});

describe('Sidebar', () => {
  it('renders children', () => {
    render(
      <Sidebar>
        <div>Sidebar child</div>
      </Sidebar>
    );

    expect(screen.getByText('Sidebar child')).toBeInTheDocument();
  });

  it('applies hidden class when isOpen is false', () => {
    render(
      <Sidebar isOpen={false}>
        <div>Sidebar child</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('hidden');
  });

  it('applies visible class when isOpen is true', () => {
    render(
      <Sidebar isOpen={true}>
        <div>Sidebar child</div>
      </Sidebar>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).not.toHaveClass('hidden');
  });
});
