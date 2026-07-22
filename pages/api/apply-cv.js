// pages/api/apply-cv.js
// Optional CV upload on registration, emails the applicant's CV (as an
// attachment) to the admin address that receives withdrawal requests, etc.
// Uses the same SMTP + NOTIFY_EMAIL setup as /api/notify and /api/submit-task.
import formidable from "formidable";
import fs from "fs";
import nodemailer from "nodemailer";

export const config = { api: { bodyParser: false } };

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const form = formidable({ maxFileSize: 5 * 1024 * 1024, keepExtensions: true });

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (err) {
    console.error("[apply-cv] parse error:", err);
    return res.status(400).json({ success: false, message: "Failed to parse upload." });
  }

  const get = (f) => (Array.isArray(fields[f]) ? fields[f][0] : fields[f] || "N/A");
  const fullName = get("fullName");
  const email    = get("email");
  const phone    = get("phone");
  const country  = get("country");

  const uploaded = files.cv?.[0] || files.cv;
  if (!uploaded) return res.status(400).json({ success: false, message: "No CV received." });

  const filePath = uploaded.filepath;
  const fileName = uploaded.originalFilename || `cv-${Date.now()}`;
  const mimeType = uploaded.mimetype || "application/octet-stream";

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/rtf",
    "text/plain",
    "text/rtf",
  ];
  if (!allowedTypes.includes(mimeType)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    return res.status(400).json({ success: false, message: "CV must be a PDF or Word document." });
  }

  let fileBuffer;
  try {
    fileBuffer = await fs.promises.readFile(filePath);
  } catch (err) {
    console.error("[apply-cv] read error:", err);
    return res.status(500).json({ success: false, message: "File processing failed." });
  }

  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: smtpPort,
    secure: process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === "true" : smtpPort === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const destination = process.env.NOTIFY_EMAIL || process.env.SMTP_USER || "businesshub.comke@gmail.com";

  let emailSent = true;
  try {
    await transporter.sendMail({
      from: `"Business Hub" <${process.env.SMTP_USER}>`,
      to: destination,
      replyTo: email && email !== "N/A" ? email : undefined,
      subject: `[New Applicant CV] ${fullName !== "N/A" ? fullName : email}`,
      html: `
        <h2>New Applicant CV</h2>
        <table cellpadding="8" style="border-collapse:collapse;font-family:Inter,sans-serif;font-size:14px;">
          <tr><td><strong>Name</strong></td><td>${escHtml(fullName)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${escHtml(email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${escHtml(phone)}</td></tr>
          <tr><td><strong>Country</strong></td><td>${escHtml(country)}</td></tr>
          <tr><td><strong>CV File</strong></td><td>${escHtml(fileName)}</td></tr>
          <tr><td><strong>Received</strong></td><td>${new Date().toLocaleString("en-KE")}</td></tr>
        </table>
        <p>The applicant's CV is attached.</p>`,
      attachments: [{ filename: fileName, content: fileBuffer, contentType: mimeType }],
    });
  } catch (err) {
    emailSent = false;
    console.error("[apply-cv] send error:", err);
  }

  try { await fs.promises.unlink(filePath); } catch (_) {}

  return res.status(200).json({ success: true, emailSent });
}
