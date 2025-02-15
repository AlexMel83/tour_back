import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, CLIENT_URL } =
  process.env;

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }

  async sendActivationMail(to, link) {
    try {
      await this.transporter.sendMail({
        from: SMTP_USER,
        to,
        subject: `Активація аккаунту на ${CLIENT_URL.startsWith('https://') ? CLIENT_URL.replace('https://', '') : CLIENT_URL}`,
        text: '',
        html: `<div>
            <h2>Вітаємо Вас з успішною реєстрацією!</h2>
            Для активації аккаунту на платформі ${CLIENT_URL} перейдіть за посиланням нижче:
            <p><a href="${link}">${link}</a></p>
            Якщо Ви не реєструвалися на цій платформі, просто ігноруйте цей лист.
        </div>`,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new MailService();
