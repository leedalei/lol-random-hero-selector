#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 确保所有必要的文件和配置都正确设置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 开始部署前检查...\n');

// 检查必要的文件
const requiredFiles = [
  'package.json',
  'src/main.tsx',
  'src/App.tsx',
  'src/pages/HomePage.tsx',
  'src/pages/RoomPage.tsx',
  'src/services/socket.ts',
  'server/index.js',
  'server/package.json',
  'DEPLOYMENT.md'
];

let allFilesExist = true;

console.log('📁 检查必要文件...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 缺少！`);
    allFilesExist = false;
  }
});

// 检查环境变量配置
console.log('\n🔧 检查环境变量配置...');
const socketServiceContent = fs.readFileSync('src/services/socket.ts', 'utf8');
const hasEnvConfig = socketServiceContent.includes('import.meta.env.VITE_API_URL');
if (hasEnvConfig) {
  console.log('✅ 前端Socket服务环境变量配置正确');
} else {
  console.log('❌ 前端Socket服务缺少环境变量配置');
}

// 检查CORS配置
console.log('\n🌐 检查CORS配置...');
const serverContent = fs.readFileSync('server/index.js', 'utf8');
const hasCorrectCors = serverContent.includes('https://*.vercel.app') &&
                     serverContent.includes('http://localhost:3007');
if (hasCorrectCors) {
  console.log('✅ 后端CORS配置正确');
} else {
  console.log('❌ 后端CORS配置需要更新');
}

// 检查构建配置
console.log('\n🏗️ 检查构建配置...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const hasBuildScript = packageJson.scripts.build;
const hasDeployScript = packageJson.scripts['deploy:check'];

if (hasBuildScript && hasDeployScript) {
  console.log('✅ 构建脚本配置正确');
} else {
  console.log('❌ 缺少必要的构建脚本');
}

// 总结
console.log('\n📋 检查总结:');
if (allFilesExist && hasEnvConfig && hasCorrectCors && hasBuildScript) {
  console.log('✅ 所有检查通过！可以进行部署');
  console.log('\n📝 部署步骤:');
  console.log('1. 推送代码到GitHub');
  console.log('2. 在Vercel上部署前端');
  console.log('3. 在Render上部署后端');
  console.log('4. 在Vercel中设置VITE_API_URL环境变量');
  console.log('5. 测试连接');
} else {
  console.log('❌ 存在问题，请修复后再部署');
  process.exit(1);
}