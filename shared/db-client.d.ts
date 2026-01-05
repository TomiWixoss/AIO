export declare function createDbClient(baseUrl: string): {
    dbGet: <T>(path: string) => Promise<T>;
    dbPost: <T>(path: string, data: object) => Promise<T>;
    dbPut: <T>(path: string, data: object) => Promise<T>;
    dbDelete: <T>(path: string) => Promise<T>;
};
export type DbClient = ReturnType<typeof createDbClient>;
