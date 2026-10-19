const puppeteer = require('puppeteer');

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FAILURE_RETRY_DELAY_MS = 60 * 1000;
const weaponStatsJobs = new Map();

function emptyWeaponStats() {
  return { mostKills: [], hsPercent: [] };
}

async function getCsStatsGG(steamId) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    const url = `https://csstats.gg/es/player/${steamId}#/`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Esperar a que cargue el contenido
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Extraer datos usando evaluate - buscar por estructura del DOM
    const data = await page.evaluate(() => {
      const stats = {};

      // Obtener todo el texto para búsqueda robusta
      const bodyText = document.body.innerText || document.body.textContent || '';
      const normalizedBodyText = bodyText.toLowerCase();

      // Función para extraer número de línea que contiene término
      const extractNumberFromText = (term) => {
        const regex = new RegExp(`${term}[\\s:]*([\\d.]+)`, 'i');
        const match = bodyText.match(regex);
        return match ? match[1] : null;
      };

      // Función alternativa: buscar por estructura de elementos
      const findElementByContent = (selector, keyword) => {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          if (el.textContent.toLowerCase().includes(keyword.toLowerCase())) {
            const value = el.textContent.match(/[\d.]+/);
            return value ? value[0] : null;
          }
        }
        return null;
      };

      // Extraer K/D - buscar múltiples variantes
      stats.kd = extractNumberFromText('K/D') || 
                  extractNumberFromText('KD Ratio') ||
                  extractNumberFromText('K D');

      // Extraer ADR
      stats.adr = extractNumberFromText('ADR');

      // Extraer Win Rate
      stats.win_rate = extractNumberFromText('Win Rate') || 
                       extractNumberFromText('Winrate') ||
                       extractNumberFromText('Win %');

      // Extraer Matches - buscar número antes de "Matches"
      const matchText = bodyText.match(/(\d+)\s*(?:Matches?|Partidas)/i);
      stats.matches = matchText ? matchText[1] : extractNumberFromText('Matches');

      // Extraer Wins
      const winsText = bodyText.match(/(\d+)\s*(?:Wins?|Victorias)/i);
      stats.wins = winsText ? winsText[1] : extractNumberFromText('Wins');

      // Extraer HS%
      stats.hs = extractNumberFromText('HS%') ||
                 extractNumberFromText('Headshot %') ||
                 extractNumberFromText('Headshot');

      // Extraer Rating
      stats.rating = extractNumberFromText('Rating');

      // Limpiar valores que sean puntos o símbolos
      Object.keys(stats).forEach(key => {
        if (stats[key] === '.' || stats[key] === '') {
          stats[key] = null;
        }
      });

      const weaponImages = Array.from(
        document.querySelectorAll('img[src*="/images/weapons/"]')
      );

      const readWeaponSection = (headingPattern, metricPattern) => {
        const headings = Array.from(
          document.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"]')
        );
        const heading = headings.find(element =>
          headingPattern.test((element.innerText || element.textContent || '').trim())
        );

        if (!heading) {
          return [];
        }

        let section = heading;
        while (
          section &&
          !Array.from(section.querySelectorAll('img[src*="/images/weapons/"]')).length
        ) {
          section = section.parentElement;
        }

        if (!section) {
          return [];
        }

        return Array.from(section.querySelectorAll('img[src*="/images/weapons/"]'))
          .flatMap(image => {
            const imageUrl = image.getAttribute('src') || '';
            const imageId = imageUrl.match(/\/images\/weapons\/([^/]+)_light\.png(?:\?.*)?$/)?.[1];
            if (!imageId) {
              return [];
            }

            let card = image.parentElement;
            let cardText = '';
            while (card && card !== section.parentElement) {
              const cardImages = card.querySelectorAll('img[src*="/images/weapons/"]');
              const text = (card.innerText || card.textContent || '').trim();
              if (cardImages.length === 1 && metricPattern.test(text)) {
                cardText = text;
                break;
              }
              card = card.parentElement;
            }

            if (!cardText) {
              return [];
            }

            const metric = cardText.match(metricPattern)?.[1];
            if (!metric) {
              return [];
            }

            const alt = image.getAttribute('alt') || '';
            const name = alt || imageId
              .replace(/_light$/, '')
              .replace(/_/g, ' ')
              .replace(/\b\w/g, letter => letter.toUpperCase());
            const value = Number(metric.replace(/,/g, ''));

            return Number.isFinite(value)
              ? [{ name, imageId, value }]
              : [];
          });
      };

      return {
        ...stats,
        availabilityError: /verify you're human|cloudflare needs to check your browser/.test(normalizedBodyText)
          ? 'CSStats.gg requires a human verification check, so matchmaking stats cannot be loaded automatically.'
          : null,
        weaponStats: {
          mostKills: readWeaponSection(
            /^most\s+kills$/i,
            /([\d,]+)(?!.*[\d,])/
          ).map(weapon => ({
            name: weapon.name,
            imageId: weapon.imageId,
            kills: weapon.value
          })),
          hsPercent: readWeaponSection(
            /^(?:hs\s*%|headshots?%?)$/i,
            /([\d.]+)\s*%/
          ).map(weapon => ({
            name: weapon.name,
            imageId: weapon.imageId,
            hsPercent: weapon.value
          }))
        }
      };
    });

    if (data.availabilityError) {
      throw new Error(data.availabilityError);
    }
    if (!data.weaponStats.mostKills.length && !data.weaponStats.hsPercent.length) {
      throw new Error('CSStats.gg did not expose weapon statistics for this profile.');
    }

    console.log('📊 CSStats.gg scraped stats:', data);

    return data;
  } catch (error) {
    console.error('❌ Error scraping CSStats.gg:', error.message);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

function startWeaponStatsAnalysis(steamId) {
  const job = {
    status: 'processing',
    startedAt: Date.now(),
    finishedAt: null,
    weaponStats: emptyWeaponStats(),
    message: null
  };
  weaponStatsJobs.set(steamId, job);

  void getCsStatsGG(steamId).then(stats => {
    job.weaponStats = stats.weaponStats;
    job.status = 'complete';
    job.finishedAt = Date.now();
  }).catch(error => {
    console.warn('Unable to load CS2 matchmaking weapon stats:', error.message);
    job.status = 'failed';
    job.finishedAt = Date.now();
    job.message = error.message;
  });

  return job;
}

function getCsStatsGGWeaponStatsStatus(steamId) {
  const activeJob = weaponStatsJobs.get(steamId);
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
    activeJob?.status === 'complete' &&
    Date.now() - activeJob.finishedAt < CACHE_TTL_MS
  ) {
    return { ...activeJob };
  }

  return { ...startWeaponStatsAnalysis(steamId) };
}

module.exports = { getCsStatsGG, getCsStatsGGWeaponStatsStatus };