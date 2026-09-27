import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as extractQuotePost } from '../app/api/ai/extract-quote/route';
import { POST as intakePost } from '../app/api/ai/intake/route';

describe('Truthfulness & Integrity Guarantees', () => {
  describe('Quote Extraction API', () => {
    it('returns sample quote when isSample is explicitly true', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/extract-quote', {
        method: 'POST',
        body: JSON.stringify({ isSample: true }),
      });

      const res = await extractQuotePost(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.isSample).toBe(true);
      expect(json.quote.totalAmount).toBe(2150);
      expect(json.quote.providerName).toContain('Caring Transitions');
    });

    it('rejects empty document input with 400 and NEVER fabricates sample quote', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/extract-quote', {
        method: 'POST',
        body: JSON.stringify({ documentText: '   ' }),
      });

      const res = await extractQuotePost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.quote).toBeUndefined();
      expect(json.error).toContain('Document text or content is required');
    });
  });

  describe('Intake API', () => {
    it('rejects empty prompt with 400 and does NOT return Maria Thompson scenario', async () => {
      const req = new NextRequest('http://localhost:3000/api/ai/intake', {
        method: 'POST',
        body: JSON.stringify({ prompt: '' }),
      });

      const res = await intakePost(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.seniorName).toBeUndefined();
      expect(json.error).toBe('A situation description is required.');
    });
  });
});
