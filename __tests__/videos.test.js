import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideosPage from '../pages/videos';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

// Mock the next-auth module
jest.mock('next-auth/react');

// Mock the next/router module
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('Videos Page', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup router mock
    useRouter.mockReturnValue({
      push: mockPush,
    });
    
    // Mock fetch to return empty videos by default
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ backendUrl: 'http://localhost:8000' }),
        });
      }
      if (url.includes('/api/videos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ videos: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders loading state', () => {
    // Mock the useSession hook to return loading state
    useSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<VideosPage />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders sign-in button when not authenticated', () => {
    // Mock the useSession hook to return unauthenticated state
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<VideosPage />);
    
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('renders loading videos state', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });

    render(<VideosPage />);
    
    expect(screen.getByText('Loading videos...')).toBeInTheDocument();
  });

  it('renders empty state when no videos are found', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });

    render(<VideosPage />);
    
    // Wait for the videos to load
    await waitFor(() => {
      expect(screen.getByText('No Videos Found')).toBeInTheDocument();
    });
    
    expect(screen.getByText('You haven\'t uploaded any videos yet.')).toBeInTheDocument();
    expect(screen.getByText('Upload Your First Video')).toBeInTheDocument();
  });

  it('renders video list when videos are available', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });
    
    // Mock fetch to return videos
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ backendUrl: 'http://localhost:8000' }),
        });
      }
      if (url.includes('/api/videos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            videos: [
              { 
                video_id: '123', 
                file_name: 'test-video.mp4', 
                status: 'COMPLETED', 
                progress: 100,
                download_url: 'http://example.com/download'
              }
            ] 
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<VideosPage />);
    
    // Wait for the videos to load
    await waitFor(() => {
      expect(screen.getByText('Your Video Collection')).toBeInTheDocument();
    });
    
    expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Download ZIP')).toBeInTheDocument();
  });

  it('navigates to video detail page when video name is clicked', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });
    
    // Mock fetch to return videos
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ backendUrl: 'http://localhost:8000' }),
        });
      }
      if (url.includes('/api/videos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            videos: [
              { 
                video_id: '123', 
                file_name: 'test-video.mp4', 
                status: 'COMPLETED', 
                progress: 100,
                download_url: 'http://example.com/download'
              }
            ] 
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<VideosPage />);
    
    // Wait for the videos to load
    await waitFor(() => {
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    });
    
    // Click on the video name
    const videoName = screen.getByText('test-video.mp4');
    await userEvent.click(videoName);
    
    // Check that router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith('/video/123');
  });
});