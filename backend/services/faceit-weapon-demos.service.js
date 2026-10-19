const axios = require('axios');
const { createHash } = require('node:crypto');
const { createWriteStream } = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Transform, pipeline } = require('node:stream');
const { promisify } = require('node:util');
const { Decompress } = require('fzstd');
const { parseEvent } = require('@laihoe/demoparser2');

const pipelineAsync = promisify(pipeline);
const FACEIT_API_KEY = process.env.FACEIT_API_KEY;
const CACHE_DIRECTORY = path.join(os.tmpdir(), 'lgen-d-faceit-weapon-cache');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_RETRY_DELAY_MS = 60 * 1000;
const HISTORY_PAGE_SIZE = 100;
const jobs = new Map();

const weaponNames = {
  ak47: ['AK-47', 'ak47'],
  aug: ['AUG', 'aug'],
  awp: ['AWP', 'awp'],
  bizon: ['PP-Bizon', 'bizon'],
  cz75a: ['CZ75-Auto', 'cz75a'],
  deagle: ['Desert Eagle', 'deagle'],
  elite: ['Dual Berettas', 'elite'],
  famas: ['FAMAS', 'famas'],
  fiveseven: ['Five-SeveN', 'fiveseven'],
  g3sg1: ['G3SG1', 'g3sg1'],
  galilar: ['Galil AR', 'galilar'],
  glock: ['Glock-18', 'glock'],
  m249: ['M249', 'm249'],
  m4a1: ['M4A4', 'm4a4'],
  m4a1_silencer: ['M4A1-S', 'm4a1_silencer'],
  m4a1_silencer_off: ['M4A1-S', 'm4a1_silencer'],
  mac10: ['MAC-10', 'mac10'],
  mag7: ['MAG-7', 'mag7'],
  mp5sd: ['MP5-SD', 'mp5sd'],
  mp7: ['MP7', 'mp7'],
  mp9: ['MP9', 'mp9'],
  negev: ['Negev', 'negev'],
  nova: ['Nova', 'nova'],
  p2000: ['P2000', 'hkp2000'],
  p250: ['P250', 'p250'],
  p90: ['P90', 'p90'],
  revolver: ['R8 Revolver', 'revolver'],
  sawedoff: ['Sawed-Off', 'sawedoff'],
  scar20: ['SCAR-20', 'scar20'],
  sg556: ['SG 553', 'sg556'],
  sg553: ['SG 553', 'sg556'],
  ssg08: ['SSG 08', 'ssg08'],
  taser: ['Zeus x27', 'taser'],
  tec9: ['Tec-9', 'tec9'],
  ump45: ['UMP-45', 'ump45'],
  usp_silencer: ['USP-S', 'usp_silencer'],
  usp_silencer_off: ['USP-S', 'usp_silencer'],
  xm1014: ['XM1014', 'xm1014']
};

function getFaceitResponseDetails(error) {
  const data = error?.response?.data;
  if (typeof data === 'string') {
    return data.slice(0, 300);
  }
  if (typeof data !== 'object' || data === null) {
    return '';
  }

  const details = data.message || data.error || data.errors;
  if (typeof details === 'string') {
    return details.slice(0, 300);
  }
  if (details !== undefined) {
    return JSON.stringify(details).slice(0, 300);
  }

  return '';
}

async function faceitGet(context, url, config) {
  try {
    return await axios.get(url, config);
  } catch (error) {
    error.faceitContext = context;
    const status = error.response?.status || error.code || 'unknown error';
    const details = getFaceitResponseDetails(error);
    console.warn(
      `FACEIT ${context} request failed (${status})${details ? `: ${details}` : ''}`
    );
    throw error;
  }
}

function getFaceitRequestFailure(error) {
  const status = error?.response?.status;
  const details = getFaceitResponseDetails(error);
  const context = error?.faceitContext;
  if (status === 400) {
    const request = context === 'player lookup'
      ? 'player lookup for this Steam ID'
      : context || 'weapon analysis request';
    return `FACEIT rejected the ${request} with HTTP 400${details ? `: ${details}` : '.'}`;
  }
  if (status === 401 || status === 403) {
    return `FACEIT rejected the API key with HTTP ${status}. Check the backend FACEIT_API_KEY configuration${details ? `: ${details}` : '.'}`;
  }
  if (status === 404) {
    return `No FACEIT CS2 profile or match history was found for this Steam ID${details ? `: ${details}` : '.'}`;
  }
  if (status === 429) {
    return `FACEIT rate-limited the weapon analysis. Please retry later${details ? `: ${details}` : '.'}`;
  }
  if (status) {
    return `FACEIT ${context || 'API request'} failed with HTTP ${status}${details ? `: ${details}` : '.'}`;
  }
  const code = error?.code;
  if (code) {
    return `Could not connect to FACEIT (${code}). Check backend network connectivity.`;
  }

  return 'FACEIT weapon analysis failed. Check backend connectivity and logs.';
}

