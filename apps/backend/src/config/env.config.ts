export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,

  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],

  LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN || '',
  LOGTAIL_INGESTING_HOST: process.env.LOGTAIL_INGESTING_HOST
    ? `https://${process.env.LOGTAIL_INGESTING_HOST}`
    : '',
  NOMBA_DEFAULT_EMAIL:
    process.env.NOMBA_DEFAULT_EMAIL || 'orders@tradechat.com',
  NOMBA_SUBACCOUNT_ID: process.env.NOMBA_SUBACCOUNT_ID,
};
