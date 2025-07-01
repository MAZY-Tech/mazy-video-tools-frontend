import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function VideosPage() {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backendUrl, setBackendUrl] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (status !== "authenticated") return;

    (async () => {
      try {
        const resp = await fetch("/api/config");
        const { backendUrl } = await resp.json();
        const apiBase = `${backendUrl.replace(/\/$/, "")}/api`;

        const videosResp = await fetch(`${apiBase}/videos`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!videosResp.ok) {
          throw new Error("Failed to fetch videos");
        }

        const videosData = await videosResp.json();
        setVideos(videosData);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session]);

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

  if (!session) return <button onClick={() => signIn("cognito")}>Sign in</button>;

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
        <h1 style={{ color: "#333", margin: 0 }}>My Videos</h1>
        <nav style={{ display: "flex", gap: "1rem" }}>
          <Link href="/" legacyBehavior>
            <a style={{ 
              padding: "0.5rem 1rem",
              backgroundColor: "#4285F4",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold"
            }}>
              Home
            </a>
          </Link>
          <Link href="/upload" legacyBehavior>
            <a style={{ 
              padding: "0.5rem 1rem",
              backgroundColor: "#FBBC05",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold"
            }}>
              Upload New Video
            </a>
          </Link>
        </nav>
      </header>

      <main>
        {loading ? (
          <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            padding: "3rem 0" 
          }}>
            <p style={{ 
              fontSize: "1.2rem", 
              color: "#666" 
            }}>
              Loading videos...
            </p>
          </div>
        ) : videos.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem 0",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ color: "#333", marginBottom: "1rem" }}>No Videos Found</h2>
            <p style={{ color: "#666", marginBottom: "2rem" }}>
              You haven't uploaded any videos yet.
            </p>
            <Link href="/upload" legacyBehavior>
              <a style={{ 
                padding: "0.75rem 1.5rem",
                backgroundColor: "#4285F4",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: "bold"
              }}>
                Upload Your First Video
              </a>
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#333" }}>Your Video Collection</h2>
              <p style={{ color: "#666" }}>
                Browse through all your uploaded videos.
              </p>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
              gap: "1.5rem" 
            }}>
              {videos.map((video) => (
                <div 
                  key={video.id} 
                  style={{ 
                    border: "1px solid #eaeaea", 
                    borderRadius: "8px", 
                    padding: "1.5rem",
                    backgroundColor: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                    ":hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                    }
                  }}
                  onClick={() => router.push(`/video/${video.id}`)}
                >
                  <h3 style={{ 
                    color: "#333", 
                    marginTop: 0,
                    marginBottom: "1rem",
                    fontSize: "1.2rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {video.filename}
                  </h3>

                  {video.url && (
                    <div style={{ marginBottom: "1rem" }}>
                      <video 
                        controls 
                        style={{ 
                          width: "100%", 
                          maxHeight: "200px",
                          borderRadius: "4px",
                          backgroundColor: "#000"
                        }}
                        src={video.url}
                      />
                    </div>
                  )}

                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    color: "#666",
                    fontSize: "0.9rem"
                  }}>
                    <p style={{ margin: 0 }}>
                      <strong>Duration:</strong> {video.durationSeconds}s
                    </p>
                    <p style={{ margin: 0 }}>
                      <strong>Uploaded:</strong> {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
