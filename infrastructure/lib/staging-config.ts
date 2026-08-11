export const STAGING_CONFIG = Object.freeze({
  region: 'eu-central-1',
  taskCpu: 512,
  taskMemoryMiB: 1024,
  apiPort: 3000,
  predictionPort: 8001,
  databasePort: 5432,
  databaseName: 'metaform_gym',
  backupDays: 1,
  logRetentionDays: 14,
})
