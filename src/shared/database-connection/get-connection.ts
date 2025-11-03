import { ServiceUnavailableException } from '@nestjs/common';
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

export async function getConnection(schemaName: string) {
  const now = Date.now();

  const activeConnections = Object.keys(connections).length;
  if (activeConnections >= MAX_CONNECTIONS) {
    throw new ServiceUnavailableException('Maximum tenant connection limit reached');
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
        throw err;
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
