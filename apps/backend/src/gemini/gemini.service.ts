import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractedOrder {
  confidence: 'HIGH' | 'LOW';
  customerName?: string;
  itemDescription?: string;
  quantity?: number;
  amountNaira?: number;
  clarifyingQuestion?: string;
  /** Which required fields Gemini (or our validator) couldn't confidently fill. */
  missingFields?: string[];
}

// Sanity bounds for a single WhatsApp-originated transaction.
// Anything outside this range gets forced to LOW confidence regardless
// of what the model reports, since a misparse here creates a real
// payment link for the wrong amount.
const MIN_AMOUNT_NAIRA = 50;
const MAX_AMOUNT_NAIRA = 1_000_000;

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_TIMEOUT_MS = 8_000; // 8 seconds

const DEFAULT_CLARIFYING_QUESTION =
  'Sorry, I no too catch that order details well. Abeg send am like: "2 shirts for Tunde 15000"';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private ai: GoogleGenAI | null = null;
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      if (this.isProduction) {
        throw new Error(
          'GEMINI_API_KEY is missing. Refusing to start in production ' +
            'without it — order parsing must not run in mock mode against real traffic.',
        );
      }
      this.logger.warn(
        'GEMINI_API_KEY missing. Running in LOW-confidence-only dev fallback mode. ' +
          'Every message will require manual clarification — this is NOT safe for production.',
        'GeminiService',
      );
      return;
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  async parseMessage(messageText: string): Promise<ExtractedOrder> {
    this.logger.log(
      `Parsing message with Gemini: "${messageText}"`,
      'GeminiService',
    );

    if (!this.ai) {
      // It always asks the merchant to restate the order instead
      // of fabricating a HIGH-confidence transaction from unparsed text.
      return {
        confidence: 'LOW',
        clarifyingQuestion: DEFAULT_CLARIFYING_QUESTION,
        missingFields: ['amountNaira', 'itemDescription'],
      };
    }

    const systemPrompt = `You are TradeChat AI, an assistant helping Nigerian market traders create instant payment links on WhatsApp.
Analyze the user message and extract order details.
If the message contains clear or inferable product/service details AND an amount in Naira (e.g., "50k", "4500", "25,000", "2.5k"), set confidence to "HIGH".
Note: 1k = 1000 Naira. Extract amountNaira as a numeric value in Naira (e.g. 50k = 50000).
Quantity may be fractional (e.g. 2.5 for "2.5kg of rice") — do not round.
If the amount or product description is completely missing or ambiguous, set confidence to "LOW", list the missing fields in missingFields (using the keys: customerName, itemDescription, quantity, amountNaira), and provide a natural, friendly Nigerian English/Pidgin clarifyingQuestion (e.g., "Abeg how much be the total amount?" or "Wetin be the customer name?").
Only ever set confidence to "HIGH" if you are also returning a non-empty itemDescription and a positive amountNaira in the same response.`;

    let responseText: string;

    try {
      const response = await this.withTimeout(
        this.ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: `${systemPrompt}\n\nUser Message: "${messageText}"`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                confidence: { type: Type.STRING, enum: ['HIGH', 'LOW'] },
                customerName: { type: Type.STRING },
                itemDescription: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                amountNaira: { type: Type.NUMBER },
                clarifyingQuestion: { type: Type.STRING },
                missingFields: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['confidence'],
            },
          },
        }),
        GEMINI_TIMEOUT_MS,
      );

      responseText = response.text || '{}';
    } catch (error: any) {
      this.logger.error(
        `Gemini API call failed: ${error.message}`,
        error.stack,
        'GeminiService',
      );
      return {
        confidence: 'LOW',
        clarifyingQuestion: DEFAULT_CLARIFYING_QUESTION,
        missingFields: ['amountNaira', 'itemDescription'],
      };
    }

    let parsed: ExtractedOrder;
    try {
      parsed = JSON.parse(responseText);
    } catch (error: any) {
      this.logger.error(
        `Failed to parse Gemini JSON response: ${error.message}. Raw response: ${responseText}`,
        error.stack,
        'GeminiService',
      );
      return {
        confidence: 'LOW',
        clarifyingQuestion: DEFAULT_CLARIFYING_QUESTION,
        missingFields: ['amountNaira', 'itemDescription'],
      };
    }

    const validated = this.validateAndNormalize(parsed);

    this.logger.log(
      `Parsed result: ${JSON.stringify(validated)}`,
      'GeminiService',
    );

    return validated;
  }

  /**
   * The schema's `required: ['confidence']` lets Gemini legally return
   * `{ confidence: "HIGH" }` with nothing else — this function refuses
   * to trust HIGH confidence unless the fields it depends on are
   * actually present and within sane bounds. Anything that fails this
   * check is downgraded to LOW and routed back to the merchant instead
   * of silently becoming a payment link for the wrong amount.
   */
  private validateAndNormalize(raw: ExtractedOrder): ExtractedOrder {
    const quantity =
      typeof raw.quantity === 'number' && raw.quantity > 0 ? raw.quantity : 1;

    const hasItem =
      typeof raw.itemDescription === 'string' &&
      raw.itemDescription.trim().length > 0;

    const hasValidAmount =
      typeof raw.amountNaira === 'number' &&
      raw.amountNaira >= MIN_AMOUNT_NAIRA &&
      raw.amountNaira <= MAX_AMOUNT_NAIRA;

    if (raw.confidence === 'HIGH' && hasItem && hasValidAmount) {
      return {
        confidence: 'HIGH',
        customerName: raw.customerName?.trim() || undefined,
        itemDescription: raw.itemDescription!.trim(),
        quantity,
        amountNaira: raw.amountNaira,
      };
    }

    // Either the model itself said LOW, or it said HIGH but the payload
    // didn't actually back that up — treat both the same way: ask.
    const missingFields: string[] = [];
    if (!hasItem) missingFields.push('itemDescription');
    if (!hasValidAmount) missingFields.push('amountNaira');
    if (!raw.customerName) missingFields.push('customerName');

    const outOfBounds =
      typeof raw.amountNaira === 'number' &&
      (raw.amountNaira < MIN_AMOUNT_NAIRA ||
        raw.amountNaira > MAX_AMOUNT_NAIRA);

    const clarifyingQuestion = outOfBounds
      ? `That amount looks off — abeg confirm the correct price for this order.`
      : raw.clarifyingQuestion?.trim() || DEFAULT_CLARIFYING_QUESTION;

    return {
      confidence: 'LOW',
      customerName: raw.customerName,
      itemDescription: raw.itemDescription,
      quantity,
      clarifyingQuestion,
      missingFields: raw.missingFields?.length
        ? raw.missingFields
        : missingFields,
    };
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Gemini call timed out after ${ms}ms`)),
          ms,
        ),
      ),
    ]);
  }
}
