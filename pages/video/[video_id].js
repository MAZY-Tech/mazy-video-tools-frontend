import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function VideoDetailPage() {
  const { data: session, status } = useSession();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState(null);
  const router = useRouter();
  const { video_id } = router.query;
  const intervalRef = useRef(null);

  // Function to fetch video data
  const fetchVideoData = useCallback(async () => {
    if (status !== "authenticated" || !video_id) return;

    try {
      // Only fetch config if we don't have backendUrl yet
      if (!backendUrl) {
        const resp = await fetch("/api/config");
        const config = await resp.json();
        setBackendUrl(config.backendUrl);
      }

      const apiBase = `${backendUrl ? backendUrl.replace(/\/$/, "") : ""}/api`;

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
    }
  }, [status, session, video_id, backendUrl]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (status !== "authenticated" || !video_id) return;
    fetchVideoData();
  }, [status, video_id, fetchVideoData]);

  // Set up polling every 5 seconds
  useEffect(() => {
    if (status !== "authenticated" || !video_id) return;

    // If video status is COMPLETED, don't set up polling
    if (video && video.status === "COMPLETED") {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      fetchVideoData();
    }, 5000); // 5 seconds

    // Clean up interval when component unmounts
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, video_id, fetchVideoData, video]);

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
            <a className="nav-link">
              Home
            </a>
          </Link>
          <Link href="/videos" legacyBehavior>
            <a className="nav-link">
              View My Videos
            </a>
          </Link>
          <Link href="/upload" legacyBehavior>
            <a className="nav-link">
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
              <a className="nav-link">
                Back to Videos
              </a>
            </Link>
          </div>
        ) : video ? (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#333", marginBottom: "1rem" }}>Video Information</h2>
              <p style={{ color: "#666" }}>
                Details about your video.
              </p>
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
                <div style={{ fontWeight: "bold", color: "#333" }}>File name:</div>
                <div style={{ color: "#666", wordBreak: "break-all" }}>{video.file_name}</div>

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
                backgroundColor: "#666666",
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
