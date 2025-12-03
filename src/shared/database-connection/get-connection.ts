import { winstonLogger } from 'src/common/logger/logger.service';
import { coreDataSource } from 'src/database/datasources/core-app-data-source';
import { DataSource, DataSourceOptions, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

interface CachedDataSource {
  dataSource: DataSource;
  lastAccess: number;
  initializing?: Promise<DataSource>;
}

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const connections: Record<string, CachedDataSource> = {};
const initializationLocks = new Map<string, Promise<DataSource>>();
const MAX_CONNECTIONS = 50;
let cleanupInterval: NodeJS.Timeout | null = null;

const requestQueue: Array<{
  schemaName: string;
  resolve: (ds: DataSource) => void;
  reject: (err: Error) => void;
}> = [];

let queueProcessing = false;

async function processQueue() {
  if (queueProcessing) return;
  queueProcessing = true;

  while (requestQueue.length > 0 && getActiveConnectionCount() < MAX_CONNECTIONS) {
    const job = requestQueue.shift();
    if (!job) continue;

    try {
      const ds = await createTenantConnection(job.schemaName);
      job.resolve(ds);
    } catch (err) {
      job.reject(err);
    }
  }

  queueProcessing = false;
}

function getActiveConnectionCount() {
  let active = 0;

  for (const item of Object.values(connections)) {
    if (item.dataSource.isInitialized) active++;
  }
  active += initializationLocks.size;
  return active;
}

async function createTenantConnection(schemaName: string): Promise<DataSource> {
  const now = Date.now();

  const baseOptions = coreDataSource.options as PostgresConnectionOptions;
  const dynamicOptions: DataSourceOptions = {
    ...baseOptions,
    name: schemaName,
    schema: schemaName,
  };

  const dataSource = new DataSource(dynamicOptions);

  await dataSource.initialize();
  connections[schemaName] = {
    dataSource,
    lastAccess: now,
  };

  return dataSource;
}

export async function getConnection(schemaName: string): Promise<DataSource> {
  const now = Date.now();

  const activeConnections = Object.keys(connections).length;

  if (activeConnections >= MAX_CONNECTIONS) {
    return new Promise((resolve, reject) => {
      requestQueue.push({ schemaName, resolve, reject });
      processQueue();
    });
  }

  if (connections[schemaName]?.dataSource.isInitialized) {
    connections[schemaName].lastAccess = now;
    return connections[schemaName].dataSource;
  }

  if (initializationLocks.has(schemaName)) {
    const existingInit = initializationLocks.get(schemaName)!;
    const dataSource = await existingInit;
    connections[schemaName].lastAccess = now;
    return dataSource;
  }

  const baseOptions = coreDataSource.options as PostgresConnectionOptions;
  const dynamicOptions: DataSourceOptions = {
    ...baseOptions,
    name: schemaName,
    schema: schemaName,
  };

  const dataSource = new DataSource(dynamicOptions);

  const initPromise = (async () => {
    try {
      await dataSource.initialize();
      connections[schemaName] = {
        dataSource,
        lastAccess: now,
      };
      return dataSource;
    } catch (err) {
      delete connections[schemaName];
      throw err;
    } finally {
      initializationLocks.delete(schemaName);
      processQueue();
    }
  })();

  initializationLocks.set(schemaName, initPromise);
  const result = await initPromise;

  if (!cleanupInterval) startCleanupInterval();

  return result;
}

function startCleanupInterval(): void {
  cleanupInterval = setInterval(async () => {
    const now = Date.now();
    const schemasToClean: string[] = [];

    for (const [schema, cached] of Object.entries(connections)) {
      if (cached.dataSource.isInitialized && now - cached.lastAccess > IDLE_TIMEOUT_MS) {
        schemasToClean.push(schema);
      }
    }

    for (const schema of schemasToClean) {
      try {
        await connections[schema].dataSource.destroy();
        delete connections[schema];
      } catch (err) {
        winstonLogger.error(`Failed to clean up connection for schema: ${schema}`);
        if (process.env.NODE_ENV !== 'production') {
          winstonLogger.debug(`Cleanup error for ${schema}: ${err.message}`);
        }
        delete connections[schema];
      }
    }

    // Stop interval if no active connections
    if (Object.keys(connections).length === 0 && cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  }, 60 * 1000);
}

export async function closeAllConnections(): Promise<void> {
  let i = 1;
  for (const [schema, cached] of Object.entries(connections)) {
    try {
      if (cached.dataSource.isInitialized) {
        await cached.dataSource.destroy();
      }
    } catch (err) {
      throw err;
    } finally {
      delete connections[schema];
    }
  }

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  initializationLocks.clear();
}

export async function getRepo<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  schema: string,
): Promise<Repository<T>> {
  const dataSource = await getConnection(schema);
  return dataSource.getRepository<T>(entity);
}
