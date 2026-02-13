const BOT_PATTERN =
  /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|slackbot|whatsapp|discordbot|telegrambot|linkedinbot|pinterestbot|redditbot|applebot|googlebot|bingbot/i

export default async (request: Request) => {
  const userAgent = request.headers.get('user-agent') || ''
  const url = new URL(request.url)

  if (BOT_PATTERN.test(userAgent) && url.pathname.match(/^\/c\/\d+$/)) {
    const canvasId = url.pathname.split('/').pop()

    // Rewrite to your Railway API
    const apiUrl = new URL(`${Deno.env.get('VITE_API_URL')}/api/canvases/${canvasId}/meta`)
    return fetch(apiUrl)
  }

  return
}

export const config = { path: '/c/*' }
