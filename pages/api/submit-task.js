// pages/api/submit-task.js
// Receives multipart/form-data upload, emails file attachment to admin.

import formidable from "formidable";
import fs from "fs";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

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
  const taskPayment  = get("taskPayment");
  const taskCategory = get("taskCategory");
  const userId    = get("userId");
  const userEmail = get("userEmail");
  const userName  = get("userName");
  const note      = get("note");

  // ── 2b. Proposal gate — regular tasks require an APPROVED application ──────
  // Offer tasks (offer_…) are exempt. Best-effort: if the DB isn't configured we
  // can't verify, so we don't block (matches the rest of this endpoint).
  const isOfferTask = String(taskId || "").startsWith("offer_");
  if (!isOfferTask && taskId && taskId !== "N/A" && userId && userId !== "N/A"
      && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const gate = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );
      const { data: appRow, error: appErr } = await gate.from("applications")
        .select("status").eq("user_id", userId).eq("task_id", String(taskId))
        .eq("status", "approved").limit(1).maybeSingle();
      // Only block when we can positively confirm there is no approved proposal.
      if (!appErr && !appRow) {
        return res.status(403).json({ success: false, message: "An approved proposal is required before you can submit this task." });
      }
    } catch (_) { /* verification unavailable — fall through */ }
  }

  // Format the task's payment for the email (so admin sees what the task costs)
  const paymentNum = Number(taskPayment);
  const paymentDisplay =
    taskPayment && taskPayment !== "N/A" && !Number.isNaN(paymentNum)
      ? `KES ${paymentNum.toLocaleString("en-KE")}`
      : "N/A";

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
    // images (screenshots of completed work)
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
  ];

  if (!allowedTypes.includes(mimeType)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
    return res.status(400).json({ success: false, message: "Unsupported file type. Please upload a document, image, audio, video or zip." });
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
    replyTo: userEmail && userEmail !== "N/A" ? userEmail : undefined,
    subject: `[Task Submission] ${taskTitle} (${paymentDisplay}) — ${userName !== "N/A" ? userName : "User " + userId}`,
    html: `
      <h2>New Task Submission</h2>
      <table cellpadding="8" style="border-collapse:collapse;font-family:Inter,sans-serif;font-size:14px;">
        <tr><td><strong>Task ID</strong></td><td>${escHtml(taskId)}</td></tr>
        <tr><td><strong>Task Title</strong></td><td>${escHtml(taskTitle)}</td></tr>
        <tr><td><strong>Task Payment</strong></td><td><strong style="color:#059669;">${escHtml(paymentDisplay)}</strong></td></tr>
        <tr><td><strong>Category</strong></td><td>${escHtml(taskCategory)}</td></tr>
        <tr><td><strong>Name</strong></td><td>${escHtml(userName)}</td></tr>
        <tr><td><strong>User ID</strong></td><td>${escHtml(userId)}</td></tr>
        <tr><td><strong>User Email</strong></td><td>${escHtml(userEmail)}</td></tr>
        <tr><td valign="top"><strong>Note</strong></td><td><pre style="margin:0;font-family:inherit;white-space:pre-wrap;">${escHtml(note)}</pre></td></tr>
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

  // Auto-reply confirmation to the client
  if (userEmail && userEmail !== "N/A") {
    try {
      await transporter.sendMail({
        from: `"Business Hub" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: `We received your submission — ${taskTitle}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#111827;line-height:1.6;">
            <p>Hi ${escHtml(userName !== "N/A" ? userName : "there")},</p>
            <p>Thank you — we’ve received your submission for <strong>${escHtml(taskTitle)}</strong> with your attached file <strong>${escHtml(fileName)}</strong>. Our team will review it and get back to you.</p>
            <p>Warm regards,<br/>The Business Hub Team</p>
          </div>`,
      });
    } catch (err) {
      console.error("[submit-task] client auto-reply error:", err.message);
    }
  }

  // ── 7b. Log the submission for admin review (approve/reject) ───────────────
  // Best-effort: if the `submissions` table or DB isn't configured, submission
  // still succeeds — this just won't appear in the admin review list.
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );
      await db.from("submissions").insert({
        user_id:    userId    !== "N/A" ? userId    : null,
        user_email: userEmail !== "N/A" ? userEmail : null,
        user_name:  userName  !== "N/A" ? userName  : null,
        task_id:    taskId    !== "N/A" ? taskId    : null,
        task_title: taskTitle,
        reward:     !Number.isNaN(paymentNum) ? paymentNum : 0,
        note:       note !== "N/A" ? note : "",
        status:     "pending",
      });

      // Offer tasks are one-submission-only — mark claimed so the offer is
      // removed from everyone else's dashboard once someone submits it.
      if (taskId && taskId !== "N/A" && taskId.startsWith("offer_")) {
        const { data: t } = await db.from("tasks").select("claimed").eq("id", taskId).maybeSingle();
        if (t) await db.from("tasks").update({ claimed: Number(t.claimed || 0) + 1 }).eq("id", taskId);
      }
    }
  } catch (err) {
    console.error("[submit-task] submission log error:", err.message);
  }

  // ── 8. Cleanup temp file ───────────────────────────────────────────────────
  try { await fs.promises.unlink(filePath); } catch (_) {}

  return res.status(200).json({ success: true, emailSent });
}
