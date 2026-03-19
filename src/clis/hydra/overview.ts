import { cli, Strategy } from '../../registry.js';

interface StatInfo {
  countStcd?: number;
  countStcdZ?: number;
  completionZ?: string;
  countStcdQ?: number;
  completionQ?: string;
  countStcdE?: number;
  completionE?: string;
  countStcdQs?: number;
  completionQs?: string;
  countStcdCs?: number;
  completionCs?: string;
  countStcdP?: number;
  completionP?: string;
}

interface TreeNode {
  id?: number;
  name?: string;
  statInfo?: StatInfo;
  children?: TreeNode[];
}

interface OverviewItem {
  unit: string;
  total_stations: number;
  water_level_stations: number;
  water_level_completion: string;
  discharge_stations: number;
  discharge_completion: string;
  evaporation_stations: number;
  evaporation_completion: string;
  sediment_stations: number;
  sediment_completion: string;
  sand_concentration_stations: number;
  sand_concentration_completion: string;
  precipitation_stations: number;
  precipitation_completion: string;
}

function extractFromTree(node: TreeNode | null, results: OverviewItem[], depth: number = 1, maxLevel: number = 3) {
  if (!node || !node.name) return;

  const stat = node.statInfo || {};
  const item: OverviewItem = {
    unit: node.name,
    total_stations: stat.countStcd || 0,
    water_level_stations: stat.countStcdZ || 0,
    water_level_completion: stat.completionZ || '',
    discharge_stations: stat.countStcdQ || 0,
    discharge_completion: stat.completionQ || '',
    evaporation_stations: stat.countStcdE || 0,
    evaporation_completion: stat.completionE || '',
    sediment_stations: stat.countStcdQs || 0,
    sediment_completion: stat.completionQs || '',
    sand_concentration_stations: stat.countStcdCs || 0,
    sand_concentration_completion: stat.completionCs || '',
    precipitation_stations: stat.countStcdP || 0,
    precipitation_completion: stat.completionP || '',
  };

  // 只添加有"水文"字样的单位
  if (item.unit.includes('水文')) {
    results.push(item);
  }

  // 递归处理子节点（如果未达到最大层级）
  if (depth < maxLevel && node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractFromTree(child, results, depth + 1, maxLevel);
    }
  }
}

/**
 * 河北省水文资料在线整汇编系统 - 整编概览命令
 *
 * 使用API获取整编完成率统计数据
 */
cli({
  site: 'hydra',
  name: 'overview',
  description: '水文整编概览 - 整编完成率统计',
  domain: '10.243.45.152',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'start', type: 'str', help: '开始日期 (YYYY-MM-DD)', default: '' },
    { name: 'end', type: 'str', help: '结束日期 (YYYY-MM-DD)', default: '' },
    { name: 'type', type: 'str', help: '统计方法', default: '日清月结' },
    { name: 'stcd', type: 'str', help: '测站编码', default: '' },
    { name: 'limit', type: 'int', help: '返回记录数', default: 50 },
    { name: 'level', type: 'int', help: '显示层级: 1=省级, 2=省市, 3=省市队(默认)', default: 3 },
    { name: 'debug', type: 'bool', help: '调试模式', default: false },
  ],
  columns: ['unit', 'total_stations', 'water_level_stations', 'water_level_completion',
            'discharge_stations', 'discharge_completion', 'evaporation_stations',
            'evaporation_completion', 'sediment_stations', 'sediment_completion',
            'sand_concentration_stations', 'sand_concentration_completion',
            'precipitation_stations', 'precipitation_completion'],
  func: async (page, kwargs) => {
    // 默认使用前一天日期（日清月结，前一天才有完整数据）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const startDate = kwargs.start || yesterdayStr;
    const endDate = kwargs.end || yesterdayStr;
    const type = kwargs.type || '日清月结';
    const stcd = kwargs.stcd || '';
    const limit = kwargs.limit || 50;
    const level = kwargs.level || 3;

    // 导航到系统首页（确保Cookie和localStorage有效）
    await page.goto('http://10.243.45.152/index');
    await page.wait(5);

    const apiUrl = `http://10.243.45.152/prod-api/business/index/statistic/reorganizeIndexCompletion?startDt=${encodeURIComponent(startDate)}&endDt=${encodeURIComponent(endDate)}&type=${encodeURIComponent(type)}&stcd=${encodeURIComponent(stcd)}`;
    const urlJs = JSON.stringify(apiUrl);

    // 从localStorage获取token，提取clientid，调用API
    const payload = await page.evaluate(`
      async () => {
        const token = localStorage.getItem('Admin-Token');
        let clientId = '';
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            clientId = payload.clientid || '';
          } catch (e) {}
        }

        const headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = 'Bearer ' + token;
        }
        if (clientId) {
          headers['clientid'] = clientId;
        }

        const res = await fetch(${urlJs}, {
          credentials: 'include',
          headers: headers
        });
        return await res.json();
      }
    `);

    if (kwargs.debug) {
      console.log('=== DEBUG: API Response ===');
      console.log(JSON.stringify(payload, null, 2));
      console.log('=== END DEBUG ===');
    }

    // 递归提取树形数据
    const results: OverviewItem[] = [];
    extractFromTree(payload?.data as TreeNode, results, 1, Number(level));

    return results.slice(0, Number(limit));
  },
});
