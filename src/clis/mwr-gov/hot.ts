import { cli, Strategy } from '../../registry.js';

cli({
  site: 'mwr-gov',
  name: 'hot',
  description: '水利部首页热点新闻（水利要闻+时政要闻）',
  domain: 'www.mwr.gov.cn',
  strategy: Strategy.UI,
  browser: true,
  args: [
    { name: 'limit', type: 'int', default: 10, help: '返回条数' },
  ],
  columns: ['rank', 'title', 'date', 'url', 'type'],
  func: async (page, kwargs) => {
    const limit = Math.min(kwargs.limit || 10, 20);

    // 导航到首页
    await page.goto('http://www.mwr.gov.cn/');
    await page.wait(3);

    // 提取首页新闻数据
    const items = await page.evaluate(`
      (() => {
        const results = [];
        const links = Array.from(document.querySelectorAll('a'));

        for (const link of links) {
          const title = link.textContent?.trim();
          const href = link.getAttribute('href') || '';

          // 过滤新闻链接 (相对路径格式: ./xw/...)
          if (title && title.length >= 15 && title.length <= 80 &&
              href && (href.includes('./xw/') || href.includes('./syxg/')) &&
              href.includes('.html')) {

            // 从链接提取日期 (格式: /202603/t20260317_)
            const dateMatch = href.match(/\\/(\\d{4})(\\d{2})\\/t\\d+/);
            const date = dateMatch ? dateMatch[1] + '-' + dateMatch[2] : '';

            // 判断新闻类型
            let type = '其他';
            if (href.includes('/slyw/')) type = '水利要闻';
            else if (href.includes('/szyw/')) type = '时政要闻';
            else if (href.includes('/sjzs/')) type = '司局直属';
            else if (href.includes('/dfss/')) type = '地方水事';
            else if (href.includes('/fxkh/')) type = '防汛抗旱';
            else if (href.includes('/tpxw/')) type = '图片新闻';

            results.push({
              title,
              url: 'http://www.mwr.gov.cn' + href.replace(/^\\./, ''),
              date,
              type
            });
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
      type: item.type || '',
    }));
  },
});
