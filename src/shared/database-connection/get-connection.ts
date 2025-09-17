import { coreDataSource } from 'src/database/datasource/core-app-data-source';
import {
  DataSource,
  DataSourceOptions,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

interface CachedDataSource {
  dataSource: DataSource;
  lastAccess: number;
}

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const connections: Record<string, CachedDataSource> = {};

export async function getConnection(schemaName: string): Promise<DataSource> {
  const now = Date.now();

  if (connections[schemaName]?.dataSource.isInitialized) {
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
  await dataSource.initialize();

  connections[schemaName] = { dataSource, lastAccess: now };
  return dataSource;
}

//terminate connection for every 1 min
setInterval(async () => {
  const now = Date.now();
  for (const [schema, cached] of Object.entries(connections)) {
    if (
      cached.dataSource.isInitialized &&
      now - cached.lastAccess > IDLE_TIMEOUT_MS
    ) {
      await cached.dataSource.destroy();
      delete connections[schema];
    }
  }
}, 60 * 1000);

export async function getRepo<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  schema: string,
): Promise<Repository<T>> {
  const dataSource = await getConnection(schema);
  return dataSource.getRepository<T>(entity);
}
