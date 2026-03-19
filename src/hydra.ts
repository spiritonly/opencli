/**
 * 河北省水文资料在线整汇编系统 - 共享API封装
 */

import type { IPage } from './types.js';

const API_BASE = 'http://10.243.45.152/prod-api';

export async function fetchJson(page: IPage, url: string): Promise<any> {
  const urlJs = JSON.stringify(url);
  return page.evaluate(`
    async () => {
      const res = await fetch(${urlJs}, { credentials: "include" });
      return await res.json();
    }
  `);
}

export async function apiGet(page: IPage, path: string, params: Record<string, any> = {}): Promise<any> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  );
  const url = `${API_BASE}${path}?${qs}`;
  return fetchJson(page, url);
}

// 整编完成率统计
export async function getReorganizeCompletion(
  page: IPage,
  startDt: string,
  endDt: string,
  type: string = '日清月结',
  stcd: string = ''
): Promise<any> {
  return apiGet(page, '/business/index/statistic/reorganizeIndexCompletion', {
    startDt,
    endDt,
    type,
    stcd,
  });
}

// 实测数据统计
export async function getActualMeasurement(
  page: IPage,
  stcd: string,
  yr: number
): Promise<any> {
  return apiGet(page, '/business/index/statistic/actualMeasurement', {
    stcd,
    yr,
  });
}

// 测站列表
export async function getStationList(
  page: IPage,
  yr: number
): Promise<any> {
  return apiGet(page, '/system/auth/getIndexGraphStList', {
    yr,
  });
}

// 整编图表数据
export async function getReorganizeGraph(
  page: IPage,
  yr: number
): Promise<any> {
  return apiGet(page, '/business/index/statistic/reorganizeGraph', {
    yr,
  });
}

// 水位数据列表
export async function getWaterLevelList(
  page: IPage,
  stcd: string,
  yr: number
): Promise<any> {
  return apiGet(page, '/business/compileData/riverStationData/baZ0g09B/list', {
    stcd,
    yr,
  });
}
