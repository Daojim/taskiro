#!/usr/bin/env node

/**
 * Environment validation script for production deployment
 */

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'POSTGRES_PASSWORD',
  'FRONTEND_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
];

const optionalEnvVars = ['PORT', 'NODE_ENV', 'DATABASE_URL'];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  let hasErrors = false;
  const warnings = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];

    if (!value) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      hasErrors = true;
    } else {
      // Validate specific formats
      if (envVar === 'JWT_SECRET' || envVar === 'JWT_REFRESH_SECRET') {
        if (value.length < 32) {
          console.error(`❌ ${envVar} must be at least 32 characters long`);
          hasErrors = true;
        } else {
          console.log(`✅ ${envVar}: Valid (${value.length} characters)`);
        }
      } else if (
        envVar === 'FRONTEND_URL' ||
        envVar === 'GOOGLE_REDIRECT_URI'
      ) {
        if (!value.startsWith('http')) {
          console.error(
            `❌ ${envVar} must be a valid URL starting with http/https`
          );
          hasErrors = true;
        } else {
          console.log(`✅ ${envVar}: ${value}`);
        }
      } else if (envVar === 'POSTGRES_PASSWORD') {
        if (value.length < 8) {
          warnings.push(`⚠️  ${envVar} should be at least 8 characters long`);
        }
        console.log(`✅ ${envVar}: Set (${value.length} characters)`);
      } else {
        console.log(`✅ ${envVar}: Set`);
      }
    }
  }

  // Check optional variables
  console.log('\n📋 Optional environment variables:');
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value}`);
    } else {
      console.log(`ℹ️  ${envVar}: Not set (will use default)`);
    }
  }

  // Show warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach((warning) => console.log(warning));
  }

  // Final result
  if (hasErrors) {
    console.log(
      '\n❌ Environment validation failed. Please fix the errors above.'
    );
    process.exit(1);
  } else {
    console.log('\n✅ Environment validation passed! Ready for deployment.');
    process.exit(0);
  }
}

// Run validation
validateEnvironment();
