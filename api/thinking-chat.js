export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, nodes = [], centralNodeText = '', protectTasks = [] } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' })
  }

  const nodesContext = nodes.length > 0 
    ? nodes.map(n => n.text).join(', ')
    : 'None'

  const protectTasksContext = protectTasks.length > 0
    ? protectTasks.join(', ')
    : 'None'

  const systemPrompt = `You are Thrivee, a strategic thinking partner 
embedded in the user's Thinking Canvas.

You have full context of what the user is working on:
- Their current canvas question (the central node)
- All surrounding nodes they have created
- Their Protect tasks from their work session

You must reference this context in every response.
Never ask generic questions.
Always connect your response to the specific 
nodes and tasks visible on their canvas.

If the canvas shows 'Why are Hubli leads dropping?' 
with nodes about timing, channel mix, pricing, 
and creative — your responses must be about 
THOSE specific dimensions, not generic marketing.

When the user asks for direction:
Pick the single most important node to investigate 
first and tell them exactly why, based on what 
you know about their context.

Maximum 2 sentences. No bullet points.
Sound like a sharp colleague who has read 
everything on their canvas.

Current canvas: ${centralNodeText}
Nodes: ${nodesContext}
User's Protect tasks: ${protectTasksContext}`

  try {
    console.log('[api/thinking-chat] Calling Claude API...')
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      }),
    })

    console.log(`[api/thinking-chat] Claude API returned status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[api/thinking-chat] Claude API failed: ${errorText}`)
      return res.status(response.status).json({ error: `Claude API error: ${errorText}` })
    }

    const data = await response.json()
    console.log('[api/thinking-chat] Successfully captured Claude response.')
    const text = data.content[0].text
    
    return res.status(200).json({ result: text.trim() })
  } catch (error) {
    console.error('[api/thinking-chat] Fetch execution error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
