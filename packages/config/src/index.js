export function getServerConfig(env = process.env) {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    databaseUrl: env.DATABASE_URL ?? '',
    redisUrl: env.REDIS_URL ?? ''
  };
}
