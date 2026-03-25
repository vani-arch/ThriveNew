export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { taskText } = req.body
  console.log('Calling generate-canvas with:', taskText)
  if (!taskText) return res.status(400).json({ error: 'Task text required' })

  const systemPrompt = `You are a strategic thinking engine.
Given a work task that requires human judgment,
generate a mind map structure to help the person
think through it deeply.

Return ONLY valid JSON, no preamble:
{
  "central": "the core strategic question behind this task",
  "nodes": [
    { 
      "id": "1",
      "question": "one strategic dimension to explore",
      "tag": "TWO WORD CATEGORY TAG IN CAPS"
    },
    { "id": "2", "question": "...", "tag": "..." },
    { "id": "3", "question": "...", "tag": "..." },
    { "id": "4", "question": "...", "tag": "..." }
  ]
}`

  try {
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
        messages: [{ role: 'user', content: taskText }]
      }),
    })

    if (!response.ok) throw new Error(await response.text())

    const data = await response.json()
    const text = data.content[0].text
    
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error("No JSON found in response")
    
    return res.status(200).json(JSON.parse(match[0]))
  } catch (error) {
    console.error('[api/generate-canvas] error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
