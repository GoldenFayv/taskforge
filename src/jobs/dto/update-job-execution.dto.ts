import { IsDateString, IsNumber, IsOptional } from "class-validator";
import { CreateJobExecutionDto } from "./create-job-execution.dto";
import { PartialType } from "@nestjs/mapped-types"

export class UpdateJobExecutionDto extends PartialType(CreateJobExecutionDto) {
    @IsOptional()
    completedAt?: Date;

    @IsNumber()
    @IsOptional()
    durationMs?: number;

    error?: any;
}