// FRONTEND/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import BackgroundSlideshow from '@/components/Bgslideshow';
import { useNavigate } from 'react-router-dom';
import {
  Leaf,
  Tractor,
  Users,
  Factory,
  Package,
  BarChart3,
  ChevronRight
} from 'lucide-react';

const VIDEO_DURATION = 4000;

const HomePage = () => {
  const [showVideo, setShowVideo] = useState(true);
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setShowVideo(false), VIDEO_DURATION);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showVideo) {
      setFade(true);
      const t = setTimeout(() => setFade(false), 1000);
      return () => clearTimeout(t);
    }
  }, [showVideo]);

  return (
    <div className="min-h-screen bg-base-200 relative overflow-hidden font-sans">
      {/* Background: intro video then slideshow */}
      <video
        src="/teacup.mp4"
        autoPlay
        muted
        playsInline
        className={`fixed inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${
          showVideo ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Intro video of tea and plantation"
      />
      <div
        className={`fixed inset-0 w-full h-full z-0 transition-opacity duration-1000 ${
          showVideo || fade ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden={showVideo || fade}
      >
        <BackgroundSlideshow />
        {/* subtle dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* HERO */}
        <section className="flex flex-col items-center justify-center h-[80vh] text-center px-6">
          <img
            src="favicon.png"
            alt="CeylonLeaf logo"
            className="w-24 md:w-28 mb-6 animate-fade-in drop-shadow"
          />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-lg animate-fade-in">
            CeylonLeaf
          </h1>
          <p className="text-white/85 text-lg md:text-2xl max-w-3xl mt-4 md:mt-6 animate-fade-in-slow">
            Smart tools for tea estates — from field planning and worker
            management to <span className="font-semibold">harvest tracking</span> and
            seamless <span className="font-semibold">handover to the factory</span>.
          </p>

          <div className="flex items-center gap-3 mt-10 animate-fade-in-slow">
            <button
              className="btn btn-primary px-7"
              onClick={() => navigate('/login')}
            >
              Login
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active Fields', value: '120+' },
              { label: 'Workers Managed', value: '1,500+' },
              { label: 'Daily Harvest (kg)', value: '8,200+' },
              { label: 'Factories Linked', value: '7' }
            ].map((s, i) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4 text-center text-white animate-fade-in"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
                <div className="text-sm md:text-base opacity-80">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Leaf className="w-6 h-6" />}
              title="Fields Management"
              text="Map plots, plan rounds, and monitor yield potential with clear field insights."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Workers"
              text="Assign tasks, track attendance, and review performance in one place."
              delay="150ms"
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Harvests & Reports"
              text="Capture daily plucking, analyze trends, and export clean summaries."
              delay="300ms"
            />
            <FeatureCard
              icon={<Package className="w-6 h-6" />}
              title="Weighing & Bins"
              text="Record weights at collection points and keep inventory tidy."
              delay="450ms"
            />
            <FeatureCard
              icon={<Tractor className="w-6 h-6" />}
              title="Logistics"
              text="Coordinate transport from field sheds to the factory gate smoothly."
              delay="600ms"
            />
            <FeatureCard
              icon={<Factory className="w-6 h-6" />}
              title="Factory Handover"
              text="Generate handover notes and confirm reception at the factory."
              delay="750ms"
            />
          </div>
        </section>

        {/* PROCESS / TIMELINE */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            From Leaf to Factory — Your Daily Flow
          </h2>
          <ol className="relative border-s border-white/20 pl-6 space-y-8">
            <Step
              step="01"
              title="Plan & Assign"
              text="Create rounds by field; assign pluckers and supervisors."
            />
            <Step
              step="02"
              title="Pluck & Record"
              text="Capture plucking per worker; note quality and weather."
            />
            <Step
              step="03"
              title="Weigh & Verify"
              text="Weigh leaves at sheds; auto-sum per field and per truck."
            />
            <Step
              step="04"
              title="Transport"
              text="Schedule trips; track loads and ETA to factory."
            />
            <Step
              step="05"
              title="Factory Handover"
              text="Issue handover note, get digital acknowledgment at the gate."
            />
          </ol>
        </section>

        {/* CALL TO ACTION */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-600/90 to-green-700/90 text-white p-8 md:p-10 shadow-2xl border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold">
                  Ready to streamline your next harvest day?
                </h3>
                <p className="opacity-90 mt-2">
                  Log in to start planning rounds, assigning crews, and handing over to the factory without the paperwork.
                </p>
              </div>
              <button
                className="btn bg-white text-emerald-700 hover:bg-white/90 border-none px-7"
                onClick={() => navigate('/login')}
              >
                Go to Login
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Animations + minor utilities */}
      <style>
        {`
          .animate-fade-in { animation: fadeIn 0.9s ease forwards; opacity: 0; }
          .animate-fade-in-slow { animation: fadeIn 1.4s ease forwards; opacity: 0; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(16px);} to { opacity: 1; transform: translateY(0);} }

          .feature-card { transform: translateY(16px); opacity: 0; animation: riseIn 0.7s ease forwards; }
          @keyframes riseIn { to { transform: translateY(0); opacity: 1; } }

          .delay-150 { animation-delay: 150ms; }
          .delay-300 { animation-delay: 300ms; }
          .delay-450 { animation-delay: 450ms; }
          .delay-600 { animation-delay: 600ms; }
          .delay-750 { animation-delay: 750ms; }

          /* Timeline dots */
          .step-dot {
            position: absolute;
            left: -9px;
            top: 0.35rem;
            width: 14px;
            height: 14px;
            border-radius: 9999px;
            box-shadow: 0 0 0 3px rgba(255,255,255,0.25);
            background: linear-gradient(135deg, #34d399, #10b981);
          }
        `}
      </style>
    </div>
  );
};

/* ---------- small presentational components ---------- */

const FeatureCard = ({ icon, title, text, delay }) => (
  <div
    className={`feature-card rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-6 text-white hover:bg-white/15 transition-colors`}
    style={{ animationDelay: delay || '0ms' }}
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-white/10 border border-white/10">
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>
    <p className="mt-3 text-white/85">{text}</p>
  </div>
);

const Step = ({ step, title, text }) => (
  <li className="relative ms-2">
    <span className="step-dot" aria-hidden />
    <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-5 text-white">
      <div className="flex items-center gap-3">
        <span className="text-emerald-300 font-semibold">{step}</span>
        <h4 className="text-lg md:text-xl font-semibold">{title}</h4>
      </div>
      <p className="mt-1 text-white/85">{text}</p>
    </div>
  </li>
);

export default HomePage;
