const DEFAULT_SETTINGS = {
  itemsPerSource: 12,
  requestTimeoutMs: 10000,
  cacheTtlSeconds: 300
};

const DEFAULT_SOURCES = [
  {
    name: 'V2EX 热门',
    category: '中文社区',
    url: 'https://www.v2ex.com/api/topics/hot.json',
    homepage: 'https://www.v2ex.com/?tab=hot',
    type: 'v2ex',
    enabled: true
  },
  {
    name: 'Hacker News',
    category: '科技开发',
    url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    homepage: 'https://news.ycombinator.com/',
    type: 'hackernews',
    enabled: true
  },
  {
    name: 'GitHub Trending',
    category: '科技开发',
    url: 'https://github.com/trending?since=daily',
    homepage: 'https://github.com/trending',
    type: 'githubTrending',
    enabled: true
  },
  {
    name: '微博热搜',
    category: '中文热榜',
    url: 'https://s.weibo.com/top/summary',
    homepage: 'https://s.weibo.com/top/summary',
    type: 'restricted',
    enabled: true
  },
  {
    name: '知乎热榜',
    category: '中文热榜',
    url: 'https://www.zhihu.com/hot',
    homepage: 'https://www.zhihu.com/hot',
    type: 'restricted',
    enabled: true
  },
  {
    name: '百度热搜',
    category: '中文热榜',
    url: 'https://top.baidu.com/board?tab=realtime',
    homepage: 'https://top.baidu.com/board?tab=realtime',
    type: 'restricted',
    enabled: true
  },
  {
    name: 'B站热门',
    category: '中文热榜',
    url: 'https://www.bilibili.com/v/popular/all',
    homepage: 'https://www.bilibili.com/v/popular/all',
    type: 'restricted',
    enabled: true
  }
];

const memoryCache = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === '/' || url.pathname === '/api/hot') {
      return handleHotRequest(request, env, ctx);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};

async function handleHotRequest(request, env, ctx) {
  const fileConfig = await loadSourceConfig(request, env);
  const settings = {
    ...DEFAULT_SETTINGS,
    ...(fileConfig.settings || {}),
    ...(env.HOT_SETTINGS ? safeJsonParse(env.HOT_SETTINGS, {}) : {})
  };
  const sources = env.HOT_SOURCES
    ? safeJsonParse(env.HOT_SOURCES, fileConfig.sources || DEFAULT_SOURCES)
    : (fileConfig.sources || DEFAULT_SOURCES);
  const cacheKey = new Request(new URL(request.url).origin + '/api/hot');

  const cached = await readCache(cacheKey);
  if (cached) {
    return cached;
  }

  const enabledSources = sources.filter(source => source.enabled !== false);
  const settled = await Promise.all(enabledSources.map(source => fetchHotSource(source, settings)));
  const payload = {
    updatedAt: new Date().toISOString(),
    cacheTtlSeconds: settings.cacheTtlSeconds,
    sources: settled
  };

  const response = jsonResponse(payload, 200, {
    'Cache-Control': `public, max-age=${settings.cacheTtlSeconds}`
  });
  ctx?.waitUntil?.(writeCache(cacheKey, response.clone(), settings.cacheTtlSeconds));
  await writeMemoryCache(cacheKey.url, response.clone(), settings.cacheTtlSeconds);
  return response;
}

async function loadSourceConfig(request, env) {
  if (env.HOT_SOURCE_CONFIG) {
    return safeJsonParse(env.HOT_SOURCE_CONFIG, {});
  }

  try {
    const url = new URL('/hot-sources.json', request.url);
    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return {};
    }

    return response.json();
  } catch (error) {
    return {};
  }
}

