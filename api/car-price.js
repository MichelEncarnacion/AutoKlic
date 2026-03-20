// api/car-price.js
// Proxies Mercado Libre search server-side to avoid CORS/403 issues

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { marca, modelo, año } = req.query
  if (!marca || !modelo || !año) {
    return res.status(400).json({ error: 'Missing params' })
  }

  try {
    const q   = encodeURIComponent(`${marca} ${modelo} ${año}`)
    const url = `https://api.mercadolibre.com/sites/MLM/search?category=MLM1744&q=${q}&limit=50`

    const mlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutoKlic/1.0)',
        'Accept': 'application/json',
      },
    })

    if (!mlRes.ok) {
      return res.status(mlRes.status).json({ error: 'ML API error', status: mlRes.status })
    }

    const data = await mlRes.json()

    const prices = (data.results ?? [])
      .filter(r => r.currency_id === 'MXN' && r.price >= 40000 && r.price <= 8000000)
      .map(r => r.price)

    if (prices.length < 3) {
      return res.status(200).json({ found: false, count: prices.length })
    }

    prices.sort((a, b) => a - b)
    const trim    = Math.max(1, Math.floor(prices.length * 0.1))
    const trimmed = prices.slice(trim, prices.length - trim)
    const median  = trimmed[Math.floor(trimmed.length / 2)]

    return res.status(200).json({ found: true, median, count: prices.length })
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', detail: err.message })
  }
}
