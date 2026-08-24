import { Controller, Param, Post } from "@nestjs/common";
import { JobsService } from "./jobs.service";

@Controller('jobs/:id/cancel')
export class CancelJobController {
    constructor(private jobService: JobsService) { }
    @Post()
    async handle(@Param('id') id: string) {
        return await this.jobService.cancelJob(id);
    }
}