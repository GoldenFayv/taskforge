import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { JobStatus } from "src/generated/prisma/enums";
import { LoggerService } from "src/logger.service";
import { PrismaService } from "src/prisma/prisma.service";

@Processor('jobs')
export class ProcessJobs extends WorkerHost{
    constructor(private logger: LoggerService, private prismaService: PrismaService){super()}

    async process(job: Job){
        await this.prismaService.job.update({
            where: {id: job.data.id},
            data: {
                status: JobStatus.PROCESSING
            }
        });
        try {
            this.logger.log("Proccessing job:", job.id)
            this.logger.log("Job name:", job.name)
            this.logger.log("Job data:", job.data)
        } catch (error) {
            this.logger.error("Failed processing job")
            await this.prismaService.job.update({
                where: {id: job.data.id},
                data: { status: JobStatus.FAILED}
            });

            throw error;
        }
    }
}