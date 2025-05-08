import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI API
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { diffItem, sysPrompt } = await req.json();

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: 'system',
                    content: sysPrompt
                },
                {
                    role: 'user',
                    content: `Diff: ${diffItem}`
                }
            ],
            stream: true,
            max_tokens: 100,
        });

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0].delta.content;
                        controller.enqueue(encoder.encode(content as string));
                    }
                    controller.close();
                } catch (error) {
                    controller.error('Error during streaming\n' + error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Error creating completion:', error);
        return NextResponse.json({ error: 'Failed to stream OpenAI response' }, { status: 500 });
    }
}
