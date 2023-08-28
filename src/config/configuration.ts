export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  wsj: {
    username: process.env.WSJ_USERNAME || '',
    password: process.env.WSJ_PASSWORD || '',
  },
});