async function fetchHotSource(source, settings) {
  const checkedAt = new Date().toISOString();

  try {
    if (source.type === 'restricted') {
      return {
        ...sourceSummary(source),
        checkedAt,
        status: '可能受限',
        message: '该平台反爬较强，首版仅保留入口；后续可单独适配。',
        items: []
      };
    }

    const adapter = {
      v2ex: fetchV2EX,
      hackernews: fetchHackerNews,
      githubTrending: fetchGitHubTrending
    }[source.type];

    if (!adapter) {
      throw new Error(`未知适配器: ${source.type}`);
    }

    const items = await adapter(source, settings);
    return {
      ...sourceSummary(source),
      checkedAt,
      status: '正常',
      message: '',
      items: items.slice(0, settings.itemsPerSource).map((item, index) => ({
        rank: index + 1,
        title: item.title || '未命名条目',
        url: item.url || source.homepage || source.url,
        hot: item.hot || '',
        summary: item.summary || '',
        extra: item.extra || ''
      }))
    };
  } catch (error) {
    return {
      ...sourceSummary(source),
      checkedAt,
      status: '失败',
      message: error.message,
      items: []
    };
  }
}

async function fetchV2EX(source, settings) {
  const data = await fetchJson(source.url, settings);
  return data.map(topic => ({
    title: topic.title,
    url: topic.url,
    hot: `${topic.replies || 0} 回复`,
    summary: topic.node?.title ? `节点：${topic.node.title}` : '',
    extra: topic.member?.username || ''
  }));
}

async function fetchHackerNews(source, settings) {
  const ids = await fetchJson(source.url, settings);
  const topIds = ids.slice(0, settings.itemsPerSource);
  const items = await Promise.all(topIds.map(id =>
    fetchJson(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, settings)
  ));

  return items.filter(Boolean).map(item => ({
    title: item.title,
    url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
    hot: `${item.score || 0} 分`,
    summary: `${item.descendants || 0} 评论`,
    extra: item.by || ''
  }));
}

async function fetchGitHubTrending(source, settings) {
  const html = await fetchText(source.url, settings);
  const articleMatches = html.match(/<article[\s\S]*?<\/article>/g) || [];

  return articleMatches.slice(0, settings.itemsPerSource).map(article => {
    const repoMatch = article.match(/<h2[\s\S]*?<a[^>]+href="([^"]+)"[\s\S]*?<\/a>[\s\S]*?<\/h2>/);
    const descMatch = article.match(/<p[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const starsMatch = article.match(/<a[^>]+href="[^"]+\/stargazers"[^>]*>([\s\S]*?)<\/a>/);
    const languageMatch = article.match(/<span[^>]+itemprop="programmingLanguage"[^>]*>([\s\S]*?)<\/span>/);
    const href = repoMatch ? repoMatch[1] : '';
    const repoName = repoMatch ? cleanText(repoMatch[0]).replace(/\s+/g, '') : 'GitHub 项目';

    return {
      title: repoName,
      url: href ? `https://github.com${href}` : source.homepage,
      hot: starsMatch ? `${cleanText(starsMatch[1])} stars` : '',
      summary: descMatch ? cleanText(descMatch[1]) : '',
      extra: languageMatch ? cleanText(languageMatch[1]) : ''
    };
  }).filter(item => item.title);
}

async function fetchJson(url, settings) {
  const response = await fetchWithTimeout(url, settings, {
    headers: {
      'Accept': 'application/json,text/plain,*/*',
      'User-Agent': 'NewsPulseHotWorker/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchText(url, settings) {
  const response = await fetchWithTimeout(url, settings, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 NewsPulseHotWorker/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function fetchWithTimeout(url, settings, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.requestTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function readCache(cacheKey) {
  const memoryEntry = memoryCache.get(cacheKey.url);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return new Response(memoryEntry.body, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'X-NewsPulse-Cache': 'memory'
      }
    });
  }

  if (typeof caches === 'undefined') {
    return null;
  }

  const cached = await caches.default.match(cacheKey);
  if (!cached) {
    return null;
  }

  const response = new Response(cached.body, cached);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('X-NewsPulse-Cache', 'cloudflare');
  return response;
}

async function writeCache(cacheKey, response, ttl) {
  if (typeof caches === 'undefined') {
    return;
  }

  response.headers.set('Cache-Control', `public, max-age=${ttl}`);
  await caches.default.put(cacheKey, response);
}

async function writeMemoryCache(key, response, ttl) {
  memoryCache.set(key, {
    expiresAt: Date.now() + ttl * 1000,
    body: await response.text()
  });
}

function sourceSummary(source) {
  return {
    name: source.name,
    category: source.category,
    homepage: source.homepage || source.url,
    type: source.type
  };
}

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
      ...headers
    }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}
