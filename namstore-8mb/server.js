import express from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT || 3000);
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(dataDir, "uploads");
const outputDir = path.join(dataDir, "output");
const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 2048);

ffmpeg.setFfprobePath(ffprobeInstaller.path);

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: maxUploadMb * 1024 * 1024 },
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/download", express.static(outputDir));

function safeRemove(filePath) {
  fs.rm(filePath, { force: true }, () => {});
}

function probe(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (error, metadata) => {
      if (error) reject(error);
      else resolve(metadata);
    });
  });
}

function compressVideo(inputPath, outputPath, targetMb, audioKbps) {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await probe(inputPath);
      const duration = Number(metadata.format.duration || 0);

      if (!duration || duration <= 0) {
        throw new Error("Could not determine video duration.");
      }

      const targetBits = targetMb * 1024 * 1024 * 8;
      const audioBitrate = Math.max(32, Number(audioKbps || 96));
      const safetyRatio = 0.94;
      const availableKbps = targetBits / duration / 1000 - audioBitrate;
      const videoKbps = Math.floor(availableKbps * safetyRatio);

      if (videoKbps < 100) {
        throw new Error(
          "Target size is too small for this video's duration and audio bitrate. Try a larger target or lower audio bitrate.",
        );
      }

      ffmpeg(inputPath)
        .outputOptions([
          "-c:v libx264",
          "-preset veryslow",
          `-b:v ${videoKbps}k`,
          `-maxrate ${videoKbps}k`,
          `-bufsize ${videoKbps * 2}k`,
          "-pix_fmt yuv420p",
          "-movflags +faststart",
          "-c:a aac",
          `-b:a ${audioBitrate}k`,
        ])
        .on("error", reject)
        .on("end", resolve)
        .save(outputPath);
    } catch (error) {
      reject(error);
    }
  });
}

app.post("/compress", upload.single("video"), async (req, res) => {
  const uploadedFile = req.file;

  try {
    if (!uploadedFile) {
      return res.status(400).json({ error: "Upload a video file first." });
    }

    const targetMb = Number(req.body.targetMb || 8);
    const audioKbps = Number(req.body.audioKbps || 96);

    if (!Number.isFinite(targetMb) || targetMb <= 0 || targetMb > 2000) {
      return res.status(400).json({ error: "Target size must be between 1 MB and 2000 MB." });
    }

    const id = crypto.randomUUID();
    const outputName = `${id}-compressed.mp4`;
    const outputPath = path.join(outputDir, outputName);

    await compressVideo(uploadedFile.path, outputPath, targetMb, audioKbps);

    const stats = fs.statSync(outputPath);
    safeRemove(uploadedFile.path);

    return res.json({
      downloadUrl: `/download/${outputName}`,
      outputMb: Number((stats.size / 1024 / 1024).toFixed(2)),
      targetMb,
    });
  } catch (error) {
    if (uploadedFile?.path) safeRemove(uploadedFile.path);
    return res.status(500).json({ error: error.message || "Compression failed." });
  }
});

app.listen(port, () => {
  console.log(`8mb.local listening on port ${port}`);
});
