import { cli, Strategy } from '../../registry.js';
import { getWaterLevelList } from '../../hydra.js';

/**
 * 河北省水文资料在线整汇编系统 - 水位数据
 */
cli({
  site: 'hydra',
  name: 'water-level',
  description: '水文整编水位数据 - 水位数据列表',
  domain: '10.243.45.152',
  strategy: Strategy.COOKIE,
  browser: true,
  args: [
    { name: 'stcd', type: 'str', help: '测站编码 (如: 03100001)', default: '03100001' },
    { name: 'year', type: 'int', help: '年份', default: 2026 },
    { name: 'limit', type: 'int', help: '返回记录数限制', default: 100 },
  ],
  columns: ['index', 'full_time', 'full_water_level', 'time', 'water_level'],
  func: async (page, kwargs) => {
    const stcd = kwargs.stcd || '03100001';
    const year = kwargs.year || 2026;
    const limit = kwargs.limit || 100;

    await page.goto('http://10.243.45.152/index');
    await page.wait(3);

    const payload = await getWaterLevelList(page, stcd, year);
    const rows: any[] = payload?.data?.rows || [];

    return rows.slice(0, Number(limit)).map((item: any, i: number) => ({
      index: i + 1,
      full_time: item.allTm || '',
      full_water_level: item.allZ || '',
      time: item.tm || '',
      water_level: item.z || '',
    }));
  },
});
