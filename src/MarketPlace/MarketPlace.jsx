import React from "react";

const MetalMarket = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Subtle Grid Background Pattern */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          size: "40px 40px",
          backgroundSize: "40px 40px",
        }}
      ></div>

      <div className="relative z-10 w-full max-w-7xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-3xl overflow-hidden border border-slate-200">
        {/* Top Accent Bar */}
        <div className="h-1.5 w-full bg-blue-800"></div>

        <div className="p-8 md:p-16 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Branding & Value Prop */}
          <header>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-800"></span>
              </span>
              Enterprise Access Only
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-[0.9]">
              HEAVY
              <br />
              METALS
              <br />
              <span className="text-blue-800">MARKET.</span>
            </h1>

            <p className="mt-8 text-xl text-slate-500 leading-relaxed max-w-sm">
              The next-generation clearinghouse for industrial-grade raw
              materials.
              <span className="font-semibold text-slate-800">
                {" "}
                Institutional liquidity meets digital precision.
              </span>
            </p>
          </header>

          {/* Right Column: CTA & Info */}
          <section className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                Availability
              </h3>
              <p className="text-2xl font-bold text-slate-800">
                Global Launch Q3 2026
              </p>
              <div className="w-full bg-slate-200 h-1 mt-4 rounded-full overflow-hidden">
                <div className="bg-blue-800 h-full w-3/4"></div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {["T+0 Instant Settlement", "Verified Tier-1 Suppliers"].map(
                (feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-slate-600 font-medium"
                  >
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </div>
                ),
              )}
            </div>

            <form className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="corporate@company.com"
                className="w-full px-5 py-4 rounded-xl border border-slate-300 focus:ring-4 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <button className="w-full bg-slate-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-slate-200">
                Request Early Access
              </button>
            </form>
          </section>
        </div>

        {/* Footer Ticker */}
        <footer className="bg-slate-900 px-8 py-4 flex flex-wrap justify-between items-center gap-4 text-[10px] md:text-xs font-mono tracking-tighter text-slate-400">
          <div className="flex gap-8">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 uppercase">Iron Ore (FE)</span>
              <span className="text-emerald-400 font-bold">$112.40 +2.1%</span>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-8">
              <span className="text-slate-500 uppercase">Copper (HG)</span>
              <span className="text-rose-400 font-bold">$8,432.50 -0.4%</span>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-800 pl-8">
              <span className="text-slate-500 uppercase">Alu (AL)</span>
              <span className="text-slate-300 font-bold">$2,241.00 0.0%</span>
            </div>
          </div>
          <div className="text-slate-500 uppercase hidden md:block">
            Market Status:{" "}
            <span className="text-emerald-500">Live LME Feed</span>
          </div>
        </footer>
      </div>

      {/* Trust Tagline */}
      <p className="mt-8 text-slate-400 text-sm font-medium">
        Regulated industrial trading platform. Secure. Encrypted. Direct.
      </p>
    </div>
  );
};

export default MetalMarket;
