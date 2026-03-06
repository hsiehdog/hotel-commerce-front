"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  MessageSquare,
  PhoneCall,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const heroHighlights = [
  "Shift more bookings from Expedia and Booking.com to direct",
  "Reduce missed price-and-availability calls with 24/7 AI voice",
  "Increase booking value with guided room upgrades and add-ons",
  "Give guests faster answers across web, phone, chat, and SMS",
];

const setupSteps = [
  {
    step: "01",
    title: "Connect PMS and booking data",
    description:
      "Plug into Opera, Cloudbeds, and similar PMS workflows without asking your team to rip and replace core systems.",
  },
  {
    step: "02",
    title: "Configure offers and reservation flows",
    description:
      "Set room recommendations, upsells, call handling, and messaging prompts around your property's booking strategy.",
  },
  {
    step: "03",
    title: "Launch channel by channel",
    description:
      "Start with web, voice, or messaging first, then expand once the direct-booking motion is working for your team.",
  },
];

const setupProofPoints = [
  "Live in days, not months",
  "Minimal lift for your front-desk team",
  "Start with one channel and expand over time",
];

const directRevenueProblems = [
  "Guests abandon when room choices are hard to compare",
  "Front desk teams miss booking calls during busy shifts and after hours",
  "Direct channels fail to upsell like OTAs do",
  "Reservation conversations break across phone, site, and messaging",
  "Hotels pay too much blended CPA because direct conversion stays weak",
];

const roleCards = [
  {
    title: "Revenue Manager",
    description:
      "Turn the booking flow into a stronger merchandising channel instead of a flat rate grid.",
    icon: TrendingUp,
    outcomes: [
      "Dynamic upsells for late checkout, parking, spa credit, and breakfast",
      "Better merchandising during the booking flow",
      "Higher ADR and ancillary capture from existing direct demand",
    ],
  },
  {
    title: "Front Office Manager",
    description:
      "Reduce repetitive reservation work so staff can focus on in-house guests and higher-value conversations.",
    icon: PhoneCall,
    outcomes: [
      "Fewer repetitive price-and-availability calls",
      "AI voice answers instantly and supports multiple languages",
      "Less time spent triaging basic reservation questions",
    ],
  },
  {
    title: "Owner / Operator",
    description:
      "Improve the economics of direct booking without adding more headcount to the desk.",
    icon: Building2,
    outcomes: [
      "Shift more share from OTAs to direct",
      "Lower blended cost per acquisition",
      "Capture more revenue from demand you already have",
    ],
  },
];

const bookingFlowBenefits = [
  "Recommend the best-fit room instead of showing a confusing matrix of rates",
  "Present upgrade options in plain language guests can act on quickly",
  "Offer add-ons like late checkout, breakfast, and spa credit at the right moment",
  "Reduce friction between discovery, decision, and completed booking",
];

const bookingSteps = [
  "Discover stay dates and traveler intent",
  "Recommend the best-fit room",
  "Offer a clear upgrade path",
  "Add high-intent ancillaries",
  "Complete the booking",
];

const voiceCapabilities = [
  "Answer price and availability questions instantly",
  "Handle common booking and property questions",
  "Support multilingual callers without adding staff coverage",
  "Guide callers toward a completed reservation",
];

const transcriptMessages = [
  {
    speaker: "Guest",
    meta: "Web chat",
    body: "Do you have rooms available this weekend for two adults?",
    side: "left" as const,
  },
  {
    speaker: "CommerceCo AI",
    meta: "Instant reply",
    body: "Yes. I can recommend a Deluxe King at $259 or a Junior Suite at $329. Are you looking for the best value or more space?",
    side: "right" as const,
  },
  {
    speaker: "Guest",
    meta: "Follow-up",
    body: "Best value. Do you offer late checkout or breakfast?",
    side: "left" as const,
  },
  {
    speaker: "CommerceCo AI",
    meta: "Upsell",
    body: "The Deluxe King is the best fit. I can add breakfast for two and late checkout now so the guest can book in one step.",
    side: "right" as const,
  },
];

type TranscriptMessage = (typeof transcriptMessages)[number];

