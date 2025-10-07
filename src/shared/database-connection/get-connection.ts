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
const MAX_CONNECTIONS = 50;
let cleanupInterval: NodeJS.Timeout | null = null;

export async function getConnection(schemaName: string): Promise<DataSource> {
  const now = Date.now();

  const activeConnections = Object.keys(connections).length;
  if (activeConnections >= MAX_CONNECTIONS) {
    throw new ServiceUnavailableException('Maximum tenant connection limit reached ');
  }
  if (connections[schemaName]?.dataSource.isInitialized) {
    connections[schemaName].lastAccess = now;
    return connections[schemaName].dataSource;
  }

  if (connections[schemaName]?.initializing) {
    await connections[schemaName].initializing;
    connections[schemaName].lastAccess = now;
    return connections[schemaName].dataSource;
  }

  const baseOptions = coreDataSource.options as PostgresConnectionOptions;
  const dynamicOptions: DataSourceOptions = {
    ...baseOptions,
    name: schemaName,
    schema: schemaName,
  };

  const dataSource = new DataSource(dynamicOptions);

  connections[schemaName] = {
    dataSource,
    lastAccess: now,
    initializing: dataSource.initialize(),
  };

  try {
    await connections[schemaName].initializing;
    delete connections[schemaName].initializing;
  } catch (err) {
    delete connections[schemaName]; // cleanup on failure
    throw err;
  }

  if (!cleanupInterval) startCleanupInterval();

  return dataSource;
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
        throw new Error(`[TenantDB] Failed to close connection for ${schema}:${err}`);
      }
    }

    // Stop interval if no active connections
    if (Object.keys(connections).length === 0 && cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  }, 60 * 1000);
}

export async function getRepo<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  schema: string,
): Promise<Repository<T>> {
  const dataSource = await getConnection(schema);
  return dataSource.getRepository<T>(entity);
}
