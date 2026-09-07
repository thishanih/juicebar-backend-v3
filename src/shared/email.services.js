import nodemailer from "nodemailer";

class EmailService {
  getTransporter() {
    const port = Number(process.env.SMTP_PORT);

    if (
      !process.env.SMTP_HOST ||
      !Number.isInteger(port) ||
      !process.env.SMTP_USERNAME ||
      !process.env.SMTP_PASSWORD
    ) {
      throw new Error("SMTP configuration is required");
    }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: "TLSv1.2",
      },
    });
  }

  async registerStaff() {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USERNAME;
    const to = process.env.SMTP_TO || process.env.SMTP_USERNAME;

    return transporter.sendMail({
      from: from,
      to: to,
      subject: "Subject",
      text: "Email content",
    });
  }
}

export default new EmailService();