function AnimatedTranscript() {
  const [visibleCount, setVisibleCount] = useState(1);
  const [typingMessage, setTypingMessage] = useState<TranscriptMessage | null>(null);

  useEffect(() => {
    const timeouts: number[] = [];

    const scheduleLoop = () => {
      setVisibleCount(1);
      setTypingMessage(null);

      let elapsed = 1400;

      transcriptMessages.slice(1).forEach((message, index) => {
        const isAiMessage = message.side === "right";

        if (isAiMessage) {
          const typingTimeout = window.setTimeout(() => {
            setTypingMessage(message);
          }, elapsed);
          timeouts.push(typingTimeout);
          elapsed += 900;
        }

        const revealTimeout = window.setTimeout(() => {
          setTypingMessage((current) => (current === message ? null : current));
          setVisibleCount(index + 2);
        }, elapsed);

        timeouts.push(revealTimeout);
        elapsed += 1400;
      });

      const restartTimeout = window.setTimeout(scheduleLoop, elapsed + 2200);
      timeouts.push(restartTimeout);
    };

    scheduleLoop();

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  const visibleMessages = transcriptMessages.slice(0, visibleCount);

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex min-h-[27.5rem] flex-col justify-start gap-3">
      {visibleMessages.map((message) => (
        <div
          key={`${message.speaker}-${message.body}`}
          className={`animate-in fade-in-0 slide-in-from-bottom-2 duration-500 flex ${
            message.side === "right" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[88%] rounded-3xl px-4 py-3 ${
              message.side === "right"
                ? "bg-slate-950 text-white"
                : "bg-white text-slate-800"
            }`}
          >
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                message.side === "right" ? "text-slate-300" : "text-slate-500"
              }`}
            >
              {message.speaker} • {message.meta}
            </p>
            <p className="mt-2 text-sm leading-6">{message.body}</p>
          </div>
        </div>
      ))}

      {typingMessage ? (
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 flex justify-end">
          <div className="max-w-[72%] rounded-3xl bg-slate-900 px-4 py-3 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
              CommerceCo AI • Typing
            </p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-300 animate-pulse" />
              <span
                className="size-2 rounded-full bg-slate-300 animate-pulse"
                style={{ animationDelay: "120ms" }}
              />
              <span
                className="size-2 rounded-full bg-slate-300 animate-pulse"
                style={{ animationDelay: "240ms" }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div
        className={`pt-1 transition-all duration-500 ${
          visibleCount === transcriptMessages.length
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        } flex justify-end`}
      >
        <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950">
          Continue to booking
        </div>
      </div>
      </div>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-white/70 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-emerald-900"
    >
      {children}
    </Badge>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl space-y-4">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h2>
        <p className="text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
      </div>
    </div>
  );
}

function DemoButton({ className }: { className?: string }) {
  return (
    <Button
      asChild
      size="lg"
      className={
        className ??
        "h-11 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
      }
    >
      <Link href="#book-demo">
        Book a Demo
        <ArrowRight className="size-4" />
      </Link>
    </Button>
  );
}

export default function LandingV1Page() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f9fbf5_0%,#f6f0e8_45%,#fffdfa_100%)] text-slate-950">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_42%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_35%)]" />

      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/demo/landings/v1" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">CommerceCo</p>
              <p className="text-xs text-slate-500">Hotel commerce platform</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <Link href="#platform" className="transition hover:text-slate-950">
              Platform
            </Link>
            <Link href="#revenue" className="transition hover:text-slate-950">
              Revenue
            </Link>
            <Link href="#channels" className="transition hover:text-slate-950">
              Channels
            </Link>
          </nav>

          <DemoButton className="h-10 rounded-full bg-slate-950 px-5 text-white hover:bg-slate-800" />
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto grid w-full max-w-7xl gap-14 px-4 pb-18 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24 lg:pt-20">
          <div className="space-y-8">
            <div className="space-y-5">
              <SectionEyebrow>Direct booking growth</SectionEyebrow>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Stop losing high-intent bookings to OTAs.
              </h1>
              <p className="max-w-3xl text-xl leading-8 text-slate-700 sm:text-2xl">
                Automate direct bookings and reservation inquiries with one
                AI-powered commerce platform.
              </p>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                CommerceCo helps hotels capture more direct demand by replacing weak
                booking flows, missed front-desk calls, and fragmented guest
                messaging with a single system across web, voice, chat, and SMS.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {heroHighlights.map((item) => (
                <Card
                  key={item}
                  className="border-white/70 bg-white/75 py-0 shadow-[0_16px_40px_-26px_rgba(15,23,42,0.45)]"
                >
                  <CardContent className="flex items-start gap-3 px-5 py-5">
                    <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <ArrowRight className="size-3.5" />
                    </div>
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <DemoButton />
              <p className="text-sm text-slate-500">
                See how CommerceCo can grow direct bookings and lower OTA dependence
                in a 15-minute walkthrough.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-10 hidden h-28 w-28 rounded-full bg-amber-200/40 blur-3xl lg:block" />
            <div className="absolute -right-4 bottom-10 hidden h-36 w-36 rounded-full bg-emerald-200/40 blur-3xl lg:block" />

            <Card className="overflow-hidden border-slate-200/80 bg-white/90 py-0 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)]">
              <div className="border-b border-slate-200/70 bg-slate-950 px-6 py-5 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                      Guided booking flow
                    </p>
                    <p className="mt-2 text-2xl font-semibold">Recommended stay</p>
                  </div>
                  <Badge className="bg-emerald-400 text-emerald-950 hover:bg-emerald-400">
                    Best fit
                  </Badge>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm text-emerald-800">Recommended room</p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-semibold text-slate-950">Deluxe King</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Flexible rate with breakfast and late checkout available
                      </p>
                    </div>
                    <p className="text-3xl font-semibold text-slate-950">$259</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    ["Ocean View Upgrade", "+$25"],
                    ["Late checkout", "+$35"],
                    ["Breakfast for two", "+$18"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <span className="font-medium text-slate-800">{label}</span>
                      <span className="text-sm text-slate-500">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl bg-slate-100 p-5">
                  <p className="text-sm font-medium text-slate-700">Commerce goals</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Direct booking", "Lower OTA mix", "Higher ADR", "Ancillary revenue"].map(
                      (item) => (
                        <Badge
                          key={item}
                          variant="secondary"
                          className="rounded-full bg-white px-3 py-1 text-slate-700"
                        >
                          {item}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>

                <Button
                  size="lg"
                  className="h-12 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800"
                >
                  Continue to booking
                </Button>
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_22px_50px_-36px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div className="space-y-4">
                <SectionEyebrow>Fast setup</SectionEyebrow>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Integrate with your PMS and launch in days, not months
                </h2>
                <p className="text-base leading-7 text-slate-600">
                  CommerceCo is designed to work alongside Opera, Cloudbeds, and
                  similar PMS workflows so you can improve direct bookings without
                  forcing a disruptive rip-and-replace project.
                </p>
                <div className="grid gap-3">
                  {setupProofPoints.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                      <p className="text-sm leading-6 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {setupSteps.map((item) => (
                  <Card
                    key={item.step}
                    className="border-slate-200/80 bg-white/90 py-0 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.35)]"
                  >
                    <CardContent className="space-y-4 px-5 py-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-800">
                        {item.step}
                      </p>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                        <p className="text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <SectionHeading
              eyebrow="Why direct revenue leaks"
              title="Your direct channel is losing revenue before the guest ever books"
              description="Static booking engines, unanswered reservation intent, and OTA convenience are still outperforming the direct experience at too many hotels."
            />

            <Card className="border-slate-200/80 bg-white/80 py-0 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)]">
              <CardContent className="space-y-6 px-6 py-6">
                <p className="text-base leading-7 text-slate-600">
                  Most hotel booking systems still make the guest do too much work.
                  That friction pushes shoppers toward OTAs and leaves your team
                  handling reservation demand manually.
                </p>
                <div className="grid gap-3">
                  {directRevenueProblems.map((problem) => (
                    <div
                      key={problem}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="mt-1 size-2 rounded-full bg-amber-500" />
                      <p className="text-sm leading-6 text-slate-700">{problem}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-slate-900">
                  Direct booking should feel as easy to buy from as the major travel
                  platforms, and more profitable for the property.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="platform" className="border-y border-slate-200/70 bg-white/60">
          <div className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Built for hotel teams"
              title="A direct-booking platform that maps to the jobs your team actually owns"
              description="CommerceCo is positioned around the operators responsible for conversion, reservation coverage, and channel profitability."
            />

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {roleCards.map((card) => {
                const Icon = card.icon;

                return (
                  <Card
                    key={card.title}
                    className="h-full border-slate-200/80 bg-white/90 py-0 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.4)]"
                  >
                    <CardContent className="flex h-full flex-col gap-5 px-6 py-6">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                        <Icon className="size-5" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-2xl font-semibold text-slate-950">{card.title}</h3>
                        <p className="text-sm leading-6 text-slate-600">
                          {card.description}
                        </p>
                      </div>
                      <div className="grid gap-3">
                        {card.outcomes.map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section id="revenue" className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="Booking flow"
                title="Guide guests to the right room, then surface the right upsell"
                description="CommerceCo replaces a confusing booking matrix with a guided path that helps guests decide faster and spend more confidently."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {bookingFlowBenefits.map((item) => (
                  <div
                    key={item}
                    className="rounded-3xl border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.55)]"
                  >
                    <p className="text-sm font-medium leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[2rem] bg-slate-950 p-7 text-white shadow-[0_26px_70px_-40px_rgba(15,23,42,0.7)]">
                <div className="flex items-center gap-3 text-emerald-300">
                  <TrendingUp className="size-5" />
                  <p className="text-sm font-medium uppercase tracking-[0.2em]">
                    Revenue impact
                  </p>
                </div>
                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-200">
                  The result is stronger direct conversion, higher average booking
                  value, and less dependence on OTA channels to do the heavy lifting
                  for your property.
                </p>
                <div className="mt-6">
                  <DemoButton className="h-11 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100" />
                </div>
              </div>
            </div>

            <Card className="overflow-hidden border-slate-200/80 bg-white/90 py-0 shadow-[0_24px_70px_-42px_rgba(15,23,42,0.45)]">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Booking sequence
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  Simpler path to purchase
                </h3>
              </div>
              <CardContent className="px-6 py-6">
                <div className="grid gap-4">
                  {bookingSteps.map((step, index) => (
                    <div key={step} className="flex items-center gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="font-medium text-slate-800">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="channels"
          className="border-y border-slate-200/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.03),rgba(15,23,42,0.01))]"
        >
          <div className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <SectionHeading
                eyebrow="AI reservations"
                title="Capture reservation demand when your team is busy, offline, or handling in-house guests"
                description="CommerceCo keeps booking intent moving across phone, chat, and messaging so high-intent guests get answers before they drift back to an OTA."
              />

              <div className="grid items-start gap-5 md:grid-cols-2">
                <Card className="border-slate-200/80 bg-white/90 py-0 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)]">
                  <CardContent className="space-y-5 px-6 py-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                      <PhoneCall className="size-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold text-slate-950">Voice</h3>
                      <p className="text-sm leading-6 text-slate-600">
                        AI reservation agents answer the questions that would
                        otherwise pile up at the front desk and guide callers toward
                        booking.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {voiceCapabilities.map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200/80 bg-white/90 py-0 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)]">
                  <CardContent className="space-y-5 px-6 py-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                      <MessageSquare className="size-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold text-slate-950">
                        Chat and messaging
                      </h3>
                      <p className="text-sm leading-6 text-slate-600">
                        Show guests what a direct booking conversation can feel like:
                        immediate answers, room guidance, and upsells in one thread.
                      </p>
                    </div>
                    <AnimatedTranscript />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-10 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)] sm:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Future-ready
              </p>
              <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-700">
                Be ready for conversational discovery without waiting for your
                booking engine to catch up. CommerceCo helps you improve direct
                performance now while preparing for the next generation of guest
                shopping behavior.
              </p>
            </div>
          </div>
        </section>

        <section id="book-demo" className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-10 text-white shadow-[0_30px_80px_-42px_rgba(15,23,42,0.75)] sm:px-10 lg:px-14 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl space-y-4">
                <SectionEyebrow>Final CTA</SectionEyebrow>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  See how your hotel can win more direct bookings and lower OTA
                  dependence
                </h2>
                <p className="text-base leading-7 text-slate-300 sm:text-lg">
                  CommerceCo helps hotels improve direct conversion, automate
                  reservation handling, and increase booking value across every
                  direct guest touchpoint.
                </p>
              </div>

              <div className="space-y-3">
                <DemoButton className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100" />
                <p className="max-w-xs text-sm text-slate-400">
                  15-minute walkthrough of how CommerceCo could fit your PMS,
                  reservation workflow, and direct booking strategy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
