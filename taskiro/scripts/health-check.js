#!/usr/bin/env node

/**
 * Health check script for production monitoring
 */

const http = require('http');

const HEALTH_URL = process.env.HEALTH_URL || 'http://localhost:3001/health';
const TIMEOUT = parseInt(process.env.HEALTH_TIMEOUT) || 5000;

function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL(HEALTH_URL);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname,
        method: 'GET',
        timeout: TIMEOUT,
      },
      (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const healthData = JSON.parse(data);
              resolve({
                status: 'healthy',
                statusCode: res.statusCode,
                response: healthData,
                timestamp: new Date().toISOString(),
              });
            } catch (e) {
              resolve({
                status: 'healthy',
                statusCode: res.statusCode,
                response: data,
                timestamp: new Date().toISOString(),
              });
            }
          } else {
            reject({
              status: 'unhealthy',
              statusCode: res.statusCode,
              response: data,
              timestamp: new Date().toISOString(),
            });
          }
        });
      }
    );

    req.on('error', (error) => {
      reject({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        status: 'timeout',
        error: `Request timed out after ${TIMEOUT}ms`,
        timestamp: new Date().toISOString(),
      });
    });

    req.end();
  });
}

async function main() {
  try {
    const result = await checkHealth();
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { checkHealth };
