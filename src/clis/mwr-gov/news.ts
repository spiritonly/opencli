import { cli, Strategy } from '../../registry.js';

cli({
  site: 'mwr-gov',
  name: 'news',
  description: '水利部新闻要闻',
  domain: 'www.mwr.gov.cn',
  strategy: Strategy.UI,
  browser: true,
  args: [
    { name: 'limit', type: 'int', default: 10, help: '返回条数' },
    { name: 'type', type: 'str', default: 'slyw', help: '新闻类型: slyw(水利要闻), szyw(时政要闻), tzgg(通知公告), sjzs(司局直属)' },
  ],
  columns: ['rank', 'title', 'date', 'url'],
  func: async (page, kwargs) => {
    const type = kwargs.type || 'slyw';
    const limit = Math.min(kwargs.limit || 10, 30);

    // 映射类型到 URL
    const typeUrls: Record<string, string> = {
      'slyw': 'http://www.mwr.gov.cn/xw/slyw/',      // 水利要闻
      'szyw': 'http://www.mwr.gov.cn/xw/szyw/',      // 时政要闻
      'tzgg': 'http://www.mwr.gov.cn/zw/tzgg/',      // 通知公告 (修正)
      'sjzs': 'http://www.mwr.gov.cn/xw/sjzs/',      // 司局直属
      'dfss': 'http://www.mwr.gov.cn/xw/dfss/',      // 地方水事
      'mtzs': 'http://www.mwr.gov.cn/xw/mtzs/',      // 媒体之声
    };

    const url = typeUrls[type] || typeUrls['slyw'];

    // 导航到对应页面
    await page.goto(url);
    await page.wait(3);

    // 提取新闻列表
    const items = await page.evaluate(`
      (() => {
        const results = [];
        const links = Array.from(document.querySelectorAll('a'));

        for (const link of links) {
          const title = link.textContent?.trim();
          const href = link.getAttribute('href') || '';

          // 过滤新闻链接 (相对路径: ./202603/t20260317_xxx.html)
          if (title && title.length >= 15 && title.length <= 80 &&
              href && href.includes('.html') &&
              !title.includes('首页') &&
              !title.includes('上一页') &&
              !title.includes('下一页')) {

            // 从链接提取日期
            const dateMatch = href.match(/\\/(\\d{4})(\\d{2})\\/t\\d+/);
            const date = dateMatch ? dateMatch[1] + '-' + dateMatch[2] : '';

            // 构建完整 URL
            const fullUrl = href.startsWith('http') ? href : 'http://www.mwr.gov.cn' + href.replace(/^\\./, '');

            results.push({ title, url: fullUrl, date });
          }
        }

        // 去重
        return results.filter((item, index, self) =>
          index === self.findIndex(t => t.title === item.title)
        );
      })()
    `);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.slice(0, limit).map((item: any, i: number) => ({
      rank: i + 1,
      title: item.title || '',
      date: item.date || '',
      url: item.url || '',
    }));
  },
});
