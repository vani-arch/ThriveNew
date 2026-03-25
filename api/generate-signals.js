export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { taskName } = req.body
  if (!taskName) {
    return res.status(400).json({ error: 'Task name is required' })
  }

  const systemPrompt = `You are a market intelligence engine for a 
senior marketing professional in India.
Given a specific work task, return 3 relevant 
real-world signals that would help this person 
do that task better right now.
A signal is a specific, current, actionable piece 
of market context — a trend, a competitor move, 
a platform change, a consumer behaviour shift.
Be specific to India and the task.
Return ONLY valid JSON array, no preamble:
[
  { 
    "id": "1",
    "signal": "one line signal text",
    "relevance": "one line why this matters for this task"
  }
]
Return exactly 3 signals.`

  try {
    console.log('[api/generate-signals] Calling Claude API for task:', taskName)
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

    console.log(`[api/generate-signals] Claude API returned status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[api/generate-signals] Claude API failed: ${errorText}`)
      return res.status(response.status).json({ error: `Claude API error: ${errorText}` })
    }

    const data = await response.json()
    console.log('[api/generate-signals] Successfully captured Claude response.')
    const text = data.content[0].text
    
    try {
      const clean = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
      const parsedSignals = JSON.parse(clean)
      console.log(`[api/generate-signals] Successfully parsed JSON: ${parsedSignals.length} signals generated.`)
      return res.status(200).json(parsedSignals)
    } catch (parseError) {
      console.error('[api/generate-signals] JSON parsing failed. Text received was:', text)
      return res.status(500).json({ error: 'Failed to parse JSON response from Claude.' })
    }
  } catch (error) {
    console.error('[api/generate-signals] Fetch execution error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
