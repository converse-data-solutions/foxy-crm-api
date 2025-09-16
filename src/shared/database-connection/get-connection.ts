import { coreDataSource } from 'src/database/datasource/core-app-data-source';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export function getConnection(schemaName: string) {
  const baseOptions = coreDataSource.options as PostgresConnectionOptions;

  const dynamicOptions: DataSourceOptions = {
    ...baseOptions,
    schema: schemaName,
  };
  const dynamicDataSource = new DataSource(dynamicOptions);
  return dynamicDataSource;
}

export function getRepo<T>(entity: new () => T, schema: string) {
  const dynamicDataSource = getConnection(schema);
  const repo = dynamicDataSource.getRepository(entity);

  const closeConnection = async () => {
    if (dynamicDataSource.isInitialized) {
      await dynamicDataSource.destroy();
    }
  };

  return { repo, closeConnection };
}
