import { cli, Strategy } from '../../registry.js';

/**
 * 剑鱼360拟在建项目搜索 - 使用 INTERCEPT 策略
 *
 * 通过页面文本解析获取数据
 *
 * 项目阶段代码映射:
 *   01: 可研, 02: 初设, 03: 环评, 04: 审批备案
 *   05: 设计, 06: 施工准备, 07: 施工, 08: 竣工验收, 99: 其它
 */
cli({
  site: 'jianyu360',
  name: 'nzj-search',
  description: '剑鱼360拟在建项目搜索',
  domain: 'www.jianyu360.cn',
  strategy: Strategy.INTERCEPT,
  browser: true,
  args: [
    { name: 'limit', type: 'int', default: 50, help: '返回项目数量' },
    { name: 'keyword', type: 'str', required: false, help: '项目名称关键词' },
    { name: 'stage', type: 'str', required: false, help: '项目阶段(如:初设、可研、施工等)' },
  ],
  columns: ['rank', 'project_name', 'area', 'owner_type', 'project_stage', 'project_category', 'investment', 'update_time'],
  func: async (page, kwargs) => {
    const targetUrl = 'https://www.jianyu360.cn/succbi/nzj/app/nzj.app/nzj_search_1.spg';

    // 导航到目标页面
    await page.goto(targetUrl);
    await page.wait(5);

    // 如果有搜索条件，触发搜索
    if (kwargs.keyword || kwargs.stage) {
      const stageCodeMap: Record<string, string> = {
        '可研': '01', '初设': '02', '环评': '03', '审批备案': '04',
        '设计': '05', '施工准备': '06', '施工': '07', '竣工验收': '08', '其它': '99',
      };
      const stageCode = kwargs.stage ? stageCodeMap[kwargs.stage] : null;

      // 1. 先点击输入框并输入关键词
      await page.evaluate(`
        (() => {
          const input = document.querySelector('input[placeholder*="项目名称"]');
          if (input) {
            input.value = ${JSON.stringify(kwargs.keyword || '')};
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return 'input set';
          }
          return 'input not found';
        })()
      `);

      await page.wait(1);

      // 2. 点击搜索按钮
      await page.evaluate(`
        (() => {
          // 查找搜索按钮（包含"搜索"文本的元素）
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            if (el.textContent?.trim() === '搜索' && el.click) {
              el.click();
              return 'clicked';
            }
          }
          return 'not found';
        })()
      `);

      await page.wait(6);
    }

    // 滚动确保数据加载
    await page.autoScroll({ times: 2, delayMs: 1500 });
    await page.wait(2);

    // 从页面文本解析
    const pageText = await page.evaluate(`() => document.body.innerText`);
    const results = parsePageText(pageText, kwargs.limit);

    return results;
  },
});

function parsePageText(text: string, limit: number): any[] {
  const results: any[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);

  // 找到数据开始位置
  let dataStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\d+$/.test(lines[i]) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      if (nextLine.length > 5 && nextLine !== '项目名称' && !nextLine.includes('项目进展')) {
        dataStart = i;
        break;
      }
    }
  }

  if (dataStart === -1) return [];

  for (let i = dataStart; i < lines.length && results.length < limit; ) {
    const rank = lines[i];
    if (!/^\d+$/.test(rank)) { i++; continue; }

    const fields: string[] = [];
    let j = i + 1;
    while (j < lines.length && fields.length < 10) {
      const line = lines[j];
      if (line === '查看' || (/^\d+$/.test(line) && fields.length >= 5)) break;
      fields.push(line);
      j++;
    }

    while (j < lines.length && (lines[j] === '查看' || lines[j] === '认领')) j++;

    if (fields.length >= 6) {
      results.push({
        rank: parseInt(rank),
        project_name: fields[0] || '',
        area: fields[1] || '',
        owner_type: fields[2] || '',
        project_stage: fields[3] || '',
        project_category: fields[4] || '',
        investment: fields[5] || '',
        update_time: fields[6] || '',
      });
    }

    i = j;
  }

  return results;
}
