#!/usr/bin/env node

/**
 * 基金实时估值工具
 * 数据源: 天天基金网 (eastmoney)
 * 用法: node index.js [--loop] [--interval 秒]
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── 配置 ────────────────────────────────────────────
const WATCHLIST_FILE = path.join(__dirname, 'watchlist.txt');
const DEFAULT_INTERVAL = 30; // 默认刷新间隔(秒)

// ─── 终端颜色 ────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  gray: '\x1b[90m',
};

// ─── 读取自选基金列表 ──────────────────────────────────
function loadWatchlist() {
  if (!fs.existsSync(WATCHLIST_FILE)) {
    console.error(`${C.red}错误: 找不到 watchlist.txt${C.reset}`);
    console.error(`请在 ${WATCHLIST_FILE} 中添加自选基金`);
    process.exit(1);
  }
  const lines = fs.readFileSync(WATCHLIST_FILE, 'utf-8').split('\n');
  const funds = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [code, name] = trimmed.split('|').map(s => s.trim());
    if (/^\d{6}$/.test(code)) {
      funds.push({ code, name: name || '' });
    }
  }
  if (funds.length === 0) {
    console.error(`${C.yellow}警告: watchlist.txt 中没有有效的基金代码${C.reset}`);
    process.exit(0);
  }
  return funds;
}

// ─── HTTP 请求 ────────────────────────────────────────
function fetch(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, {
      headers: {
        'Referer': 'https://fund.eastmoney.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ─── 获取单只基金估值 ──────────────────────────────────
async function fetchFundEstimate(code) {
  const url = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;
  try {
    const raw = await fetch(url);
    // 解析 JSONP: jsonpgz({...})
    const match = raw.match(/jsonpgz\((.*)\)/);
    if (!match) return null;
    const data = JSON.parse(match[1]);
    return {
      code: data.fundcode,
      name: data.name,
      nav: parseFloat(data.dwjz),         // 单位净值(上一日)
      estimate: parseFloat(data.gsz),      // 估算净值
      change: parseFloat(data.gszzl),      // 估算涨跌幅(%)
      navDate: data.jzrq,                  // 净值日期
      estimateTime: data.gztime,           // 估算时间
    };
  } catch (e) {
    return { code, name: '请求失败', error: e.message };
  }
}

// ─── 批量获取估值 ──────────────────────────────────────
async function fetchAllEstimates(funds) {
  const results = await Promise.all(funds.map(f => fetchFundEstimate(f.code)));
  // 合并 watchlist 中的自定义名称
  return results.map((r, i) => {
    if (r && funds[i].name && !r.error) {
      r.displayName = funds[i].name;
    }
    return r;
  });
}

// ─── 格式化涨跌幅 ────────────────────────────────────
function formatChange(change) {
  if (change === null || change === undefined || isNaN(change)) return `${C.gray}  --  ${C.reset}`;
  const sign = change > 0 ? '+' : '';
  const color = change > 0 ? C.red : change < 0 ? C.green : C.gray;
  return `${color}${sign}${change.toFixed(2)}%${C.reset}`;
}

// ─── 格式化净值 ──────────────────────────────────────
function formatNav(nav) {
  if (nav === null || nav === undefined || isNaN(nav)) return `${C.gray}--${C.reset}`;
  return `${C.white}${nav.toFixed(4)}${C.reset}`;
}

// ─── 绘制进度条 ──────────────────────────────────────
function miniBar(change) {
  if (!change || isNaN(change)) return '';
  const width = 10;
  const maxPct = 5; // 5% 满格
  const filled = Math.min(Math.round((Math.abs(change) / maxPct) * width), width);
  const color = change > 0 ? C.red : change < 0 ? C.green : C.gray;
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `${color}${bar}${C.reset}`;
}

// ─── 渲染表格 ──────────────────────────────────────
function render(results) {
  // 清屏
  process.stdout.write('\x1b[2J\x1b[H');

  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

  // 标题
  console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║           📊  基金实时估值  -  自选基金看板                      ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════════════╝${C.reset}`);
  console.log(`${C.gray}  刷新时间: ${now}${C.reset}`);
  console.log();

  // 表头
  const header = `  ${C.bold}${C.white}代码${C.reset}      ${C.bold}名称${C.reset.padEnd(22)}${C.bold}最新净值${C.reset}   ${C.bold}估算净值${C.reset}   ${C.bold}估算涨跌${C.reset}     ${C.bold}趋势${C.reset}`;
  console.log(header);
  console.log(`  ${C.gray}${'─'.repeat(70)}${C.reset}`);

  // 统计
  let upCount = 0, downCount = 0, flatCount = 0;
  let totalChange = 0;

  for (const r of results) {
    if (!r || r.error) {
      const code = r?.code || '??????';
      console.log(`  ${C.gray}${code}     请求失败 ${C.dim}${r?.error || ''}${C.reset}`);
      continue;
    }

    const name = (r.displayName || r.name || '').substring(0, 12).padEnd(12);
    const changeStr = formatChange(r.change);
    const bar = miniBar(r.change);
    const navStr = formatNav(r.nav);
    const estStr = formatNav(r.estimate);
    const timeStr = r.estimateTime ? r.estimateTime.split(' ')[1] || '' : '';

    // 涨跌统计
    if (r.change > 0.005) upCount++;
    else if (r.change < -0.005) downCount++;
    else flatCount++;
    totalChange += r.change || 0;

    console.log(`  ${C.cyan}${r.code}${C.reset}  ${C.bold}${name}${C.reset}  ${navStr}  →  ${estStr}  ${changeStr}  ${bar} ${C.dim}${timeStr}${C.reset}`);
  }

  // 汇总
  console.log(`  ${C.gray}${'─'.repeat(70)}${C.reset}`);
  const avgChange = results.filter(r => r && !r.error).length > 0
    ? totalChange / results.filter(r => r && !r.error).length
    : 0;
  const summaryColor = avgChange > 0 ? C.red : avgChange < 0 ? C.green : C.gray;
  const sign = avgChange > 0 ? '+' : '';

  console.log(`  ${C.bold}汇总:${C.reset} ${C.red}↑${upCount}${C.reset}  ${C.green}↓${downCount}${C.reset}  ${C.gray}→${flatCount}${C.reset}  均涨跌: ${summaryColor}${sign}${avgChange.toFixed(2)}%${C.reset}`);
  console.log();
  console.log(`${C.dim}  数据来源: 天天基金网 | 估值仅供参考, 以实际净值为准${C.reset}`);
  console.log(`${C.dim}  按 Ctrl+C 退出${C.reset}`);
}

// ─── 主程序 ────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const loop = args.includes('--loop');
  const intervalIdx = args.indexOf('--interval');
  const interval = intervalIdx !== -1 ? parseInt(args[intervalIdx + 1]) || DEFAULT_INTERVAL : DEFAULT_INTERVAL;
  const once = args.includes('--once') || !loop;

  const funds = loadWatchlist();
  console.log(`${C.cyan}加载了 ${funds.length} 只自选基金...${C.reset}`);

  if (once) {
    const results = await fetchAllEstimates(funds);
    render(results);
  } else {
    // 持续刷新模式
    while (true) {
      const results = await fetchAllEstimates(funds);
      render(results);
      console.log(`${C.dim}  下次刷新: ${interval}秒后${C.reset}`);
      await new Promise(r => setTimeout(r, interval * 1000));
    }
  }
}

// ─── 启动 ────────────────────────────────────────
main().catch(err => {
  console.error(`${C.red}错误: ${err.message}${C.reset}`);
  process.exit(1);
});
