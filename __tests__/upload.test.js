import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadPage from '../pages/upload';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mock the next-auth module
jest.mock('next-auth/react');

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock File.prototype.arrayBuffer
File.prototype.arrayBuffer = jest.fn().mockImplementation(function() {
  return Promise.resolve(new ArrayBuffer(8));
});

// Mock crypto.subtle.digest
const mockDigest = jest.fn(() => Promise.resolve(new Uint8Array([1, 2, 3, 4])));

// Ensure crypto and crypto.subtle exist before mocking
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.subtle) {
  global.crypto.subtle = {};
}

Object.defineProperty(global.crypto.subtle, 'digest', {
  value: mockDigest,
});

describe('Upload Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup router mock
    useRouter.mockReturnValue({
      push: mockPush,
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

  it('renders loading state', () => {
    // Mock the useSession hook to return loading state
    useSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<UploadPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders sign-in button when not authenticated', () => {
    // Mock the useSession hook to return unauthenticated state
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<UploadPage />);

    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('renders upload form when authenticated', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'fake-token'
      },
      status: 'authenticated',
    });

    render(<UploadPage />);

    expect(screen.getByText('Upload Video')).toBeInTheDocument();
    expect(screen.getByText('Choose Video File')).toBeInTheDocument();
    expect(screen.getByText('Select a file first')).toBeInTheDocument();
    expect(screen.getByText('Select a file first')).toBeDisabled();
  });

  it('enables upload button when file is selected', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      },
      status: 'authenticated',
    });

    // Create a mock video element
    const mockVideoElement = {
      preload: '',
      src: '',
      duration: 60,
      onloadedmetadata: null,
    };

    // Save the original createElement function
    const originalCreateElement = document.createElement;

    // Mock document.createElement to return our mock video
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'video') {
        return mockVideoElement;
      }
      // Use the original function directly
      return originalCreateElement.call(document, tagName);
    });

    render(<UploadPage />);

    // Create a mock file
    const file = new File(['dummy content'], 'test-video.mp4', { type: 'video/mp4' });

    // Get the file input
    const fileInput = screen.getByLabelText('Choose Video File');

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Trigger the onloadedmetadata event
    mockVideoElement.onloadedmetadata();

    // Check that the duration is displayed
    await waitFor(() => {
      // Use getAllByText and check that at least one element matches
      const elements = screen.getAllByText((content, element) => {
        return element.textContent.includes('Video Duration') && element.textContent.includes('60 seconds');
      });
      expect(elements.length).toBeGreaterThan(0);
    });

    // Check that the upload button is enabled and has the correct text
    const uploadButton = screen.getByRole('button', { name: 'Upload Video' });
    expect(uploadButton).toBeEnabled();
  });

  it('uploads file and navigates to video page on success', async () => {
    // Mock the useSession hook to return authenticated state
    useSession.mockReturnValue({
      data: { 
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      },
      status: 'authenticated',
    });

    // Create a mock video element
    const mockVideoElement = {
      preload: '',
      src: '',
      duration: 60,
      onloadedmetadata: null,
    };

    // Save the original createElement function
    const originalCreateElement = document.createElement;

    // Mock document.createElement to return our mock video
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'video') {
        return mockVideoElement;
      }
      // Use the original function directly
      return originalCreateElement.call(document, tagName);
    });

    // Mock fetch for presign and upload
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/config')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ apiUrl: 'http://localhost:8000' }),
        });
      }
      if (url.includes('/api/presign-upload')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            uploadUrl: 'https://example.com/upload',
            videoId: 'test-video-id'
          }),
        });
      }
      if (url === 'https://example.com/upload') {
        return Promise.resolve({
          ok: true,
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<UploadPage />);

    // Create a mock file
    const file = new File(['dummy content'], 'test-video.mp4', { type: 'video/mp4' });

    // Get the file input
    const fileInput = screen.getByLabelText('Choose Video File');

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Trigger the onloadedmetadata event
    mockVideoElement.onloadedmetadata();

    // Wait for the duration to be displayed
    await waitFor(() => {
      // Use getAllByText and check that at least one element matches
      const elements = screen.getAllByText((content, element) => {
        return element.textContent.includes('Video Duration') && element.textContent.includes('60 seconds');
      });
      expect(elements.length).toBeGreaterThan(0);
    });

    // Click the upload button
    const uploadButton = screen.getByRole('button', { name: 'Upload Video' });
    await userEvent.click(uploadButton);

    // Check that the fetch was called with the correct parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/presign-upload', expect.any(Object));
      expect(fetch).toHaveBeenCalledWith('https://example.com/upload', expect.any(Object));
      expect(mockPush).toHaveBeenCalledWith('video/test-video-id');
    });
  });
});
