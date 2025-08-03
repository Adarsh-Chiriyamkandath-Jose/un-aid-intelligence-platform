#!/usr/bin/env tsx
/**
 * Simplified bridge script to run FastAPI from the Node.js workflow
 */
import { spawn } from 'child_process';

console.log('🔄 Starting UN Aid Intelligence Platform (FastAPI backend)');
console.log('🌐 Server will be available at http://localhost:5000');

// Start the Python FastAPI server
const pythonProcess = spawn('python', ['startup.py'], {
  stdio: 'inherit',
  env: { ...process.env, ENVIRONMENT: 'development' }
});

pythonProcess.on('error', (error) => {
  console.error('❌ Failed to start FastAPI server:', error.message);
  process.exit(1);
});

pythonProcess.on('exit', (code) => {
  console.log(`FastAPI server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  pythonProcess.kill('SIGINT');
});