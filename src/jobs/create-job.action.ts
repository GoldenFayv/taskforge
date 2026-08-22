import { PrismaService } from "src/prisma/prisma.service";
import { CreateJobDto } from "./dto/creat-job.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CreateJob {
    constructor(private prismaService: PrismaService) { }

    async handle(validatedData: CreateJobDto) {
        return await this.prismaService.job.create({
            data: {
                type: validatedData.type,
                payload: validatedData.payload,
            },
        });
    }
}