import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function VideoPage() {
  const { data: session, status } = useSession();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState(null);
  const router = useRouter();
  const { video_id } = router.query;

  const fetchVideoInfo = useCallback(async (isInitialLoad = false) => {
    if (status !== "authenticated" || !video_id) return;

    if (!isInitialLoad) {
      setRefreshing(true);
    }

    try {
      const resp = await fetch("/api/config");
      const { backendUrl } = await resp.json();
      setBackendUrl(backendUrl);
      const apiBase = `${backendUrl.replace(/\/$/, "")}/api`;

      const videoResp = await fetch(`${apiBase}/videos/${video_id}`, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!videoResp.ok) {
        throw new Error("Failed to fetch video information");
      }

      const videoData = await videoResp.json();
      setVideo(videoData);
    } catch (error) {
      console.error("Error fetching video:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      if (!isInitialLoad) {
        setRefreshing(false);
      }
    }
  }, [status, session, video_id]);

  useEffect(() => {
    // Initial fetch
    fetchVideoInfo(true);

    // Set up polling every 5 seconds
    const intervalId = setInterval(() => {
      fetchVideoInfo(false);
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchVideoInfo]);

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
        <h1 style={{ color: "#333", margin: 0 }}>Video Details</h1>
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
          <Link href="/videos" legacyBehavior>
            <a style={{ 
              padding: "0.5rem 1rem",
              backgroundColor: "#34A853",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold"
            }}>
              View My Videos
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

      <main style={{ 
        backgroundColor: "#f9f9f9", 
        padding: "2rem", 
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
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
              Loading video information...
            </p>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem 0",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ color: "#b91c1c", marginBottom: "1rem" }}>Error</h2>
            <p style={{ color: "#7f1d1d", marginBottom: "2rem" }}>
              {error}
            </p>
            <Link href="/videos" legacyBehavior>
              <a style={{ 
                padding: "0.75rem 1.5rem",
                backgroundColor: "#4285F4",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: "bold"
              }}>
                Back to Videos
              </a>
            </Link>
          </div>
        ) : video ? (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#333", marginBottom: "1rem" }}>
                Video Information
                {refreshing && (
                  <span style={{ 
                    fontSize: "0.8rem", 
                    color: "#4285F4", 
                    marginLeft: "1rem",
                    fontWeight: "normal",
                    animation: "pulse 1.5s infinite",
                    display: "inline-block"
                  }}>
                    Refreshing...
                  </span>
                )}
              </h2>
              <p style={{ color: "#666" }}>
                Details about your video. Information is automatically refreshed every 5 seconds.
              </p>
              <style jsx>{`
                @keyframes pulse {
                  0% { opacity: 0.6; }
                  50% { opacity: 1; }
                  100% { opacity: 0.6; }
                }
              `}</style>
            </div>

            <div style={{ 
              border: "1px solid #eaeaea", 
              borderRadius: "8px", 
              padding: "1.5rem",
              backgroundColor: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              maxWidth: "600px",
              margin: "0 auto"
            }}>
              <h3 style={{ 
                color: "#333", 
                marginTop: 0,
                marginBottom: "1.5rem",
                fontSize: "1.2rem",
                borderBottom: "1px solid #eaeaea",
                paddingBottom: "0.5rem"
              }}>
                Video Details
              </h3>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 2fr", 
                gap: "1rem",
                marginBottom: "1.5rem"
              }}>
                <div style={{ fontWeight: "bold", color: "#333" }}>Video ID:</div>
                <div style={{ color: "#666", wordBreak: "break-all" }}>{video.video_id}</div>

                <div style={{ fontWeight: "bold", color: "#333" }}>Status:</div>
                <div style={{ color: "#666" }}>{video.status}</div>

                <div style={{ fontWeight: "bold", color: "#333" }}>Progress:</div>
                <div style={{ color: "#666" }}>{video.progress}%</div>

                <div style={{ fontWeight: "bold", color: "#333" }}>Download URL:</div>
                <div style={{ color: "#666", wordBreak: "break-all" }}>
                  {video.download_url ? (
                    <a 
                      href={video.download_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: "#4285F4", textDecoration: "none" }}
                    >
                      {video.download_url}
                    </a>
                  ) : (
                    "Not available"
                  )}
                </div>
              </div>

              {video.download_url && (
                <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                  <a 
                    href={video.download_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      padding: "0.75rem 1.5rem",
                      backgroundColor: "#4285F4",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      display: "inline-block"
                    }}
                  >
                    Download Video
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ 
            textAlign: "center", 
            padding: "3rem 0",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <h2 style={{ color: "#333", marginBottom: "1rem" }}>Video Not Found</h2>
            <p style={{ color: "#666", marginBottom: "2rem" }}>
              The requested video could not be found.
            </p>
            <Link href="/videos" legacyBehavior>
              <a style={{ 
                padding: "0.75rem 1.5rem",
                backgroundColor: "#4285F4",
                color: "white",
                textDecoration: "none",
                borderRadius: "4px",
                fontWeight: "bold"
              }}>
                Back to Videos
              </a>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
