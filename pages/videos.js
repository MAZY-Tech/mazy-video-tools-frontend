import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function VideosPage() {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleClick = (e, video) => {
    e.stopPropagation();
    router.push(`/video/${video.video_id}`);
  };

  useEffect(() => {
    if (status !== "authenticated") return;

    (async () => {
      try {
        const resp = await fetch("/api/config");
        const { apiUrl } = await resp.json();
        const apiBase = `${apiUrl.replace(/\/$/, "")}/api`;

        const videosResp = await fetch(`${apiBase}/videos`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!videosResp.ok) {
          throw new Error("Failed to fetch videos");
        }

        const videosData = await videosResp.json();
        setVideos(videosData.videos);
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

  if (!session) return <a onClick={() => signIn("cognito")} className="nav-link" style={{ cursor: "pointer" }}>Sign in</a>;

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
            <a className="nav-link">
              Home
            </a>
          </Link>
          <Link href="/upload" legacyBehavior>
            <a className="nav-link">
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
              <a className="nav-link">
                Upload Your First Video
              </a>
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ color: "#333" }}>Your Video Collection</h2>
              <p style={{ color: "#666" }}>
                Browse through all your uploaded videos and download ZIP files with video frames.
              </p>
            </div>

            <div style={{ 
              overflowX: "auto",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              border: "1px solid #eaeaea"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                textAlign: "left"
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: "#f9f9f9",
                    borderBottom: "2px solid #eaeaea"
                  }}>
                    <th style={{ padding: "1rem", fontWeight: "600", color: "#333" }}>Name</th>
                    <th style={{ padding: "1rem", fontWeight: "600", color: "#333" }}>Status</th>
                    <th style={{ padding: "1rem", fontWeight: "600", color: "#333" }}>Progress</th>
                    <th style={{ padding: "1rem", fontWeight: "600", color: "#333" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr 
                      key={video.video_id}
                      style={{ 
                        borderBottom: "1px solid #eaeaea",
                        transition: "background-color 0.2s",
                        cursor: "pointer",
                        ":hover": {
                          backgroundColor: "#f9f9f9"
                        }
                      }}
                    >
                      <td style={{ 
                        padding: "1rem", 
                        color: "#666",
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        <span
                          onClick={(e) => handleClick(e, video)}
                          style={{
                            color: "#555",
                            cursor: "pointer",
                            fontWeight: 500,
                            fontSize: "14px",
                            transition: "color 0.2s ease-in-out"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#333";
                            e.currentTarget.style.textDecoration = "underline";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#555";
                            e.currentTarget.style.textDecoration = "none";
                          }}
                        >
                          {video.file_name}
                        </span>
                      </td>
                      <td style={{ 
                        padding: "1rem", 
                        color:
                          video.status === "COMPLETED"
                            ? "#34A853"
                            : video.status === "RUNNING"
                            ? "#4285F4"
                            : video.status === "FAILED"
                            ? "#EA4335"
                            : "#2E2E2E",
                        fontWeight: "500"
                      }}>
                        {video.status}
                      </td>
                      <td style={{ padding: "1rem", color: "#666" }}>
                        <div style={{ 
                          width: "100%", 
                          backgroundColor: "#f1f1f1", 
                          borderRadius: "4px",
                          overflow: "hidden"
                        }}>
                      <div
                        style={{
                          height: "8px",
                          width: `${video.progress ?? 0}%`,
                          backgroundColor: 
                            video.status === "COMPLETED"
                              ? "#34A853"
                              : video.status === "RUNNING"
                              ? "#4285F4"
                              : video.status === "FAILED"
                              ? "#EA4335"
                              : "#9E9E9E",
                          borderRadius: "4px"
                        }}
                      ></div>
                        </div>
                        <span style={{ fontSize: "0.8rem", marginTop: "0.25rem", display: "inline-block" }}>
                          {video.progress ?? 0}%
                        </span>
                      </td>
                      <td style={{ 
                        padding: "1rem", 
                        color: "#666",
                        maxWidth: "300px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {video.download_url ? (
                          <a
                            href={video.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "inline-block",
                              padding: "6px 12px",
                              backgroundColor: "#4285F4",
                              color: "#fff",
                              borderRadius: "4px",
                              textDecoration: "none",
                              fontSize: "14px",
                              fontWeight: "bold"
                            }}
                          >
                            Download ZIP
                          </a>
                        ) : (
                          <span style={{ color: "#9E9E9E", fontStyle: "italic" }}>Not available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
