import { getConfig, logger } from '@rossi-bot/core-platform'

const BASE_URL = 'https://api.heygen.com'

function headers() {
  const { heygenApiKey } = getConfig()
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': heygenApiKey,
  }
}

export async function submit(transcript, avatar, { title, dryRun = false, typeId, orientation } = {}) {
  const motionEngine = typeId
    ? avatar.heygenMotionEngines?.[typeId]
    : avatar.heygenMotionEngine

  if (dryRun || !motionEngine) {
    logger.info(`[DRY RUN] Skipping HeyGen submission for avatar: ${avatar.id}${typeId ? ` (${typeId})` : ''}`)
    return { videoId: 'dry-run', status: 'dry-run' }
  }

  const avatarId = (orientation && avatar.heygenAvatarIds?.[orientation]) ?? avatar.heygenAvatarId

  const paddedScript = `<break time="0.5s"/>${transcript}<break time="0.5s"/>`

  const body = {
    type: 'avatar',
    avatar_id: avatarId,
    voice_id: avatar.heygenVoiceId,
    script: paddedScript,
    engine: { type: motionEngine },
    resolution: '720p',
    ...(title && { title }),
  }

  logger.info(`Submitting to HeyGen for avatar: ${avatar.id}`)

  const response = await fetch(`${BASE_URL}/v3/videos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`HeyGen submit failed ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  const videoId = data.data?.video_id

  logger.info(`HeyGen video queued. ID: ${videoId}`)

  return { videoId, status: 'processing' }
}

export async function getStatus(videoId) {
  const response = await fetch(
    `${BASE_URL}/v1/video_status.get?video_id=${videoId}`,
    { headers: headers() }
  )

  if (!response.ok) {
    throw new Error(`HeyGen status check failed ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  return {
    videoId,
    status: data.data?.status,
    url: data.data?.video_url ?? null,
  }
}

export async function waitForCompletion(videoId, { pollIntervalMs = 15_000, timeoutMs = 600_000 } = {}) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const result = await getStatus(videoId)

    if (result.status === 'completed') return result
    if (result.status === 'failed') throw new Error(`HeyGen video failed: ${videoId}`)

    logger.info(`Video ${videoId} status: ${result.status} — waiting ${pollIntervalMs / 1000}s`)
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
  }

  throw new Error(`Timed out waiting for HeyGen video: ${videoId}`)
}
