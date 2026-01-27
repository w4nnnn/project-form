const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local or .env
const envLocalPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envLocalPath });
dotenv.config(); // Also load .env as fallback/addition

module.exports = {
    apps: [
        {
            name: process.env.NAME_PM2,
            script: 'node_modules/next/dist/bin/next',
            args: `start -p ${process.env.PORT}`,
            env: {
                NODE_ENV: 'production',
                PORT: process.env.PORT
            }
        }
    ]
};
