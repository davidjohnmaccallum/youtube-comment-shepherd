const fetch = require('node-fetch')
const fs = require('fs')

const YouTubeService = (apiKey) => {
  const getChannel = (channelId) => fetchJsonCached('https://www.googleapis.com/youtube/v3/channels'+
    `?key=${apiKey}`+
    `&id=${channelId}`+
    `&part=snippet,contentDetails,statistics`)

  const getVideosForChannel = (channelId) => fetchJson('https://www.googleapis.com/youtube/v3/search'+
    `?key=${apiKey}`+
    `&channelId=${channelId}`+
    `&part=snippet,id`+
    `&order=date`+
    `&maxResults=1000`)

  const getVideo = (videoId) => fetchJsonCached('https://www.googleapis.com/youtube/v3/videos'+
    `?key=${apiKey}`+
    `&id=${videoId}`+
    `&part=statistics,snippet`)

  const getCommentsForVideo = (videoId) => fetchJson('https://www.googleapis.com/youtube/v3/commentThreads'+
    `?key=${apiKey}`+
    `&textFormat=plainText`+
    `&part=snippet,replies`+
    `&videoId=${videoId}`+
    `&maxResults=50`)

  const getAllCommentsForChannel = (channelId) => fetchJson('https://www.googleapis.com/youtube/v3/commentThreads'+
    `?key=${apiKey}`+
    `&part=snippet,replies`+
    `&allThreadsRelatedToChannelId=${channelId}`+
    `&maxResults=50`)

  const getAllCommentsForChannelWithVideos = async (channelId) => {
    const comments = await getAllCommentsForChannel(channelId)
    for (const comment of comments.items) {
      const video = await getVideo(comment.snippet.videoId)
      comment.video = video
    }
    return comments
  }

  const cache = fs.existsSync('cache.json') ? JSON.parse(fs.readFileSync('cache.json', 'utf-8')) : {}
  async function fetchJsonCached(url) {
    if (!cache[url]) {
      console.error("Cache miss 😿", url)
      const res = await fetch(url)
      const json = await res.json()
      cache[url] = json
      fs.writeFile('cache.json', JSON.stringify(cache,null,4), () => {})
    } else {
      console.error("Cache hit 😸", url)
    }
    return cache[url]
  }

  async function fetchJson(url) {
    console.log("Fetching", url)
    const res = await fetch(url)
    const json = await res.json()
    return json
  }

  return { getChannel, getVideosForChannel, getVideo, getCommentsForVideo, getAllCommentsForChannel, getAllCommentsForChannelWithVideos }
}


module.exports = YouTubeService