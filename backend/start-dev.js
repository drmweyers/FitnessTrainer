const { spawn } = require('child_process');
const fs = require('fs');

// Simple script to start the backend
console.log('🚀 Starting EvoFit Backend...');

// Check if we should build first
const shouldBuild = !fs.existsSync('./dist/src/index.js');

if (shouldBuild) {
  console.log('📦 Building TypeScript...');
  const build = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  
  build.on('close', (code) => {
    if (code === 0) {
      startServer();
    } else {
      console.error('❌ Build failed');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('🌟 Starting server...');
  
  // Set environment variable for module resolution
  const env = { ...process.env, NODE_PATH: './dist/src' };
  
  const server = spawn('node', ['-r', './start-production.js', './dist/src/index.js'], { 
    stdio: 'inherit',
    env 
  });
  
  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
}