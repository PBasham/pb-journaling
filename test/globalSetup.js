// Run tests in a timezone with daylight saving so date bugs show up on every machine.
module.exports = async () => {
  process.env.TZ = 'America/New_York';
};
