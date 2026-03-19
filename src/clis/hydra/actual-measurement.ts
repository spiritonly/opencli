import { cli, Strategy } from '../../registry.js';
import { getActualMeasurement } from '../../hydra.js';

/**
 * 河北省水文资料在线整汇编系统 - 实测数据统计
 */
cli({
  site: 'hydra',
  name: 'actual-measurement',
  description: '水文实测数据统计 - 流量/输沙率/单沙测次',
  domain: '10.243.45.152',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'stcd', type: 'str', help: '测站编码 (如: 03100001)', default: '03100001' },
    { name: 'year', type: 'int', help: '年份', default: 2026 },
  ],
  columns: ['station', 'discharge_count', 'sediment_rate_count', 'sand_sample_count'],
  func: async (page, kwargs) => {
    const stcd = kwargs.stcd || '03100001';
    const year = kwargs.year || 2026;

    await page.goto('http://10.243.45.152/index');
    await page.wait(3);

    const payload = await getActualMeasurement(page, stcd, year);
    const data = payload?.data || {};

    return [{
      station: stcd,
      discharge_count: data.actualQCount || 0,
      sediment_rate_count: data.actualLsCount || 0,
      sand_sample_count: data.actualCsCount || 0,
    }];
  },
});
