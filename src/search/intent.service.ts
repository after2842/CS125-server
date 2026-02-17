import { Injectable } from '@nestjs/common';

const SearchIntentSchema = {
  name: 'SearchIntent',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      q: { type: 'string' },
      maxPrice: { type: 'number' },
      minPrice: { type: 'number' },
      tags: { type: 'array', items: { type: 'string' } },
      sort: { type: 'string', enum: ['relevance', 'price_asc', 'price_desc'] },
      page: { type: 'integer', minimum: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 50 },
    },
    required: ['q'],
  },
} as const;

const normalizeIntent = () => {
  return;
};

@Injectable()
export class IntentService {
  async toSearchIntent(userText: string) {
    const body = {
      model: 'gpt-5-nano',
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                "Extract shopping intent as JSON. Map '$2k' => 2000. " +
                'Return only JSON matching schema.',
            },
          ],
        },
        { role: 'user', content: [{ type: 'input_text', text: userText }] },
      ],
      response_format: { type: 'json_schema', json_schema: SearchIntentSchema },
    };

    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();

    // You’ll extract the JSON from the response payload (depends on SDK/format you use)
    const rawIntent =
      data.output?.[0]?.content?.[0]?.json ?? data.output_text ?? null;

    const intent = normalizeIntent();
    return intent;
  }
}
