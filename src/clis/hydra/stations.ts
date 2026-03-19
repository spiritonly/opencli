import { cli, Strategy } from '../../registry.js';
import { getStationList } from '../../hydra.js';

/**
 * 河北省水文资料在线整汇编系统 - 测站列表
 */
cli({
  site: 'hydra',
  name: 'stations',
  description: '水文测站列表 - 获取所有可用测站',
  domain: '10.243.45.152',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'year', type: 'int', help: '年份', default: 2026 },
  ],
  columns: ['stcd', 'stnm'],
  func: async (page, kwargs) => {
    const year = kwargs.year || 2026;

    await page.goto('http://10.243.45.152/index');
    await page.wait(3);

    const payload = await getStationList(page, year);
    const data: any[] = payload?.data || [];

    return data.map((item: any) => ({
      stcd: item.stcd || '',
      stnm: item.stnm || '',
    }));
  },
});
