# Voice Latency Diagnostic

After ORIEL finishes generating a text response, there is a
significant delay before audio begins playing. The user reads
the full response but waits several seconds for voice to start.

## Root cause
Current architecture is sequential:
1. LLM generates complete text response (streaming to UI)
2. Full text sent to TTS provider in one request
3. TTS processes entire text and returns audio
4. Audio plays

Steps 2-4 only begin after step 1 is fully complete.
On a long ORIEL response this means 3-8 seconds of silence
after the text is already visible.

## The fix — streaming TTS
Start TTS on the FIRST meaningful chunk of text, not after
the full response. Two approaches, pick one:

APPROACH A (simpler): Sentence-level chunking
- Split streamed text on sentence boundaries (. ! ?)
- Send each complete sentence to TTS as it arrives
- Queue and play audio chunks in order
- Small gap between sentences is acceptable

APPROACH B (best UX): Streaming TTS API
- Use a TTS provider that supports streaming audio output
  (ElevenLabs streaming, OpenAI TTS streaming, or equivalent)
- Pipe streamed text directly into streaming TTS
- Audio begins within 1-2 seconds of first token

## What to investigate first
1. Which TTS provider is currently used? Find it in server/
2. Does it support streaming audio output?
3. Where is the TTS call made — in the tRPC router or a
   separate service file?
4. Report findings before proposing any implementation.
