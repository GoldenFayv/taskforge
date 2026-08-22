import { JobType } from "src/generated/prisma/enums";
import { JobHandler } from "./job-handler.interface";
import { Job } from "bullmq";
import { MailService } from "src/mail/mail.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EmailJobHandler implements JobHandler {
    type = JobType.EMAIL

    constructor(private mailService: MailService) { }

    async handle(job: Job) {
        const { payload } = job.data
        await this.mailService.sendMail(payload)
    }
}