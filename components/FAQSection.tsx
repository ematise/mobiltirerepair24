type FAQ = { q: string; a: string };

export default function FAQSection({ faqs }: { faqs: FAQ[] }) {
  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-semibold text-slate-900 mb-5">
        Frequently Asked Questions
      </h2>
      <dl className="flex flex-col gap-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border border-slate-200 rounded-lg p-5 bg-white"
          >
            <dt className="font-semibold text-slate-900 text-base">{faq.q}</dt>
            <dd className="mt-2 text-slate-600 text-sm leading-relaxed">{faq.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
