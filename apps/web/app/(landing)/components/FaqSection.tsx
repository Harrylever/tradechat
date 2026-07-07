import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    question: 'What is Tradechat?',
    answer:
      'Tradechat turns your WhatsApp into a full payment terminal powered by Nomba. It allows customers to order and pay directly within chat without downloading an app or creating an account.',
  },
  {
    question: 'Do my customers need to download a separate app?',
    answer:
      'No! Your customers stay 100% inside WhatsApp. When they are ready to pay, our AI instantly generates a secure Nomba checkout link right inside the chat.',
  },
  {
    question: 'How fast do I receive my funds?',
    answer:
      'Payments are processed instantly through Nomba. Once a customer completes checkout, you receive a real-time notification in WhatsApp and the funds are added to your merchant balance immediately.',
  },
  {
    question: 'How do I connect my WhatsApp to Tradechat?',
    answer:
      'Simply sign in to your merchant dashboard, connect your WhatsApp Business account or phone number with our 1-click integration, and you are ready to start accepting payments!',
  },
  {
    question: 'Are the payment links secure?',
    answer:
      'Yes, all payment links are generated via Nomba enterprise-grade, PCI-DSS compliant checkout system, ensuring complete security for you and your customers.',
  },
]

export function FaqSection() {
  return (
    <section id="faqs" className="mx-auto max-w-4xl px-6 py-24 md:px-12">
      <h2 className="font-heading mb-4 text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
        Frequently Asked Questions
      </h2>
      <p className="mx-auto mb-16 max-w-lg text-center text-base text-slate-400">
        Everything you need to know about accepting payments on WhatsApp with
        Tradechat.
      </p>

      <div className="mx-auto max-w-2xl">
        <Accordion
          type="single"
          collapsible
          className="border-white/10 bg-[#111827]/60 shadow-xl shadow-emerald-500/5 backdrop-blur-xl"
        >
          {FAQS.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-white/10 px-4 data-open:bg-white/5"
            >
              <AccordionTrigger className="py-5 text-left text-base font-medium text-white hover:text-[#4EDEA3] hover:no-underline md:text-lg">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-slate-400 md:text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
