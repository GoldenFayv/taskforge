import { Controller, Get, Param } from "@nestjs/common";
import { DeadLetterService } from "./dead-letter.service";

@Controller('jobs/deadletters')
export class DeadLetterController {
    constructor(private deadLetterService: DeadLetterService) { }
    @Get()
    async index() {
        return this.deadLetterService.findAllDeadLetters()
    }

    @Get('/:id')
    async show(@Param('id') id: string){
        return this.deadLetterService.findOneDeadLetter(id);
    }
}