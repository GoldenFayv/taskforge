import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer'
import { IMailData } from './mail.interface';

@Injectable()
export class MailService {
    private transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASSWORD
        }
    });

    async sendMail(data: IMailData) {
        return await this.transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: data.to,
            subject: data.subject,
            text: data.body,
        });
    }
}
