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

export interface ExtractedOnboarding {
  confidence: 'HIGH' | 'LOW';
  ownerName?: string;
  businessName?: string;
  productCategory?: string;
  clarifyingQuestion?: string;
  /** Which required fields Gemini (or our validator) couldn't confidently fill. */
  missingFields?: string[];
}

// Sanity bounds for a single WhatsApp-originated transaction.
// Anything outside this range gets forced to LOW confidence regardless
// of what the model reports, since a misparse here creates a real
// payment link for the wrong amount.
const MIN_AMOUNT_NAIRA = 100;
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

  async parseOnboardingMessage(
    messageText: string,
  ): Promise<ExtractedOnboarding> {
    this.logger.log(
      `Parsing onboarding message with Gemini: "${messageText}"`,
      'GeminiService',
    );

    if (!this.ai) {
      return {
        confidence: 'LOW',
        clarifyingQuestion: "Oya let's set you up! First — wetin be your name?",
        missingFields: ['ownerName', 'businessName', 'productCategory'],
      };
    }

    const systemPrompt = `You are TradeChat AI, helping Nigerian market traders set up their business profile on WhatsApp.
Analyze the user message and extract onboarding details: ownerName, businessName, and productCategory.

The user may be filling in a template that uses square brackets to mark where an answer goes, e.g.:
"My name is [John]\nMy business is [Ade Stores]\nI sell [shoes]"
If a bracketed field contains a REAL answer (like "[John]" or "[Ade Stores]"), extract it WITHOUT the brackets.
If a bracketed field still contains the literal unfilled placeholder text (e.g. "[Your Name]", "[Business Name]", "[What You Sell]" — case-insensitive), treat that specific field as NOT PROVIDED. Do not invent a value for it, and do not let one unfilled field cause you to discard other fields the user DID fill in.

Classify the described product or service into EXACTLY ONE of the following productCategory enum values:
- FOOD_AND_GROCERIES (e.g., rice, provisions, foodstuff, drinks, snacks)
- FASHION_AND_APPAREL (e.g., clothes, shoes, bags, boutique, tailoring, fabric)
- ELECTRONICS_AND_GADGETS (e.g., phones, laptops, accessories, repairs, electronics)
- BEAUTY_AND_PERSONAL_CARE (e.g., makeup, perfumes, skincare, salon, hair, cosmetics)
- HOME_AND_LIVING (e.g., furniture, kitchenware, bedding, home decor, utensils)
- SERVICES (e.g., laundry, photography, design, consulting, delivery, logistics)
- OTHER (for anything genuinely ambiguous or unlisted; never invent a new category value)

Only set confidence to "HIGH" if ownerName AND businessName AND productCategory are all clearly present or inferable (after excluding unfilled placeholder fields as described above).
If any required field is missing or still an unfilled placeholder, set confidence to "LOW", list the missing fields in missingFields (using the keys: ownerName, businessName, productCategory), and provide a natural, friendly Nigerian English/Pidgin clarifyingQuestion asking for the FIRST missing detail only (e.g., "What's your name?" or "What is your business called?" or "Wetin you dey sell?").`;

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
                ownerName: { type: Type.STRING },
                businessName: { type: Type.STRING },
                productCategory: {
                  type: Type.STRING,
                  enum: [
                    'FOOD_AND_GROCERIES',
                    'FASHION_AND_APPAREL',
                    'ELECTRONICS_AND_GADGETS',
                    'BEAUTY_AND_PERSONAL_CARE',
                    'HOME_AND_LIVING',
                    'SERVICES',
                    'OTHER',
                  ],
                },
                clarifyingQuestion: { type: Type.STRING },
                missingFields: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
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
        `Gemini API call failed for onboarding: ${error.message}`,
        error.stack,
        'GeminiService',
      );
      return {
        confidence: 'LOW',
        clarifyingQuestion: "Oya let's set you up! First — wetin be your name?",
        missingFields: ['ownerName', 'businessName', 'productCategory'],
      };
    }

    let parsed: ExtractedOnboarding;
    try {
      parsed = JSON.parse(responseText);
    } catch (error: any) {
      this.logger.error(
        `Failed to parse Gemini JSON onboarding response: ${error.message}. Raw response: ${responseText}`,
        error.stack,
        'GeminiService',
      );
      return {
        confidence: 'LOW',
        clarifyingQuestion: "Oya let's set you up! First — wetin be your name?",
        missingFields: ['ownerName', 'businessName', 'productCategory'],
      };
    }

    const validated = this.validateAndNormalizeOnboarding(parsed);

    this.logger.log(
      `Parsed onboarding result: ${JSON.stringify(validated)}`,
      'GeminiService',
    );

    return validated;
  }

  async classifyProductCategory(text: string): Promise<string> {
    const lower = text.toLowerCase();
    if (
      lower.includes('food') ||
      lower.includes('rice') ||
      lower.includes('drink') ||
      lower.includes('snack') ||
      lower.includes('provision') ||
      lower.includes('grocery')
    )
      return 'FOOD_AND_GROCERIES';
    if (
      lower.includes('cloth') ||
      lower.includes('shoe') ||
      lower.includes('bag') ||
      lower.includes('fashion') ||
      lower.includes('wear') ||
      lower.includes('boutique') ||
      lower.includes('tailor') ||
      lower.includes('dress') ||
      lower.includes('shirt')
    )
      return 'FASHION_AND_APPAREL';
    if (
      lower.includes('phone') ||
      lower.includes('laptop') ||
      lower.includes('electronic') ||
      lower.includes('gadget') ||
      lower.includes('repair') ||
      lower.includes('accessory') ||
      lower.includes('screen') ||
      lower.includes('charger')
    )
      return 'ELECTRONICS_AND_GADGETS';
    if (
      lower.includes('makeup') ||
      lower.includes('perfume') ||
      lower.includes('beauty') ||
      lower.includes('hair') ||
      lower.includes('salon') ||
      lower.includes('skin') ||
      lower.includes('cosmetic') ||
      lower.includes('spray') ||
      lower.includes('nail')
    )
      return 'BEAUTY_AND_PERSONAL_CARE';
    if (
      lower.includes('furniture') ||
      lower.includes('home') ||
      lower.includes('kitchen') ||
      lower.includes('bed') ||
      lower.includes('decor') ||
      lower.includes('utensil')
    )
      return 'HOME_AND_LIVING';
    if (
      lower.includes('service') ||
      lower.includes('laundry') ||
      lower.includes('photo') ||
      lower.includes('design') ||
      lower.includes('deliver') ||
      lower.includes('logistics') ||
      lower.includes('consult')
    )
      return 'SERVICES';

    if (!this.ai) return 'OTHER';

    try {
      const response = await this.withTimeout(
        this.ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: `Classify the following product or service description from a Nigerian trader into exactly one of these enum values:
FOOD_AND_GROCERIES, FASHION_AND_APPAREL, ELECTRONICS_AND_GADGETS, BEAUTY_AND_PERSONAL_CARE, HOME_AND_LIVING, SERVICES, OTHER.
If ambiguous or unlisted, return OTHER.
Description: "${text}"`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  enum: [
                    'FOOD_AND_GROCERIES',
                    'FASHION_AND_APPAREL',
                    'ELECTRONICS_AND_GADGETS',
                    'BEAUTY_AND_PERSONAL_CARE',
                    'HOME_AND_LIVING',
                    'SERVICES',
                    'OTHER',
                  ],
                },
              },
              required: ['category'],
            },
          },
        }),
        GEMINI_TIMEOUT_MS,
      );
      const parsed = JSON.parse(response.text || '{}');
      return parsed.category || 'OTHER';
    } catch {
      return 'OTHER';
    }
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

  private validateAndNormalizeOnboarding(
    raw: ExtractedOnboarding,
  ): ExtractedOnboarding {
    const validCategories = [
      'FOOD_AND_GROCERIES',
      'FASHION_AND_APPAREL',
      'ELECTRONICS_AND_GADGETS',
      'BEAUTY_AND_PERSONAL_CARE',
      'HOME_AND_LIVING',
      'SERVICES',
      'OTHER',
    ];

    const hasOwner =
      typeof raw.ownerName === 'string' && raw.ownerName.trim().length > 0;
    const hasBusiness =
      typeof raw.businessName === 'string' &&
      raw.businessName.trim().length > 0;
    const hasCategory =
      typeof raw.productCategory === 'string' &&
      validCategories.includes(raw.productCategory.trim());

    if (raw.confidence === 'HIGH' && hasOwner && hasBusiness && hasCategory) {
      return {
        confidence: 'HIGH',
        ownerName: raw.ownerName!.trim(),
        businessName: raw.businessName!.trim(),
        productCategory: raw.productCategory!.trim(),
      };
    }

    const missingFields: string[] = [];
    if (!hasOwner) missingFields.push('ownerName');
    if (!hasBusiness) missingFields.push('businessName');
    if (!hasCategory) missingFields.push('productCategory');

    let clarifyingQuestion =
      raw.clarifyingQuestion?.trim() ||
      "Oya let's set you up! First — wetin be your name?";

    if (!hasOwner) {
      clarifyingQuestion = "Oya let's set you up! First — wetin be your name?";
    } else if (!hasBusiness) {
      const owner = raw.ownerName ? raw.ownerName.trim() : 'trader';
      clarifyingQuestion = `Nice one, ${owner}! Wetin your business dey called?`;
    } else if (!hasCategory) {
      clarifyingQuestion =
        'Got it. So wetin you dey sell — fashion, food, electronics, beauty products, home stuff, or services?';
    }

    return {
      confidence: 'LOW',
      ownerName: raw.ownerName?.trim() || undefined,
      businessName: raw.businessName?.trim() || undefined,
      productCategory: hasCategory ? raw.productCategory!.trim() : undefined,
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