function getMatchAnalysisFailure(error) {
  const status = error?.response?.status;
  if (status) {
    const details = getFaceitResponseDetails(error);
    const source = error.faceitContext ? `FACEIT ${error.faceitContext}` : 'FACEIT or the demo CDN';
    return `${source} returned HTTP ${status}${details ? `: ${details}` : '.'}`;
  }

  if (error?.message === 'FACEIT match does not include this player in its roster') {
    return 'FACEIT match details did not include this player in the roster.';
  }
  if (error?.message === 'FACEIT did not provide a demo URL for this match') {
    return 'FACEIT did not provide a demo URL for this match.';
  }
  if (/invalid zstd data|unexpected eof|zstandard/i.test(error?.message || '')) {
    return 'The downloaded demo is not valid Zstandard data.';
  }
  if (typeof error?.code === 'string') {
    return `A network request failed (${error.code}).`;
  }

  return 'The demo could not be downloaded or parsed; check backend logs for details.';
}

class ZstdDecompressTransform extends Transform {
  constructor() {
    super();
    this.decoder = new Decompress(chunk => {
      if (chunk.byteLength > 0) {
        this.push(Buffer.from(chunk));
      }
    });
  }

  _transform(chunk, encoding, callback) {
    try {
      this.decoder.push(chunk);
      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    try {
      this.decoder.push(new Uint8Array(0), true);
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

function createEmptyStats() {
  return {
    mostKills: [],
    hsPercent: []
  };
}

function getWeaponIdentity(rawWeapon) {
  if (typeof rawWeapon !== 'string') {
    return null;
  }

  const weaponId = rawWeapon.toLowerCase().replace(/^weapon_/, '');
  const knownWeapon = weaponNames[weaponId];

  if (knownWeapon) {
    return { name: knownWeapon[0], imageId: knownWeapon[1] };
  }

  if (weaponId.startsWith('knife')) {
    return { name: 'Knife', imageId: 'knife' };
  }

  return null;
}

function aggregateWeaponKills(events, steamId, totals = new Map()) {
  for (const event of Array.isArray(events) ? events : []) {
    if (String(event.attacker_steamid) !== steamId) {
      continue;
    }

    const identity = getWeaponIdentity(event.weapon);
    if (!identity) {
      continue;
    }

    const current = totals.get(identity.imageId) || {
      ...identity,
      kills: 0,
      headshots: 0
    };

    current.kills++;
    if (event.headshot === true || event.headshot === 1 || event.headshot === '1') {
      current.headshots++;
    }

    totals.set(identity.imageId, current);
  }

  return totals;
}

function formatWeaponStats(totals) {
  const weapons = Array.from(totals.values()).filter(weapon => weapon.kills > 0);

  return {
    mostKills: [...weapons]
      .sort((a, b) => b.kills - a.kills || a.name.localeCompare(b.name))
      .slice(0, 4)
      .map(({ name, imageId, kills }) => ({ name, imageId, kills })),
    hsPercent: [...weapons]
      .sort((a, b) =>
        (b.headshots / b.kills) - (a.headshots / a.kills) ||
        a.name.localeCompare(b.name)
      )
      .slice(0, 4)
      .map(({ name, imageId, headshots, kills }) => ({
        name,
        imageId,
        hsPercent: Number(((headshots / kills) * 100).toFixed(1))
      }))
  };
}

function cacheFilePath(steamId) {
  const key = createHash('sha256').update(steamId).digest('hex');
  return path.join(CACHE_DIRECTORY, `${key}.json`);
}

async function readCache(steamId) {
  try {
    const cached = JSON.parse(await fs.readFile(cacheFilePath(steamId), 'utf8'));
    if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
      return null;
    }

    return cached.job;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function writeCache(steamId, job) {
  await fs.mkdir(CACHE_DIRECTORY, { recursive: true });
  await fs.writeFile(
    cacheFilePath(steamId),
    JSON.stringify({ createdAt: Date.now(), job }),
    'utf8'
  );
}

async function getMatchHistory(playerId) {
  const matches = [];
  let offset = 0;

  while (true) {
    const response = await faceitGet(
      'match history',
      `https://open.faceit.com/data/v4/players/${encodeURIComponent(playerId)}/history`,
      {
        headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
        params: { game: 'cs2', limit: HISTORY_PAGE_SIZE, offset },
        timeout: 20000
      }
    );
    const page = response.data?.items;

    if (!Array.isArray(page)) {
      throw new Error('FACEIT returned an invalid match-history response');
    }

    matches.push(...page);
    if (page.length < HISTORY_PAGE_SIZE) {
      return matches;
    }

    offset += page.length;
  }
}

async function downloadAndCountDemo(demoUrl, steamId, totals) {
  const parsedUrl = new URL(demoUrl);
  if (
    parsedUrl.protocol !== 'https:' ||
    (parsedUrl.hostname !== 'faceit-cdn.net' && !parsedUrl.hostname.endsWith('.faceit-cdn.net'))
  ) {
    throw new Error('FACEIT returned an unexpected demo download host');
  }

  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'lgen-d-faceit-demo-'));
  const demoPath = path.join(temporaryDirectory, 'match.dem');

  try {
    const response = await axios.get(parsedUrl.toString(), {
      responseType: 'stream',
      timeout: 120000,
      maxRedirects: 5
    });

    await pipelineAsync(
      response.data,
      new ZstdDecompressTransform(),
      createWriteStream(demoPath, { flags: 'wx' })
    );

    const events = parseEvent(demoPath, 'player_death');
    aggregateWeaponKills(events, steamId, totals);
  } finally {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
}

async function analyzeHistory(steamId, job) {
  if (!FACEIT_API_KEY) {
    throw new Error('FACEIT_API_KEY is not configured');
  }
  if (!/^\d{17}$/.test(steamId)) {
    throw new Error('Invalid Steam ID');
  }

  const playerResponse = await faceitGet(
    'player lookup',
    'https://open.faceit.com/data/v4/players',
    {
    headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
    params: { game: 'cs2', game_player_id: steamId },
    timeout: 20000
    }
  );
  const playerId = playerResponse.data?.player_id;

  if (typeof playerId !== 'string' || !playerId) {
    throw new Error('FACEIT profile was not found for this Steam ID');
  }

  const matches = await getMatchHistory(playerId);
  const totals = new Map();
  const failureReasons = new Map();
  job.totalMatches = matches.length;

  for (const match of matches) {
    try {
      const response = await faceitGet(
        `match ${match.match_id}`,
        `https://open.faceit.com/data/v4/matches/${encodeURIComponent(match.match_id)}`,
        {
          headers: { Authorization: `Bearer ${FACEIT_API_KEY}` },
          timeout: 20000
        }
      );
      const matchData = response.data;
      const factions = Object.values(matchData.teams || {});
      const playerInMatch = factions
        .flatMap(team => team.roster || [])
        .find(rosterPlayer =>
          rosterPlayer.player_id === playerId ||
          String(rosterPlayer.game_player_id) === steamId
        );
      const demoUrl = Array.isArray(matchData.demo_url)
        ? matchData.demo_url.find(url => typeof url === 'string')
        : null;

      if (!playerInMatch) {
        throw new Error('FACEIT match does not include this player in its roster');
      }
      if (!demoUrl) {
        throw new Error('FACEIT did not provide a demo URL for this match');
      }

      await downloadAndCountDemo(demoUrl, steamId, totals);
      job.analyzedMatches++;
    } catch (error) {
      job.failedMatches++;
      const reason = getMatchAnalysisFailure(error);
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      console.warn(
        `Unable to analyze FACEIT demo ${match.match_id} (${job.processedMatches + 1}/${matches.length}):`,
        error.faceitContext ? `${error.faceitContext}: ${error.message}` : error.message
      );
    } finally {
      job.processedMatches++;
    }
  }

  job.weaponStats = formatWeaponStats(totals);
  job.status = job.failedMatches > 0
    ? job.analyzedMatches > 0 ? 'partial' : 'failed'
    : 'complete';
  job.finishedAt = Date.now();
  if (job.failedMatches > 0) {
    const [reason, count] = [...failureReasons.entries()]
      .sort((a, b) => b[1] - a[1])[0];
    job.message = `${job.failedMatches} FACEIT match demos could not be analyzed. ` +
      `Most common failure (${count} matches): ${reason}`;
  } else {
    job.message = null;
  }

  if (job.status === 'complete') {
    await writeCache(steamId, job);
  }
}

function startAnalysis(steamId) {
  const job = {
    status: 'processing',
    startedAt: Date.now(),
    processedMatches: 0,
    totalMatches: null,
    analyzedMatches: 0,
    failedMatches: 0,
    finishedAt: null,
    weaponStats: createEmptyStats(),
    message: null
  };
  jobs.set(steamId, job);

  void analyzeHistory(steamId, job).catch(error => {
    const status = error.response?.status;
    const details = getFaceitResponseDetails(error);
    console.error(
      `FACEIT weapon demo analysis failed during ${error.faceitContext || 'analysis'}` +
      `${status ? ` (HTTP ${status})` : ''}: ${details || error.message}`
    );
    job.status = 'failed';
    job.finishedAt = Date.now();
    job.message = getFaceitRequestFailure(error);
  });

  return job;
}

async function getFaceitWeaponStatsStatus(steamId) {
  const activeJob = jobs.get(steamId);
  if (activeJob?.status === 'processing') {
    return { ...activeJob };
  }
  if (
    activeJob?.status === 'failed' &&
    Date.now() - activeJob.finishedAt < FAILURE_RETRY_DELAY_MS
  ) {
    return { ...activeJob };
  }
  if (
    activeJob &&
    activeJob.status !== 'failed' &&
    Date.now() - activeJob.finishedAt < CACHE_TTL_MS
  ) {
    return { ...activeJob };
  }
  if (activeJob) {
    jobs.delete(steamId);
  }

  const cachedJob = await readCache(steamId);
  if (cachedJob) {
    jobs.set(steamId, cachedJob);
    return { ...cachedJob };
  }

  return { ...startAnalysis(steamId) };
}

module.exports = {
  aggregateWeaponKills,
  formatWeaponStats,
  getFaceitWeaponStatsStatus
};
