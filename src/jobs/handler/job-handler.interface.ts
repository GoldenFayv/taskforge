import { Job } from "bullmq";
import { JobType } from "src/generated/prisma/enums";

export interface JobHandler {
    type: JobType,
    
    handle(job: Job): Promise<void>;
}