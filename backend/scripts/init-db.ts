/**
 * MongoDB 连接验证脚本。
 * 运行：npm run db:init（需在 backend 目录下，且已配置 .env / MONGODB_URI）
 */
import 'dotenv/config';
import { connectDB } from '../src/lib/mongodb.js';
import { User } from '../src/lib/mongodb.js';

async function main() {
  try {
    await connectDB();
    await User.findOne().limit(1);
    console.log('MongoDB 连接成功');
    process.exit(0);
  } catch (e) {
    console.error('MongoDB 连接失败:', e);
    process.exit(1);
  }
}

main();
