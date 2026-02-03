import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NameResult } from '@/src/services/name.service';

const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("正在分析姓氏特点...");
  const [names, setNames] = useState<NameResult[]>([]);

  useEffect(() => {
    // 从 location.state 获取真实 AI 结果
    if (location.state?.names) {
      setNames(location.state.names);
      // 模拟进度条
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(() => {
              navigate('/results', { state: { names } });
            }, 500);
            return 100;
          }

          // Update text based on progress
          if (prev === 30) setStatusText("正在查阅诗词典故...");
          if (prev === 70) setStatusText("正在筛选最佳组合...");
          if (prev === 90) setStatusText("AI 正在深度计算中...");

          return prev + 1;
        });
      }, 40); // Approx 4 seconds total

      return () => clearInterval(timer);
    } else {
      // 没有结果，返回输入页
      console.error('没有起名结果');
      navigate('/input');
    }
  }, [location.state, navigate, names]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#FFF9F6] to-[#FFE4E9] px-6">

      {/* Central Illustration Area */}
      <div className="relative flex items-center justify-center mb-12">
        <div className="absolute w-72 h-72 rounded-full border-2 border-primary/10 animate-pulse"></div>
        <div className="absolute w-64 h-64 rounded-full border border-primary/20"></div>

        <div className="relative z-10 w-56 h-56 flex items-center justify-center bg-white rounded-full shadow-2xl border-4 border-white overflow-hidden">
           <div className="flex flex-col items-center">
             <div className="relative">
                <span className="material-symbols-outlined text-8xl text-primary scale-110">child_care</span>
                <div className="absolute -top-2 -right-4 animate-bounce">
                  <span className="material-symbols-outlined text-cyan-400 text-4xl filled-icon">auto_awesome</span>
                </div>
             </div>
             <div className="mt-1 animate-pulse">
                <span className="material-symbols-outlined text-primary/80 text-3xl filled-icon">favorite</span>
             </div>
           </div>
        </div>

        {/* Floating decorations */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary/20 rounded-full animate-bounce delay-75"></div>
        <div className="absolute -bottom-4 -left-2 w-12 h-12 bg-cyan-400/20 rounded-full animate-bounce delay-150"></div>
      </div>

      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-[#4E342E]">
        AI正在为您精心起名...
      </h2>

      {/* Dynamic Status Tag */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-2 bg-white px-6 py-2.5 rounded-full shadow-md border border-primary/30">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <p className="text-primary font-bold text-lg tracking-wide">
            {statusText}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[300px] mb-12">
        <div className="mb-3 flex justify-between px-1">
          <span className="text-sm font-bold text-[#795548]">起名进度</span>
          <span className="text-sm font-black text-primary">{progress}%</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-white p-1 shadow-sm border border-primary/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-pink-300 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="flex flex-col items-center gap-4 w-full max-w-[280px]">
        <div className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-white border border-primary/20 shadow-sm">
           <span className="text-sm text-[#5D4037] font-bold">正在查阅诗词典故...</span>
        </div>
        <div className="flex items-center justify-center w-full px-4 py-3 rounded-xl bg-white/40">
           <span className="text-sm text-[#A1887F] font-medium">正在筛选最佳组合...</span>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="p-10 text-center mt-auto">
        <div className="inline-block px-8 py-5 rounded-3xl bg-white/80 shadow-lg border border-white">
          <p className="text-[15px] text-[#6D4C41] leading-relaxed font-semibold">
            温馨提示：为了呈现最佳寓意<br/>
            <span className="text-primary">AI 正在深度计算中</span>，好名字值得片刻等待
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoadingPage;
