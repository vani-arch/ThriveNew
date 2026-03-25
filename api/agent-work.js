export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { taskName, userName } = req.body
  if (!taskName) {
    return res.status(400).json({ error: 'Task name is required' })
  }

  const resolvedName = userName || 'Megha'

  const systemPrompt = `You are Agent Root. You have just completed a task 
for ${resolvedName}, Senior Growth Lead at EduSpark.
When given a task name, return the completed work 
output as if you just executed it. 
Be specific, realistic, and ready to use.
Format the output cleanly — no preamble, 
just the deliverable.`

  try {
    console.log('[api/agent-work] Calling Claude API for task:', taskName)
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
        messages: [{ role: 'user', content: taskName }],
      }),
    })

    console.log(`[api/agent-work] Claude API returned status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[api/agent-work] Claude API failed: ${errorText}`)
      return res.status(response.status).json({ error: `Claude API error: ${errorText}` })
    }

    const data = await response.json()
    console.log('[api/agent-work] Successfully captured Claude response.')
    const text = data.content[0].text
    
    return res.status(200).json({ result: text.trim() })
  } catch (error) {
    console.error('[api/agent-work] Fetch execution error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
