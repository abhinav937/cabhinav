import React from 'react';
import { Zap, Cpu, Wrench, BookOpen, Activity, Code } from 'lucide-react';

export const BentoGrid: React.FC = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="features">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">

        {/* Large Card */}
        <div className="md:col-span-2 row-span-1 bg-surface border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors duration-700 pointer-events-none"></div>
          <div className="h-full flex flex-col justify-between relative z-10">
            <div className="bg-white/5 w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-medium text-primary mb-2">Power Electronics Research</h3>
              <p className="text-secondary max-w-sm">Specializing in GaN inverters, solid-state circuit breakers, and Marx generators for next-generation power systems.</p>
            </div>
          </div>
        </div>

        {/* Tall Card */}
        <div className="md:col-span-1 md:row-span-2 bg-surface border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors group relative overflow-hidden flex flex-col justify-between">
           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
           <div className="relative z-10">
            <div className="bg-white/5 w-10 h-10 rounded-lg flex items-center justify-center text-white mb-6">
               <Cpu size={20} />
             </div>
             <h3 className="text-xl font-medium text-primary mb-2">Embedded Systems</h3>
             <p className="text-secondary text-sm leading-relaxed mb-6">
               FPGA-based control systems and high-frequency power conversion. Experience with Annapurna Labs hardware engineering.
             </p>
             <div className="w-full bg-neutral-800 h-32 rounded-lg overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                {/* Abstract graphic */}
                <svg className="w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-white"/>
                </svg>
             </div>
           </div>
        </div>

        {/* Small Card 1 */}
        <div className="bg-surface border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors group">
          <div className="bg-white/5 w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4">
            <Wrench size={20} />
          </div>
          <h3 className="text-lg font-medium text-primary mb-1">PCB Design</h3>
          <p className="text-sm text-secondary">High-frequency board design and layout optimization.</p>
        </div>

        {/* Small Card 2 */}
        <div className="bg-surface border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors group">
          <div className="bg-white/5 w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4">
            <BookOpen size={20} />
          </div>
          <h3 className="text-lg font-medium text-primary mb-1">Publications</h3>
          <p className="text-sm text-secondary">Research in WEMPEC and IEEE conferences.</p>
        </div>

        {/* Small Card 3 */}
        <div className="bg-surface border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors group">
          <div className="bg-white/5 w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4">
            <Activity size={20} />
          </div>
          <h3 className="text-lg font-medium text-primary mb-1">Running</h3>
          <p className="text-sm text-secondary">Strava athlete tracking endurance and performance.</p>
        </div>

        {/* Small Card 4 */}
        <div className="bg-surface border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors group">
          <div className="bg-white/5 w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4">
            <Code size={20} />
          </div>
          <h3 className="text-lg font-medium text-primary mb-1">Software</h3>
          <p className="text-sm text-secondary">Control algorithms and data analysis tools.</p>
        </div>

      </div>
    </section>
  );
};
