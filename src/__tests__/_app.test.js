import { render } from '@testing-library/react';
import App from '../pages/_app';
import { SessionProvider } from 'next-auth/react';

// Mock the next-auth SessionProvider
jest.mock('next-auth/react', () => ({
  SessionProvider: jest.fn(({ children }) => <div data-testid="session-provider">{children}</div>),
}));

describe('App Component', () => {
  it('renders the component with SessionProvider', () => {
    // Create mock props
    const mockProps = {
      Component: () => <div data-testid="test-component">Test Component</div>,
      pageProps: {
        session: { user: { name: 'Test User' } },
      },
    };

    // Render the App component
    const { getByTestId } = render(<App {...mockProps} />);
    
    // Check that the SessionProvider is rendered
    expect(getByTestId('session-provider')).toBeInTheDocument();
    
    // Check that the child component is rendered
    expect(getByTestId('test-component')).toBeInTheDocument();
    expect(getByTestId('test-component').textContent).toBe('Test Component');
  });

  it('passes session to SessionProvider', () => {
    // Create mock props
    const mockProps = {
      Component: () => <div>Test Component</div>,
      pageProps: {
        session: { user: { name: 'Test User' } },
      },
    };

    // Render the App component
    render(<App {...mockProps} />);
    
    // Check that SessionProvider was called with the correct session prop
    expect(SessionProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        session: mockProps.pageProps.session,
      }),
      expect.anything()
    );
  });

  it('passes pageProps to the Component', () => {
    // Create a mock Component that will verify it receives the correct props
    const MockComponent = jest.fn(() => <div>Test Component</div>);
    
    // Create mock props
    const mockProps = {
      Component: MockComponent,
      pageProps: {
        session: { user: { name: 'Test User' } },
        testProp: 'test value',
      },
    };

    // Render the App component
    render(<App {...mockProps} />);
    
    // Check that the Component was called with the correct props
    expect(MockComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        testProp: 'test value',
      }),
      expect.anything()
    );
  });
});