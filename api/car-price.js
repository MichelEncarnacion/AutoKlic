// api/car-price.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { marca, modelo, año } = req.query
  if (!marca || !modelo || !año) {
    return res.status(400).json({ error: 'Missing params' })
  }

  try {
    // Search with year in query for better relevance
    const q   = encodeURIComponent(`${marca} ${modelo} ${año}`)
    const url = `https://api.mercadolibre.com/sites/MLM/search?category=MLM1744&q=${q}&limit=50`

    const mlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutoKlic/1.0)',
        'Accept': 'application/json',
      },
    })

    if (!mlRes.ok) {
      return res.status(200).json({ found: false, reason: `ML ${mlRes.status}` })
    }

    const data = await mlRes.json()

    // Only MXN listings within a sane price range
    let prices = (data.results ?? [])
      .filter(r => r.currency_id === 'MXN' && r.price >= 40000 && r.price <= 8000000)
      .map(r => r.price)

    if (prices.length < 4) {
      return res.status(200).json({ found: false, reason: 'not_enough', count: prices.length })
    }

    // IQR-based outlier removal (more robust than % trimming)
    prices.sort((a, b) => a - b)
    const q1  = prices[Math.floor(prices.length * 0.25)]
    const q3  = prices[Math.floor(prices.length * 0.75)]
    const iqr = q3 - q1
    const filtered = prices.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr)

    if (filtered.length < 3) {
      return res.status(200).json({ found: false, reason: 'outliers_removed', count: filtered.length })
    }

    const median = filtered[Math.floor(filtered.length / 2)]
    const avg    = Math.round(filtered.reduce((s, p) => s + p, 0) / filtered.length)

    // Use average of median and mean for a more stable central value
    const central = Math.round((median + avg) / 2)

    return res.status(200).json({
      found:   true,
      median:  central,
      count:   data.results?.length ?? 0,
      usable:  filtered.length,
    })
  } catch (err) {
    return res.status(200).json({ found: false, reason: 'exception', detail: err.message })
  }
}
