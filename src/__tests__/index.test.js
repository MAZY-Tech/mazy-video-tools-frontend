import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../pages/index';
import { useSession, signIn, signOut } from 'next-auth/react';

// Mock the next-auth module
jest.mock('next-auth/react');

describe('Home Page', () => {
  it('renders loading state', () => {
    // Mock the useSession hook to return loading state
    useSession.mockReturnValueOnce({
      data: null,
      status: 'loading',
    });

    render(<Home />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders sign-in button when not authenticated', () => {
    // Mock the useSession hook to return unauthenticated state
    useSession.mockReturnValueOnce({
      data: null,
      status: 'unauthenticated',
    });

    render(<Home />);
    
    expect(screen.getByText('MAZY Video Tools')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('renders dashboard when authenticated', () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValueOnce({
      data: { 
        user: { 
          name: 'Test User', 
          email: 'test@example.com' 
        } 
      },
      status: 'authenticated',
    });

    render(<Home />);
    
    expect(screen.getByText('MAZY Video Tools')).toBeInTheDocument();
    expect(screen.getByText('Signed in as test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
    expect(screen.getByText('Upload Video')).toBeInTheDocument();
    expect(screen.getByText('View My Videos')).toBeInTheDocument();
  });

  it('calls signIn when sign-in button is clicked', async () => {
    // Mock the useSession hook to return unauthenticated state
    useSession.mockReturnValueOnce({
      data: null,
      status: 'unauthenticated',
    });

    render(<Home />);
    
    const signInButton = screen.getByText('Sign in');
    await userEvent.click(signInButton);
    
    expect(signIn).toHaveBeenCalledWith('cognito');
  });

  it('calls signOut when sign-out button is clicked', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValueOnce({
      data: { 
        user: { 
          name: 'Test User', 
          email: 'test@example.com' 
        } 
      },
      status: 'authenticated',
    });

    render(<Home />);
    
    const signOutButton = screen.getByText('Sign out');
    await userEvent.click(signOutButton);
    
    expect(signOut).toHaveBeenCalled();
  });
});