interface Jin10Item {
  id: string
  time: string
  type: number
  data: {
    pic?: string
    title?: string
    source?: string
    content?: string
    source_link?: string
    vip_title?: string
    lock?: boolean
    vip_level?: number
    vip_desc?: string
  }
  important: number
  tags: string[]
  channel: number[]
  remark: any[]
}

export default defineSource(async () => {
  const timestamp = Date.now()
  const url = `https://www.jin10.com/flash_newest.js?t=${timestamp}`

  const rawData: string = await myFetch(url)

  const jsonStr = (rawData as string)
    .replace(/^var\s+newest\s*=\s*/, "") // 移除开头的变量声明
    .replace(/;*$/, "") // 移除末尾可能存在的分号
    .trim() // 移除首尾空白字符
  const data: Jin10Item[] = JSON.parse(jsonStr)

  // 【修改点】：删除了 !k.channel?.includes(5)，现在会包含 A 股等所有频道
  return data.filter(k => (k.data.title || k.data.content)).map((k) => {
    const text = (k.data.title || k.data.content)!.replace(/<\/?b>/g, "")
    
    // 尝试解析 【标题】描述 格式
    const [, title, desc] = text.match(/^【([^】]*)】(.*)$/) ?? []
    
    return {
      id: k.id,
      title: title ?? text, // 如果没有【】括号，则整段作为标题
      pubDate: parseRelativeDate(k.time, "Asia/Shanghai").valueOf(),
      url: `https://flash.jin10.com/detail/${k.id}`,
      extra: {
        hover: desc, // 方括号后面的详细描述
        info: !!k.important && "✰", // 重要新闻标记
        channels: k.channel // 保留频道 ID 方便后续调试
      },
    }
  })
})
