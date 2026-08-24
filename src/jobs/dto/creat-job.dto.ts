import { IsDateString, IsEnum, IsNotEmpty, IsNumberString, IsObject, IsOptional, IsString } from "class-validator";
import { JobPriority, JobType } from "src/generated/prisma/enums";

export class CreateJobDto {
    @IsString()
    @IsNotEmpty()
    @IsEnum(JobType)
    type!: JobType;

    @IsObject()
    payload!: Record<string, any>;

    @IsEnum(JobPriority)
    priority!: JobPriority

    @IsDateString({ strict: true })
    @IsOptional()
    scheduledAt?: string;

    @IsString()
    @IsOptional()
    idempotencyKey?: string;

    @IsString()
    @IsOptional()
    idempotencyBodyHash?: string
}