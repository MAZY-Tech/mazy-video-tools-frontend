import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState(0);
  const [backendUrl, setBackendUrl] = useState(null);

  if (status === "loading") return <p>Loading…</p>;
  if (!session) return <button onClick={() => signIn("cognito")}>Sign in</button>;

  useEffect(() => {
    (async () => {
      const resp = await fetch("/api/config");
      const { backendUrl } = await resp.json();
      setBackendUrl(backendUrl.replace(/\/$/, "")); 
    })();
  }, []);

  // Lê o arquivo e calcula a duração em segundos
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

    const apiBase = `${backendUrl}/api`;

    try {
      const { name, size } = file;
      
      const durationSeconds = duration;

      const presignRes = await fetch(`${apiBase}/presign-upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ filename: name, sizeBytes: size, durationSeconds }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Erro ao obter URL de upload");
      }

      const { uploadUrl } = presignData;

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) {
        throw new Error("Falha ao enviar o arquivo para o S3");
      }

      alert("Upload successful!");
      setFile(null);
      setDuration(0);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Upload Video</h1>
      <p>Duração: {duration}s</p>
      <input type="file" accept="video/*" onChange={handleFile} />
      <button onClick={handleUpload} disabled={!file}>
        Upload
      </button>
    </div>
  );
}
