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

export async function searchRss({ url, keyword, maxResults = 5 }) {
  const res = await fetch(url, { headers: { 'User-Agent': 'rossi-bot/1.0' } })
  if (!res.ok) throw new Error(`RSS fetch failed (${url}): ${res.status}`)

  const xml = await res.text()
  let items = parseItems(xml)

  if (keyword) {
    const kw = keyword.toLowerCase()
    items = items.filter(i =>
      i.title?.toLowerCase().includes(kw) ||
      i.description?.toLowerCase().includes(kw)
    )
  }

  return {
    url,
    keyword: keyword ?? null,
    results: items.slice(0, maxResults),
  }
}
