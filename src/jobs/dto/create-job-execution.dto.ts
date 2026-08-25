import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { JobExecutionStatus } from "src/generated/prisma/enums";

export class CreateJobExecutionDto {
    @IsNumber()
    attempt!: number;

    @IsEnum(JobExecutionStatus)
    status!: JobExecutionStatus;

    startedAt!: Date;
}