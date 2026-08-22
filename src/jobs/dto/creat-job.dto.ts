import { ArrayNotEmpty, IsArray, isEnum, IsEnum, IsIn, IsNotEmpty, IsObject, IsString } from "class-validator";
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
}