import nodemailer from "nodemailer";

const host = "smtp.hostinger.com";
const port = 465;

/** Server-only SMTP transport for order inquiries; no credentials reach the browser. */
export async function sendHostingerMail(message: {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
}) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) throw new Error("SMTP is not configured");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: true, servername: host },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  await transporter.sendMail({
    from: { name: "LUVIPRO", address: user },
    to: message.to,
    replyTo: message.replyTo,
    subject: message.subject,
    text: message.text,
  });
}
