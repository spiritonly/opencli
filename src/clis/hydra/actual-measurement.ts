import { cli, Strategy } from '../../registry.js';

/**
 * 河北省水文资料在线整汇编系统 - 实测数据统计
 *
 * 获取实测流量、输沙率、单沙测次统计
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
    { name: 'debug', type: 'bool', help: '调试模式', default: false },
  ],
  columns: ['station', 'station_name', 'discharge_count', 'sediment_rate_count', 'sand_sample_count'],
  func: async (page, kwargs) => {
    const stcd = kwargs.stcd || '03100001';
    const year = kwargs.year || 2026;

    // 导航到系统首页（确保认证有效）
    await page.goto('http://10.243.45.152/index');
    await page.wait(3);

    const apiUrl = `http://10.243.45.152/prod-api/business/index/statistic/actualMeasurement?stcd=${encodeURIComponent(stcd)}&yr=${year}`;
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

    const data = payload?.data || {};

    return [{
      station: stcd,
      station_name: data.stnm || '',
      discharge_count: data.actualQCount || 0,
      sediment_rate_count: data.actualLsCount || 0,
      sand_sample_count: data.actualCsCount || 0,
    }];
  },
});
