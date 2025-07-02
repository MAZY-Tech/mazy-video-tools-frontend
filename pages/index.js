import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") return (
    <div style={{ 
      padding: "2rem", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh" 
    }}>
      <p style={{ fontSize: "1.2rem" }}>Loading...</p>
    </div>
  );

  if (!session) {
    return (
      <div style={{ 
        padding: "2rem", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <h1 style={{ marginBottom: "2rem", color: "#333" }}>Mazy Video Tools</h1>
        <a 
          onClick={() => signIn("cognito")} 
          className="nav-link"
          style={{
            cursor: "pointer"
          }}
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto"
    }}>
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "2rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #eaeaea"
      }}>
        <h1 style={{ color: "#333", margin: 0 }}>Mazy Video Tools</h1>
        <div>
          <span style={{ marginRight: "1rem" }}>Signed in as {session.user.email}</span>
          <button
            onClick={() => signOut()}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main>
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 0"
        }}>
          <h2 style={{ marginBottom: "2rem", color: "#333" }}>Welcome to Mazy Video Tools</h2>
          <div style={{ 
            display: "flex", 
            gap: "1rem" 
          }}>
            <Link href="/upload" legacyBehavior>
              <a className="nav-link">
                Upload Video
              </a>
            </Link>
            <Link href="/videos" legacyBehavior>
              <a className="nav-link">
                View My Videos
              </a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
