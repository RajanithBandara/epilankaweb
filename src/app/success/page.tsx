import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

function SuccessPage() {
    return (
        <main className="relative min-h-screen overflow-hidden bg-[#f0f4ff] px-4 py-10 sm:px-6">
            <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-6 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl" />

            <section className="relative mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
                <div className="w-full rounded-3xl border border-blue-100/80 bg-white/90 p-6 shadow-xl shadow-blue-200/40 backdrop-blur-sm sm:p-10">
                      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-[#1e3a8a] via-[#1e40af] to-[#0c7bb3] text-white shadow-lg shadow-blue-400/30">
                        <CheckCircle2 className="h-7 w-7" />
                    </div>

                    <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Account Verified
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-600 sm:text-base">
                        Your signup is complete and your access has been activated. Continue to the dashboard to start tracking outbreaks and insights.
                    </p>

                    <div className="mx-auto mt-7 flex max-w-xl items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-blue-900">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">
                            Your session is protected with Appwrite authentication and secure cookies.
                        </p>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <Button
                            asChild
                            size="lg"
                            className="rounded-xl bg-linear-to-r from-[#1e3a8a] via-[#1e40af] to-[#0c7bb3] px-8 text-white shadow-lg shadow-blue-400/30 hover:from-[#1d377f] hover:via-[#1d3f9e] hover:to-[#0b6fa1]"
                        >
                            <Link href="/dashboard" className="inline-flex items-center gap-2">
                                Go to Dashboard
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default SuccessPage;