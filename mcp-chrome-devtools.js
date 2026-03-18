const { spawn } = require('child_process');
const path = require('path');

// 将 process.argv 转发给 chrome-devtools-mcp
// 过滤掉 node 和此脚本路径
const args = process.argv.slice(2);

// 使用 npx 启动 chrome-devtools-mcp
const child = spawn('npx', ['-y', 'chrome-devtools-mcp@latest', '--autoConnect', ...args], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (err) => {
  console.error('Failed to start chrome-devtools-mcp:', err);
  process.exit(1);
});
