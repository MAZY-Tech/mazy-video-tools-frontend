import { render, screen } from '@testing-library/react';
import { getVideoDuration } from '../utils/getVideoDuration';

describe('getVideoDuration', () => {
  // Save original implementations
  const originalCreateObjectURL = global.URL.createObjectURL;
  const originalRevokeObjectURL = global.URL.revokeObjectURL;
  const originalCreateElement = document.createElement;

  beforeEach(() => {
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-video-url');
    
    // Mock URL.revokeObjectURL
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    // Restore original implementations
    global.URL.createObjectURL = originalCreateObjectURL;
    global.URL.revokeObjectURL = originalRevokeObjectURL;
    document.createElement = originalCreateElement;
  });

  it('should return the correct video duration', async () => {
    // Create a mock video element
    const mockVideoElement = {
      preload: '',
      src: '',
      duration: 120.5, // 2 minutes and 0.5 seconds
      onloadedmetadata: null,
      onerror: null
    };

    // Mock document.createElement to return our mock video
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'video') {
        return mockVideoElement;
      }
      // Use the original function for other elements
      return originalCreateElement.call(document, tagName);
    });

    // Create a mock file
    const mockFile = new File(['dummy content'], 'test-video.mp4', { type: 'video/mp4' });

    // Call the function
    const durationPromise = getVideoDuration(mockFile);
    
    // Simulate the metadata loading
    mockVideoElement.onloadedmetadata();
    
    // Wait for the promise to resolve
    const duration = await durationPromise;
    
    // Check that the duration is correct (should be rounded down to 120)
    expect(duration).toBe(120);
    
    // Check that URL.createObjectURL was called with the file
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockFile);
    
    // Check that URL.revokeObjectURL was called with the URL
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-video-url');
  });

  it('should reject the promise when an error occurs', async () => {
    // Create a mock video element
    const mockVideoElement = {
      preload: '',
      src: '',
      duration: 0,
      onloadedmetadata: null,
      onerror: null
    };

    // Mock document.createElement to return our mock video
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'video') {
        return mockVideoElement;
      }
      // Use the original function for other elements
      return originalCreateElement.call(document, tagName);
    });

    // Create a mock file
    const mockFile = new File(['dummy content'], 'test-video.mp4', { type: 'video/mp4' });

    // Call the function
    const durationPromise = getVideoDuration(mockFile);
    
    // Simulate an error
    mockVideoElement.onerror(new Error('Video loading error'));
    
    // Check that the promise rejects
    await expect(durationPromise).rejects.toEqual(new Error('Video loading error'));
  });

  it('should handle videos with zero duration', async () => {
    // Create a mock video element
    const mockVideoElement = {
      preload: '',
      src: '',
      duration: 0,
      onloadedmetadata: null,
      onerror: null
    };

    // Mock document.createElement to return our mock video
    document.createElement = jest.fn().mockImplementation((tagName) => {
      if (tagName === 'video') {
        return mockVideoElement;
      }
      // Use the original function for other elements
      return originalCreateElement.call(document, tagName);
    });

    // Create a mock file
    const mockFile = new File(['dummy content'], 'test-video.mp4', { type: 'video/mp4' });

    // Call the function
    const durationPromise = getVideoDuration(mockFile);
    
    // Simulate the metadata loading
    mockVideoElement.onloadedmetadata();
    
    // Wait for the promise to resolve
    const duration = await durationPromise;
    
    // Check that the duration is correct (should be 0)
    expect(duration).toBe(0);
  });
});