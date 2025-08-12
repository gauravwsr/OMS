module.exports = {
  apps: [
    {
      name: 'oms-backend',
      script: './server-OMS/server.js',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    },
    {
      name: 'face-recognition-server',
      script: './face-recognition-server/server.py',
      interpreter: 'python3',
      watch: false,
      env: {
        FLASK_ENV: 'development',
        PORT: 5002
      },
      env_production: {
        FLASK_ENV: 'production',
        PORT: 5002
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      error_file: './logs/face-server-err.log',
      out_file: './logs/face-server-out.log',
      log_file: './logs/face-server-combined.log',
      time: true
    },
    {
      name: 'oms-frontend',
      cwd: './Office-management-system',
      script: 'npm',
      args: 'start',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: '../logs/frontend-err.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true
    },
    {
      name: 'oms-frontend',
      cwd: './Office-management-system',
      script: 'npm',
      args: 'start',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: '../logs/frontend-err.log',
      out_file: '../logs/frontend-out.log',
      log_file: '../logs/frontend-combined.log',
      time: true
    }
  ]
};
