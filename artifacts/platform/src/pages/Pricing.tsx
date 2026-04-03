import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { pricingFaq, pricingTiers } from "@/lib/pricing-data";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%),linear-gradient(180deg,#07130f_0%,#0d1c17_42%,#f7faf9_42%,#f7faf9_100%)] text-foreground">
      <section className="px-6 py-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" /> COSIRI + GMP Platform
            </div>
            <h1 className="mt-6 text-4xl font-display font-bold tracking-tight md:text-6xl">
              Enterprise sustainability and GMP assurance in one workspace.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/78 md:text-lg">
              Launch with COSIRI, GMP, or the combined platform. Pricing is structured and ready, while final commercial figures can be swapped in cleanly without reworking the product.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
                Start workspace <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/18 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12">
                Sign in
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <article
                key={tier.id}
                className={`rounded-3xl border p-7 shadow-sm transition ${tier.highlight ? "border-emerald-300 bg-white ring-2 ring-emerald-200/80" : "border-slate-200 bg-white/96"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{tier.tagline}</p>
                    <h2 className="mt-3 text-2xl font-display font-bold text-slate-950">{tier.name}</h2>
                  </div>
                  {tier.highlight ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      <BadgeCheck className="h-3.5 w-3.5" /> Popular
                    </span>
                  ) : null}
                </div>

                <div className="mt-7">
                  <div className="text-4xl font-display font-bold text-slate-950">{tier.priceLabel}</div>
                  <p className="mt-2 text-sm text-slate-500">{tier.billingLabel}</p>
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-600">{tier.description}</p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.id === "platform-enterprise" ? "/login" : "/register"}
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${tier.highlight ? "bg-slate-950 text-white hover:bg-slate-800" : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"}`}
                >
                  {tier.ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7faf9] px-6 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-slate-950">Commercial rollout notes</h3>
                <p className="text-sm text-slate-500">Built for enterprise procurement and phased deployment</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Annual agreements</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">The platform is set up for annual commercial terms, onboarding windows, and multi-site rollout planning.</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">Billing-ready backend</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Pricing is structured so PayPal-backed plan activation can be added cleanly once final figures are approved.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-slate-950">FAQ</h3>
                <p className="text-sm text-slate-500">Quick answers before launch</p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {pricingFaq.map((item) => (
                <div key={item.question}>
                  <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
