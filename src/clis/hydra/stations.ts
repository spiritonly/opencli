import { cli, Strategy } from '../../registry.js';

/**
 * 河北省水文资料在线整汇编系统 - 测站列表
 *
 * 获取所有可用测站
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
    { name: 'limit', type: 'int', help: '返回记录数限制', default: 500 },
    { name: 'debug', type: 'bool', help: '调试模式', default: false },
  ],
  columns: ['stcd', 'stnm'],
  func: async (page, kwargs) => {
    const year = kwargs.year || 2026;
    const limit = kwargs.limit || 500;

    // 导航到系统首页（确保认证有效）
    await page.goto('http://10.243.45.152/index');
    await page.wait(3);

    const apiUrl = `http://10.243.45.152/prod-api/system/auth/getIndexGraphStList?yr=${year}`;
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

    const data: any[] = payload?.data || [];

    return data.slice(0, Number(limit)).map((item: any) => ({
      stcd: item.stcd || '',
      stnm: item.stnm || '',
    }));
  },
});
