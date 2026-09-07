import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "thishan.developer@gmail.com",
        pass: "bngb lbgk yxgk odyp",
      },
    });
  }

  async registerStaff() {
    try {
      const mailOptions = {
        from: "thishan.developer@gmail.com",
        to: "thishan.developer@gmail.com",
        subject: "Subject",
        text: "Email content",
      };
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw error;
    }
  }
}

export default new EmailService();
