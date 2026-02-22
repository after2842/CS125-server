import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
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
  async searchReview(product: string, merchant: string) {
    console.log('review service on');
    console.log('apikey:', process.env.OPENAI_APIKEY);
    const client = new OpenAI({ apiKey: process.env.OPENAI_APIKEY?.trim() });

    const response = await client.responses.create({
      model: 'gpt-4.1-2025-04-14',
      tools: [{ type: 'web_search' }],
      input:
        `Search review of ${product} from ${merchant}.\n ` +
        'Also, search the company info, and their reputation for that product.' +
        "Also, find if it's expensive or not" +
        'Organize everything well and output should be short.',
    });

    console.log(JSON.stringify(response.output_text));
    const ans = response.output_text;
    return ans;
  }

  async embedQuery(query: string) {
    console.log('review service on');
    console.log('apikey:', process.env.OPENAI_APIKEY);
    const client = new OpenAI({ apiKey: process.env.OPENAI_APIKEY?.trim() });

    const embedding = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float',
    });
    const ans = embedding.data[0].embedding;
    return ans;
  }

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
