export function getVideoDuration(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Math.floor(video.duration)); // segundos arredondados
      };
      video.onerror = reject;
      video.src = url;
    });
  }