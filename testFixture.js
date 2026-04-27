// @ts-check
/**
 * Single import surface used by all spec files.
 *
 * - When PW_TARGET=lambdatest (set automatically by `lambdatest.config.js`
 *   via the project metadata), the LambdaTest cloud fixture is used.
 * - Otherwise the local logging fixture is used.
 */
const useCloud = process.env.PW_TARGET === 'lambdatest';
module.exports = useCloud
  ? require('./lambdatestFixture')
  : require('./loggingFixture');
