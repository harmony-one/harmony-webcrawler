export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS, 10) || 2,
  maxJobsQueue: parseInt(process.env.MAX_JOBS_QUEUE, 10) || 10,
});
