import { render, screen, waitFor, act } from '@testing-library/react';
import VideoDetailPage from '../pages/video/[video_id]';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

// Mock the next-auth module
jest.mock('next-auth/react');

// Mock the next/router module
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('Video Detail Page', () => {
  // Mock setInterval and clearInterval
  jest.useFakeTimers();

  const mockQuery = { video_id: 'test-video-id' };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup router mock
    useRouter.mockReturnValue({
      query: mockQuery,
    });

    // Mock fetch to return config by default
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ apiUrl: 'http://localhost:8000' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders loading state', async () => {
    // Mock the useSession hook to return loading state
    useSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    await act(async () => {
      render(<VideoDetailPage />);
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders sign-in button when not authenticated', async () => {
    // Mock the useSession hook to return unauthenticated state
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    await act(async () => {
      render(<VideoDetailPage />);
    });

    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('renders loading video state', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });

    // Mock fetch to delay responses
    global.fetch = jest.fn().mockImplementation((url) => {
      return new Promise(resolve => {
        // Delay the response to ensure loading state is visible
        setTimeout(() => {
          if (url.includes('/api/config')) {
            resolve({
              ok: true,
              json: () => Promise.resolve({ apiUrl: 'http://localhost:8000' }),
            });
          } else {
            resolve({
              ok: true,
              json: () => Promise.resolve({}),
            });
          }
        }, 100);
      });
    });

    render(<VideoDetailPage />);

    // The component should initially show loading state
    expect(screen.getByText('Loading video information...')).toBeInTheDocument();
  });

  it('renders error state when video fetch fails', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });

    // Mock fetch to throw an error for videos endpoint
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ apiUrl: 'http://localhost:8000' }),
        });
      }
      if (url.includes('/api/videos/')) {
        return Promise.reject(new Error('Failed to fetch video'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<VideoDetailPage />);

    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch video')).toBeInTheDocument();
    });
  });

  it('renders video details when video is found', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });

    // Create a mock video response
    const mockVideo = { 
      video_id: 'test-video-id',
      file_name: 'test-video.mp4',
      status: 'COMPLETED',
      progress: 100,
      download_url: 'http://example.com/download'
    };

    // Mock fetch to return video
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ apiUrl: 'http://localhost:8000' }),
        });
      }
      if (url.includes('/api/videos/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVideo),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<VideoDetailPage />);

    // First, we should see the loading state
    expect(screen.getByText('Loading video information...')).toBeInTheDocument();

    // Wait for the file name to be displayed (indicates video details are loaded)
    await waitFor(() => {
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
    });

    // Now check the rest of the video details
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('http://example.com/download')).toBeInTheDocument();
  });

  it('renders "Video Not Found" when video is null', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });

    // Mock fetch to return null video
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ apiUrl: 'http://localhost:8000' }),
        });
      }
      if (url.includes('/api/videos/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<VideoDetailPage />);

    // First, we should see the loading state
    expect(screen.getByText('Loading video information...')).toBeInTheDocument();

    // Wait for the "Video Not Found" message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Video Not Found')).toBeInTheDocument();
    });

    expect(screen.getByText('The requested video could not be found.')).toBeInTheDocument();
  });

  it('polls for updates when video status is not COMPLETED', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });

    // Create a controlled mock implementation
    const mockRunningVideo = { 
      video_id: 'test-video-id',
      file_name: 'test-video.mp4',
      status: 'RUNNING',
      progress: 50,
      download_url: null
    };

    const mockCompletedVideo = { 
      video_id: 'test-video-id',
      file_name: 'test-video.mp4',
      status: 'COMPLETED',
      progress: 100,
      download_url: 'http://example.com/download'
    };

    // Start with returning the running video
    let returnCompletedVideo = false;

    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ apiUrl: 'http://localhost:8000' }),
        });
      }
      if (url.includes('/api/videos/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(returnCompletedVideo ? mockCompletedVideo : mockRunningVideo),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<VideoDetailPage />);

    // First, we should see the loading state
    expect(screen.getByText('Loading video information...')).toBeInTheDocument();

    // Wait for the initial video details to be displayed
    await waitFor(() => {
      expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      expect(screen.getByText('RUNNING')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });

    // Now update the mock to return the completed video
    returnCompletedVideo = true;

    // Fast-forward time by 5 seconds to trigger the polling
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Wait for the updated status to be displayed
    await waitFor(() => {
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('http://example.com/download')).toBeInTheDocument();
    });
  });
});
