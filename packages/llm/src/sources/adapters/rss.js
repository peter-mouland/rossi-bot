function extractTag(xml, tag) {
  const cdata = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))
  if (cdata) return cdata[1].trim()
  const plain = xml.match(new RegExp(`<${tag}>([^<]*)<\\/${tag}>`))
  return plain ? plain[1].trim() : null
}

function parseItems(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = extractTag(block, 'title')
    if (!title) continue
    const description = extractTag(block, 'description')
    items.push({
      title,
      url: extractTag(block, 'link'),
      description: description ? description.slice(0, 200) : null,
      publishedAt: extractTag(block, 'pubDate'),
    })
  }
  return items
}

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d
}

export async function searchRss({ url, keyword, maxResults = 5 }) {
  const res = await fetch(url, { headers: { 'User-Agent': 'rossi-bot/1.0' } })
  if (!res.ok) throw new Error(`RSS fetch failed (${url}): ${res.status}`)

  const xml = await res.text()
  let items = parseItems(xml)

  // Filter to last 7 days — items without a date are kept to avoid silently dropping content
  const cutoff = sevenDaysAgo()
  items = items.filter(i => {
    if (!i.publishedAt) return true
    const d = new Date(i.publishedAt)
    return isNaN(d.getTime()) || d >= cutoff
  })

  if (keyword) {
    const words = keyword.toLowerCase().split(/[\s,]+/).filter(Boolean)
    items = items.filter(i => {
      const text = `${i.title ?? ''} ${i.description ?? ''}`.toLowerCase()
      return words.some(w => text.includes(w))
    })
  }

  return {
    url,
    keyword: keyword ?? null,
    results: items.slice(0, maxResults),
  }
}
