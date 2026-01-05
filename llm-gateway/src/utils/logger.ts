import { createLogger, logger as sharedLogger } from "shared/logger";
import type { Logger } from "winston";

export const logger: Logger = sharedLogger;
export { createLogger };
