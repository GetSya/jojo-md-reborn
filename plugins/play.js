import fetch from "node-fetch"

function formatNumber(num = 0) {
  return num.toLocaleString()
}

function formatDuration(sec = 0) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

async function fetchBufferSafe(url, retry = 3) {
  for (let i = 0; i < retry; i++) {
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(res.status)
      return await res.buffer()
    } catch {
      if (i === retry - 1) throw "Gagal download audio"
      await new Promise(r => setTimeout(r, 3000))
    }
  }
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply("Contoh: .play kota ini tak sama tanpamu")

  const api = `https://api-faa.my.id/faa/ytplay?query=${encodeURIComponent(text)}`
  const res = await fetch(api)
  const json = await res.json()

  if (!json.status) throw "Lagu tidak ditemukan"

  const v = json.result

  const caption = `
✨ *PLAY MUSIC*

> Query   : ${text}
> Judul   : ${v.title}
> Channel : ${v.author}
> Durasi  : ${formatDuration(v.duration)}
> Views   : ${formatNumber(v.views)}
> Upload  : ${v.published}

> Quality : 128kbps
> Status  : Mengunduh audio...
`.trim()

  await conn.sendMessage(m.chat, {
    image: { url: v.thumbnail },
    caption
  }, { quoted: m })

  const buffer = await fetchBufferSafe(v.mp3)

  if (buffer.length > 50 * 1024 * 1024)
    return m.reply(`File terlalu besar\n${v.mp3}`)

  await conn.sendMessage(m.chat, {
    audio: buffer,
    mimetype: "audio/mpeg"
  }, { quoted: m })
}

handler.help = ["play <judul lagu>"]
handler.tags = ["downloader"]
handler.command = /^play$/i
handler.limit = true
handler.register = true

export default handler
