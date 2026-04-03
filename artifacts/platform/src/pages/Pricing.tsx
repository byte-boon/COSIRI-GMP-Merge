import { useState } from "react";
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { comparisonSections, frameworkCards, pricingFaq, pricingTiers } from "@/lib/pricing-data";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function renderComparisonValue(value: string | boolean, highlight = false) {
  if (typeof value === "boolean") {
    return (
      <span className={value ? "text-emerald-400" : "text-slate-500"}>
        {value ? "Yes" : "-"}
      </span>
    );
  }

  return <span className={highlight ? "font-semibold text-amber-300" : "text-slate-100"}>{value}</span>;
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(30,111,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(0,196,224,0.12),_transparent_24%),linear-gradient(180deg,#080c14_0%,#0d1422_50%,#0f1a2e_100%)] text-slate-100">
      <section className="px-6 py-12 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-sky-300">AssessPro by NGSTCO</p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                COSIRI and GMP assessment pricing that scales with the way you assess.
              </h1>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
              Sign in <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
              <Sparkles className="h-3.5 w-3.5" /> Transparent Licensing
            </div>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              AssessPro is designed for auditors, consultants, certification bodies, and in-house teams conducting COSIRI and GMP assessments. Choose a named-assessor licence for a single company or an unlimited portfolio licence for broader programmes.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm text-slate-300">
              {[
                "COSIRI Framework",
                "GMP Assessment",
                "AI-Assisted Scoring",
                "Automated Reports",
                "Benchmarking",
              ].map((chip) => (
                <span key={chip} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                  {chip}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-2 transition ${annual ? "text-slate-400" : "bg-white/10 text-white"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-2 transition ${annual ? "bg-sky-500 text-white" : "text-slate-400"}`}
            >
              Annual
            </button>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
              Save 20%
            </span>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {pricingTiers.map((tier) => {
              const amount = annual ? tier.annualMonthlyEquivalent : tier.monthlyPrice;
              const periodLabel = annual ? "per month equivalent" : "per month";
              return (
                <article
                  key={tier.id}
                  className={`rounded-[28px] border p-8 shadow-[0_24px_60px_rgba(0,0,0,0.24)] transition hover:-translate-y-1 ${tier.highlight ? "border-amber-400/35 bg-[linear-gradient(135deg,rgba(30,58,95,0.96),rgba(22,35,56,0.96))]" : "border-sky-400/20 bg-[linear-gradient(180deg,rgba(15,26,46,0.96),rgba(13,20,34,0.96))]"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] ${tier.highlight ? "border border-amber-400/30 bg-amber-400/10 text-amber-200" : "border border-sky-400/20 bg-sky-400/10 text-sky-200"}`}>
                        {tier.badge}
                      </p>
                      <h2 className="mt-5 font-display text-3xl font-extrabold text-white">{tier.name}</h2>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{tier.tagline}</p>
                    </div>
                    {tier.highlight ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-950">
                        <BadgeCheck className="h-3.5 w-3.5" /> Most Popular
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-8 border-y border-white/8 py-6">
                    <div className="flex items-end gap-2">
                      <span className="font-display text-xl font-bold text-slate-300">$</span>
                      <span className={`font-display text-6xl font-extrabold tracking-tight ${tier.highlight ? "text-amber-300" : "text-white"}`}>
                        {formatPrice(amount)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{periodLabel}</p>
                    {annual ? <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300">{tier.annualBilledLabel}</p> : null}
                    <div className="mt-4 rounded-xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      <span className="font-semibold text-white">Coverage:</span> {tier.companiesLabel}
                    </div>
                  </div>

                  <p className="mt-6 text-sm leading-6 text-slate-300">{tier.description}</p>

                  <ul className="mt-6 space-y-3 text-sm text-slate-200">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${tier.highlight ? "text-amber-300" : "text-sky-300"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.ctaHref}
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${tier.highlight ? "bg-amber-300 text-slate-950 hover:bg-amber-200" : "bg-sky-500 text-white hover:bg-sky-400"}`}
                  >
                    {tier.ctaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            All prices in USD. Monthly and annual billing are available. A 14-day free trial is available for both licences.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-sky-400/15 bg-[rgba(15,26,46,0.92)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
          <h2 className="font-display text-3xl font-extrabold text-white">Compare plans side by side</h2>
          <p className="mt-3 text-sm text-slate-300">Every key feature is laid out clearly so you can choose the right assessment licence.</p>

          <div className="mt-8 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-white/8 text-sm">
              <thead>
                <tr className="bg-white/5 text-left text-slate-300">
                  <th className="px-5 py-4 font-semibold">Feature</th>
                  <th className="px-5 py-4 font-semibold">Solo</th>
                  <th className="px-5 py-4 font-semibold text-amber-300">Unlimited</th>
                </tr>
              </thead>
              <tbody>
                {comparisonSections.map((section) => (
                  <>
                    <tr key={section.title} className="bg-white/[0.03]">
                      <td colSpan={3} className="px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={`${section.title}-${row.feature}`} className="border-t border-white/6">
                        <td className="px-5 py-4 text-slate-300">{row.feature}</td>
                        <td className="px-5 py-4">{renderComparisonValue(row.solo)}</td>
                        <td className="px-5 py-4">{renderComparisonValue(row.unlimited, true)}</td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
          {frameworkCards.map((card) => (
            <article key={card.title} className="rounded-[24px] border border-white/8 bg-[rgba(15,26,46,0.9)] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent === "blue" ? "bg-sky-400/15 text-sky-300" : "bg-amber-300/15 text-amber-300"}`}>
                  {card.accent === "blue" ? <Shield className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">{card.tag}</p>
                  <h3 className="font-display text-2xl font-bold text-white">{card.title}</h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-300">{card.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {card.modules.map((module) => (
                  <span key={module} className="rounded-lg border border-white/8 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                    {module}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 md:px-10 lg:px-16">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[24px] border border-white/8 bg-[rgba(15,26,46,0.9)] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/15 text-sky-300">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">Commercial rollout notes</h3>
                <p className="text-sm text-slate-400">Built for assessors, advisory teams, and industry programmes</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Named assessor licensing</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Each licence is structured around a named assessor, matching the way consultants, certifiers, and in-house teams typically work.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Billing-ready platform</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">The platform is cleaned, authenticated, and env-scaffolded so PayPal-backed billing can be added cleanly as soon as final plan activation is approved.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-[rgba(15,26,46,0.9)] p-7 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-white">FAQ</h3>
                <p className="text-sm text-slate-400">Quick answers before rollout</p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {pricingFaq.map((item) => (
                <div key={item.question}>
                  <p className="text-sm font-semibold text-white">{item.question}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
