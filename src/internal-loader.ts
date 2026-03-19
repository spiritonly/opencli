/**
 * 内部CLI加载器
 * 从Git子模块 src/internal 加载内部CLI命令
 */

import { log } from './logger.js';

/**
 * 加载内部CLI命令
 * 从本地子模块加载，子模块不存在时静默跳过
 */
export async function loadInternalClis(): Promise<void> {
  // 检查是否启用内部CLI（可选，用于控制是否加载）
  if (process.env.OPENCLI_SKIP_INTERNAL === '1') {
    log.debug('[internal] 跳过内部CLI加载 (OPENCLI_SKIP_INTERNAL=1)');
    return;
  }

  try {
    // 从Git子模块加载
    // 子模块的 index.ts 会导入 hydra/index.ts，后者使用 cli() 自动注册命令
    await import('./internal/src/index.js');

    log.info(`[internal] 内部CLI加载完成`);
  } catch (err: any) {
    // 子模块不存在时静默跳过（公开fork的用户没有子模块）
    if (err.code === 'MODULE_NOT_FOUND' || err.message?.includes('internal')) {
      log.debug('[internal] 子模块未初始化，跳过内部CLI加载');
      return;
    }
    // 其他错误需要提示
    log.warn(`[internal] 加载内部CLI失败: ${err.message}`);
  }
}
