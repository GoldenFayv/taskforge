import { Controller, Delete, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { DeadLetterService } from "./dead-letter.service";

@Controller('jobs/deadletters/:id/retry')
export class RetryDeadLetterController{
    constructor(private deadLetterService: DeadLetterService){}
    @Delete()
    async handle(@Param('id') id: string){
        return await this.deadLetterService.retry(id)
    }
}