const puppeteer = require('puppeteer');

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

      return stats;
    });

    console.log('📊 CSStats.gg scraped stats:', data);

    return data;
  } catch (error) {
    console.error('❌ Error scraping CSStats.gg:', error.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { getCsStatsGG };