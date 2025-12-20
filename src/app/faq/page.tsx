import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Header from "@/components/Landing/header";
import Footer from "@/components/Landing/footer";

export default function FAQPage() {
  const faqs = [
    {
      question: "What is your return policy?",
      answer: "We offer a 14-day return policy. If you're not satisfied with your purchase, you can return it within 14 days of delivery. Items must be in their original condition with all tags and packaging. Please visit our Returns and Refunds page for more details."
    },
    {
      question: "Do you offer free shipping?",
      answer: "Yes! We offer free delivery on all orders. Your order will be shipped using our standard shipping method at no additional cost to you."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-7 business days, depending on your location. You will receive a tracking number once your order has been shipped so you can monitor its progress."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, Klarna, Shop Pay, and various other payment methods. All payments are processed securely through our encrypted payment gateway."
    },
    {
      question: "Do you offer a warranty?",
      answer: "Yes, all our products come with a 1-year warranty covering manufacturing defects. Please visit our Terms of Warranty page for complete warranty details and coverage information."
    },
    {
      question: "Can I try on glasses virtually?",
      answer: "Yes! We offer a Virtual Try-On feature that allows you to see how our glasses look on you before making a purchase. Simply use the camera on your device to try on different frames."
    },
    {
      question: "What if my glasses don't fit?",
      answer: "If your glasses don't fit properly, you can return them within 14 days for a full refund or exchange. We recommend using our Virtual Try-On feature before purchasing to ensure the best fit."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to many countries worldwide. Shipping times and costs may vary by location. Please check our shipping information during checkout for details specific to your country."
    },
    {
      question: "How do I track my order?",
      answer: "Once your order has been shipped, you will receive an email with a tracking number. You can use this tracking number on the carrier's website to monitor your package's progress."
    },
    {
      question: "Can I cancel my order?",
      answer: "You can cancel your order if it hasn't been shipped yet. Please contact our customer service team as soon as possible. Once an order has been shipped, you'll need to use our return process instead."
    },
    {
      question: "What is your customer service contact information?",
      answer: "You can reach our customer service team through the contact form on our website, or by email. We typically respond within 24-48 hours during business days."
    },
    {
      question: "Are your products authentic?",
      answer: "Absolutely! We are an authorized retailer and guarantee that all our products are 100% authentic. We source directly from manufacturers and authorized distributors."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-36 sm:pt-40 bg-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-center">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Find answers to common questions about our products, shipping, returns, and more.
            </p>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-border rounded-lg px-6 bg-card"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 p-6 bg-muted rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
              <p className="text-muted-foreground mb-4">
                Can't find the answer you're looking for? Please get in touch with our friendly team.
              </p>
              <a 
                href="/contact" 
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

