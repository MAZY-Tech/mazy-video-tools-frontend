import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function VideosPage() {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
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
        setVideos(videosData.videos);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session]);

  useEffect(() => {
    console.log(videos)
  },[videos])

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
                    <th style={{ padding: "1rem", fontWeight: "600", color: "#333" }}>Video ID</th>
                    <th style={{ padding: "1rem", fontWeight: "600", color: "#333" }}>Status</th>
                    <th style={{ padding: "1rem", fontWeight: "600", color: "#333" }}>Progress</th>
                    <th style={{ padding: "1rem", fontWeight: "600", color: "#333" }}>Download URL</th>
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
                        {video.video_id}
                      </td>
                      <td style={{ 
                        padding: "1rem", 
                        color: video.status === "COMPLETED" ? "#34A853" : "#FBBC05",
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
                          <div style={{ 
                            height: "8px", 
                            width: `${video.progress}%`, 
                            backgroundColor: video.status === "COMPLETED" ? "#34A853" : "#FBBC05",
                            borderRadius: "4px"
                          }}></div>
                        </div>
                        <span style={{ fontSize: "0.8rem", marginTop: "0.25rem", display: "inline-block" }}>
                          {video.progress}%
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
                            style={{ color: "#4285F4", textDecoration: "none" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {video.download_url}
                          </a>
                        ) : (
                          "Not available"
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <button 
                          style={{ 
                            padding: "0.5rem 1rem",
                            backgroundColor: "#4285F4",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "background-color 0.2s"
                          }}
                          onClick={() => router.push(`/video/${video.video_id}`)}
                        >
                          View Details
                        </button>
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
