import Link from "next/link";
import {
  ArrowRight,
  Bot,
  MessageSquare,
  PhoneCall,
  Sparkles,
  TrendingUp,
  Globe,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const capabilityCards = [
  {
    title: "Web",
    description:
      "Replace static booking grids with a guided shopping flow that helps guests choose the best-fit room faster.",
    icon: Globe,
  },
  {
    title: "Voice",
    description:
      "Use AI reservation agents to answer calls, handle common booking questions, and capture demand around the clock.",
    icon: PhoneCall,
  },
  {
    title: "Chat & SMS",
    description:
      "Let guests ask questions, compare options, and move toward booking in a conversational flow.",
    icon: MessageSquare,
  },
  {
    title: "AI-assisted discovery",
    description:
      "Prepare hotel merchandising and booking logic for the next generation of conversational travel interfaces.",
    icon: Bot,
  },
];

const directRevenueProblems = [
  "Too many room and rate combinations for guests to evaluate",
  "Weak upsell and merchandising flows on direct channels",
  "Reservation calls missed after hours or during busy desk periods",
  "Disconnected guest conversations across channels",
  "Continued reliance on OTAs to provide a better shopping experience",
];

const bookingSteps = [
  "Discover",
  "Recommended room",
  "Upgrade",
  "Add-ons",
  "Book",
];

const voiceCapabilities = [
  "Answer calls instantly",
  "Handle common booking and property questions",
  "Support multiple languages",
  "Guide callers toward a completed reservation",
];

const messagingCapabilities = [
  "Room recommendations",
  "Property answers",
  "Upgrade options",
  "Booking guidance",
];

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
              <SectionEyebrow>Hotel commerce platform</SectionEyebrow>
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Turn more hotel shoppers into direct bookings
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                CommerceCo helps hotels replace outdated booking flows, missed
                reservation calls, and fragmented guest messaging with one modern
                commerce platform across web, voice, chat, SMS, and AI-assisted
                discovery.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Guide guests to the right room faster",
                "Upsell upgrades and add-ons natively",
                "Answer reservation inquiries 24/7 with AI",
                "Create a better direct booking experience on every channel",
              ].map((item) => (
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
                See how CommerceCo can grow direct revenue in a 15-minute walkthrough.
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
                        Flexible rate with late arrival support
                      </p>
                    </div>
                    <p className="text-3xl font-semibold text-slate-950">$259</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {[
                    ["Ocean View", "+$25"],
                    ["Junior Suite", "+$70"],
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
                  <p className="text-sm font-medium text-slate-700">Add-ons</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Parking", "Late checkout", "Spa credit", "Airport transfer"].map(
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

        <section className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <SectionHeading
              eyebrow="Why direct revenue leaks"
              title="Hotels are still using booking technology built for a different era"
              description="Travelers no longer book through a single channel. They discover, compare, and ask questions across hotel websites, phone calls, messaging, and increasingly conversational interfaces."
            />

            <Card className="border-slate-200/80 bg-white/80 py-0 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.35)]">
              <CardContent className="space-y-6 px-6 py-6">
                <p className="text-base leading-7 text-slate-600">
                  Most hotel booking systems were built around static rate grids,
                  not guided selling. That creates friction for guests and leaves
                  revenue on the table.
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
                  Hotels should be able to merchandise and convert direct demand as
                  effectively as the major travel platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="platform" className="border-y border-slate-200/70 bg-white/60">
          <div className="mx-auto w-full max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="One engine, many touchpoints"
              title="One commerce engine for every guest touchpoint"
              description="CommerceCo gives hotels a single platform to present offers, answer booking questions, and convert reservations across direct channels."
            />

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {capabilityCards.map((card) => {
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
                        <h3 className="text-xl font-semibold text-slate-950">{card.title}</h3>
                        <p className="text-sm leading-6 text-slate-600">
                          {card.description}
                        </p>
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
                title="A booking flow built to convert and upsell"
                description="Instead of forcing guests to decode a matrix of rooms and rates, CommerceCo guides them through a simpler path to purchase."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "Show a recommended room first",
                  "Present clear upgrade choices",
                  "Offer relevant add-ons at the right moment",
                  "Move the guest toward booking with less friction",
                ].map((item) => (
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
                  CommerceCo is designed to help hotels improve direct booking
                  conversion, increase average booking value, and generate more
                  revenue from existing demand.
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
                title="Capture demand even when your team is busy or offline"
                description="CommerceCo helps hotels respond to booking intent wherever it appears, whether a guest is calling the property, sending a message, or starting with a conversational interface."
              />

              <div className="grid gap-5 md:grid-cols-2">
                <Card className="border-slate-200/80 bg-white/90 py-0 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)]">
                  <CardContent className="space-y-5 px-6 py-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                      <PhoneCall className="size-5" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-semibold text-slate-950">Voice</h3>
                      <p className="text-sm leading-6 text-slate-600">
                        AI reservation agents answer calls, handle common questions,
                        and keep booking demand moving after hours.
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
                        Guests can start with a simple question and move toward booking
                        with room recommendations, answers, and upgrades.
                      </p>
                    </div>
                    <div className="rounded-3xl bg-slate-950 p-4 text-sm text-slate-100">
                      “Do you have rooms available this weekend?”
                    </div>
                    <div className="grid gap-3">
                      {messagingCapabilities.map((item) => (
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
              </div>
            </div>

            <div className="mt-10 rounded-[2rem] border border-slate-200/80 bg-white/80 p-6 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.35)] sm:p-8">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                Future-ready
              </p>
              <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-700">
                As travel discovery shifts toward conversational experiences,
                CommerceCo helps hotels stay ready to capture demand beyond the
                traditional website flow.
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
                  Win more direct bookings with a modern hotel commerce platform
                </h2>
                <p className="text-base leading-7 text-slate-300 sm:text-lg">
                  CommerceCo helps hotels modernize the booking experience,
                  automate reservation conversations, and grow revenue across
                  direct channels.
                </p>
              </div>

              <div className="space-y-3">
                <DemoButton className="h-12 rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100" />
                <p className="text-sm text-slate-400">
                  15-minute walkthrough. See how CommerceCo could fit your direct
                  booking strategy.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
