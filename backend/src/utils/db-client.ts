import { createDbClient } from "shared/db-client";
import { config } from "../config/index.js";

const { dbGet, dbPost, dbPut, dbDelete } = createDbClient(
  config.services.database
);

export { dbGet, dbPost, dbPut, dbDelete };
