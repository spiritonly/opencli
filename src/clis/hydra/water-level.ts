import { cli, Strategy } from '../../registry.js';

/**
 * 河北省水文资料在线整汇编系统 - 水位数据
 *
 * 获取整编水位数据列表
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
    { name: 'debug', type: 'bool', help: '调试模式', default: false },
  ],
  columns: ['index', 'full_time', 'full_water_level', 'time', 'water_level'],
  func: async (page, kwargs) => {
    const stcd = kwargs.stcd || '03100001';
    const year = kwargs.year || 2026;
    const limit = kwargs.limit || 100;

    // 导航到系统首页（确保认证有效）
    await page.goto('http://10.243.45.152/index');
    await page.wait(3);

    const apiUrl = `http://10.243.45.152/prod-api/business/compileData/riverStationData/baZ0g09B/list?stcd=${encodeURIComponent(stcd)}&yr=${year}`;
    const urlJs = JSON.stringify(apiUrl);

    // 从localStorage获取token和clientid并调用API
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

    const rows: any[] = payload?.data || [];

    return rows.slice(0, Number(limit)).map((item: any, i: number) => ({
      index: i + 1,
      full_time: item.dt || '',
      full_water_level: item.szz || '',
      time: item.ztime || '',
      water_level: item.zz || '',
    }));
  },
});
