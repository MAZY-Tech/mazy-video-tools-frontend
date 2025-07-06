import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <style jsx global>{`
        html, body {
          font-family: "Helvetica", sans-serif;
        }

        button, a[role="button"], a.button {
          filter: grayscale(100%);
          transition: filter 0.3s ease, transform 0.2s ease;
        }

        button:hover, a[role="button"]:hover, a.button:hover {
          filter: grayscale(0%);
          transform: translateY(-2px);
        }

        /* Navigation links styling */
        .nav-link {
          color: #666666;
          text-decoration: none;
          font-weight: bold;
          padding: 0.5rem 1rem;
          margin: 0 0.5rem;
          transition: color 0.3s ease, transform 0.2s ease;
        }

        .nav-link:hover {
          color: #333333;          
          text-decoration: underline;
        }
      `}</style>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
