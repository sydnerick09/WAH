// pages/api/submit-task.js
// Receives multipart/form-data upload, emails file attachment to admin.

import formidable from "formidable";
import fs from "fs";
import nodemailer from "nodemailer";

export const config = {
  api: {
    bodyParser: false,
  },
};

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  // ── 1. Parse multipart form ───────────────────────────────────────────────
  const form = formidable({
    maxFileSize: 5 * 1024 * 1024,
    keepExtensions: true,
  });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    console.error("[submit-task] Form parse error:", err);
    return res.status(400).json({ success: false, message: "Failed to parse upload." });
  }

  // ── 2. Extract fields safely ──────────────────────────────────────────────
  const get = (f) => (Array.isArray(fields[f]) ? fields[f][0] : fields[f] || "N/A");
  const taskId    = get("taskId");
  const taskTitle = get("taskTitle") || "Unknown Task";
  const userId    = get("userId");
  const userEmail = get("userEmail");

  // ── 3. Get uploaded file ──────────────────────────────────────────────────
  const uploadedFile = files.file?.[0] || files.file;
  if (!uploadedFile) {
    return res.status(400).json({ success: false, message: "No file received." });
  }

  const filePath = uploadedFile.filepath;
  const fileName = uploadedFile.originalFilename || `submission-${Date.now()}`;
  const mimeType = uploadedFile.mimetype || "application/octet-stream";

  // ── 4. Validate file type — no images (matches client-side restriction) ───
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "audio/mpeg",
    "audio/mp3",
    "video/mp4",
    "application/zip",
    "application/x-rar-compressed",
    "application/vnd.rar",
  ];

  if (!allowedTypes.includes(mimeType)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    return res.status(400).json({ success: false, message: "Invalid file type. Images are not accepted." });
  }

  // ── 5. Read file ──────────────────────────────────────────────────────────
  let fileBuffer;
  try {
    fileBuffer = await fs.promises.readFile(filePath);
  } catch (err) {
    console.error("[submit-task] File read error:", err);
    return res.status(500).json({ success: false, message: "File processing failed." });
  }

  // ── 6. SMTP transporter ───────────────────────────────────────────────────
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    // port 465 requires SSL; fall back to env override if provided
    secure: process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const destination = process.env.NOTIFY_EMAIL || "businesshub.comke@gmail.com";

  // ── 7. Send email ─────────────────────────────────────────────────────────
  const mailOptions = {
    from: `"Business Hub" <${process.env.SMTP_USER}>`,
    to: destination,
    subject: `[Task Submission] ${taskTitle} — User ${userId}`,
    html: `
      <h2>New Task Submission</h2>
      <table cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td><strong>Task ID</strong></td><td>${escHtml(taskId)}</td></tr>
        <tr><td><strong>Task Title</strong></td><td>${escHtml(taskTitle)}</td></tr>
        <tr><td><strong>User ID</strong></td><td>${escHtml(userId)}</td></tr>
        <tr><td><strong>User Email</strong></td><td>${escHtml(userEmail)}</td></tr>
        <tr><td><strong>File Name</strong></td><td>${escHtml(fileName)}</td></tr>
        <tr><td><strong>Submitted At</strong></td><td>${new Date().toLocaleString("en-KE")}</td></tr>
      </table>
      <p>The submitted file is attached.</p>
    `,
    attachments: [{ filename: fileName, content: fileBuffer, contentType: mimeType }],
  };

  let emailSent = true;
  try {
    await transporter.sendMail(mailOptions);
    console.log(`[submit-task] Email sent to ${destination}`);
  } catch (err) {
    emailSent = false;
    console.error("[submit-task] Email send error:", err);
  }

  // ── 8. Cleanup temp file ───────────────────────────────────────────────────
  try { await fs.promises.unlink(filePath); } catch (_) {}

  return res.status(200).json({ success: true, emailSent });
}
