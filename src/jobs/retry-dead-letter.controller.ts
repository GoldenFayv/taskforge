import { Controller, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { DeadLetterService } from "./dead-letter.service";

@Controller('jobs/deadletter/:id/retry')
export class RetryDeadLetterController{
    constructor(private deadLetterService: DeadLetterService){}
    @Post()
    async handle(@Param('id', ParseUUIDPipe) id: string){
        return this.deadLetterService.retry(id)
    }
}