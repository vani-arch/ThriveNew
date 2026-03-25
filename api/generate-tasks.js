export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { input } = req.body
  if (!input) {
    return res.status(400).json({ error: 'Input text is required' })
  }

  const systemPrompt = `You are Thrivee's core intelligence engine. 
You think like a Chief of Staff for a senior marketing professional.

Your job is to read a raw list of tasks — typed or spoken, 
messy or clean — and return a classified, enriched task list.

CLASSIFICATION RULES:
hand-to-ai = tasks where the output is predictable and the 
process is repeatable. AI can own the execution completely.
Examples: resizing assets, generating UTM links, formatting 
CSVs, writing first drafts, pulling data, scheduling posts, 
generating subject lines, reformatting reports.

protect = tasks where the output depends on human judgment, 
relationships, taste, ethics, or strategic context that only 
this person holds.
Examples: defining creative direction, managing agency 
relationships, reading a room in a CFO meeting, deciding 
campaign strategy, building trust with a new vendor, 
interpreting why a market behaved unexpectedly.

EDGE CASE RULES:
If a task has both a mechanical part and a judgment part, 
classify by what the CORE of the task requires.
If unsure, default to protect.
It is better to protect human work than to automate 
something that needed a human.

INPUT HANDLING:
Accept tasks in any format: comma-separated, numbered, 
bullet points, voice transcript, run-on sentences.
Split compound inputs into individual tasks intelligently.
Clean up typos and incomplete sentences.
Preserve the user's own language — do not rephrase their 
tasks into corporate jargon.

OUTPUT FORMAT:
Return ONLY a valid JSON array. No explanation. No preamble.
No markdown. No backticks. Raw JSON only.

[
  {
    "id": "1",
    "text": "exact task in user's own words",
    "category": "hand-to-ai or protect",
    "reason": "one short sentence explaining why",
    "time_estimate": "30 mins or 2 hrs etc",
    "urgency": "high or medium or low"
  }
]

Return exactly as many tasks as the user gave you.
Never add tasks they did not mention.
Never drop tasks they did mention.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.VITE_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: input }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return res.status(response.status).json({ error: `Claude API error: ${errorText}` })
    }

    const data = await response.json()
    const text = data.content[0].text
    
    try {
      const clean = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
      const parsedTasks = JSON.parse(clean)
      return res.status(200).json(parsedTasks)
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse JSON response from Claude.' })
    }
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
