import { Controller, Get } from "@nestjs/common";
import { DeadLetterService } from "./dead-letter.service";

@Controller('jobs/deadletters')
export class DeadLetterController{
    constructor(private deadLetterService: DeadLetterService){}
    @Get()
    async index(){
        return this.deadLetterService.findAll()
    }
}