export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,

  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000'],
};
