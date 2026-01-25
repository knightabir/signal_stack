import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const FAQS = [
  {
    question: 'Can I change plans at any time?',
    answer:
      'Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the change is instant and you will be charged the prorated amount. If you downgrade, the change will take effect at the end of your current billing cycle.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards (Visa, Mastercard, American Express) via our secure payment processor, Stripe. For annual Business plans, we can also support invoice-based bank transfers upon request.',
  },
  {
    question: 'Do you offer a refund policy?',
    answer:
      "We offer a 14-day money-back guarantee for all new Pro and Business subscriptions. If you're not satisfied with Signalstack for any reason, reach out to our support team and we'll process a full refund.",
  },
  {
    question: 'What happens when I reach my plan limits?',
    answer:
      "You'll still be able to access your account, but you won't be able to collect new feedback beyond your limit. We'll notify you via email when you're approaching your limits so you can upgrade if needed.",
  },
  {
    question: 'How do I cancel my subscription?',
    answer:
      'You can cancel your subscription at any time from the billing portal. Your account will remain on the paid plan until the end of your current billing period, after which it will be downgraded to the Free plan.',
  },
];

export default function BillingFAQ() {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Frequently Asked Questions</h3>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-zinc-100 dark:border-zinc-800">
                <AccordionTrigger className="text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:no-underline font-medium">
                {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {faq.answer}
                </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
