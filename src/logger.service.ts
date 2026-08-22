import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class LoggerService {
  private readonly logger = new Logger(LoggerService.name);

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, context);
  }

  error(message: string, stack?: string, context?: string){
    this.logger.error(message, stack, context);
  }
}