import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter()
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [apiUrl, setApiUrl] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    (async () => {
      const resp = await fetch("/api/config");
      const { apiUrl } = await resp.json();
      setApiUrl(apiUrl.replace(/\/$/, ""));
    })();
  }, []);

  const generateFileHash = async (file) => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const url = URL.createObjectURL(f);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      setDuration(Math.floor(video.duration));
      URL.revokeObjectURL(url);
    };
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const apiBase = `${apiUrl}/api`;

    try {
      const { name, size } = file;

      const durationSeconds = duration;

      const videoHash = await generateFileHash(file);

      const userId = JSON.parse(atob(session.accessToken.split(".")[1])).sub;

      const presignRes = await fetch(`${apiBase}/presign-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          filename: name,
          sizeBytes: size,
          durationSeconds,
          "Content-Type": file.type,
          "x-amz-meta-video_hash": videoHash,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Erro ao obter URL de upload");
      }

      const { uploadUrl, videoId } = presignData;

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
          "x-amz-meta-video_id" : videoId,
          "x-amz-meta-video_hash": videoHash,
          "x-amz-meta-cognito_user_id": userId,
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Falha ao enviar o arquivo para o S3");
      }

      setFile(null);
      setDuration(0);

      router.push(`video/${videoId}`);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 style={{ color: "#333", margin: 0 }}>Upload Video</h1>
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
        </nav>
      </header>

      <main style={{ 
        backgroundColor: "#f9f9f9", 
        padding: "2rem", 
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ color: "#333", marginBottom: "1rem" }}>Upload a New Video</h2>
          <p style={{ color: "#666" }}>Select a video file to upload to your collection.</p>
        </div>

        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "1.5rem",
          maxWidth: "500px"
        }}>
          <div>
            <label 
              htmlFor="video-file" 
              style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontWeight: "bold",
                color: "#333"
              }}
            >
              Choose Video File
            </label>
            <input 
              id="video-file"
              type="file" 
              accept="video/*" 
              onChange={handleFile} 
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "white"
              }}
            />
          </div>

          {duration > 0 && (
            <div style={{ 
              padding: "1rem", 
              backgroundColor: "#e8f0fe", 
              borderRadius: "4px",
              border: "1px solid #4285F4"
            }}>
              <p style={{ margin: 0, color: "#333" }}>
                <strong>Video Duration:</strong> {duration} seconds
              </p>
            </div>
          )}

          <button 
            onClick={handleUpload} 
            disabled={!file || loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: (file && !loading) ? "#4285F4" : "#cccccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: (file && !loading) ? "pointer" : "not-allowed",
              fontWeight: "bold",
              marginTop: "1rem"
            }}
          >
            {!file ? "Select a file first" : loading ? "Loading..." : "Upload Video"}
          </button>
        </div>
      </main>
    </div>
  );
}
