const cache = new Map();

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.time > 60000) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    time: Date.now()
  });
}

module.exports = { getCache, setCache };
