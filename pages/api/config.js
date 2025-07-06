export default function handler(req, res) {
    res.status(200).json({ backendUrl: process.env.BACKEND_URL });
  }