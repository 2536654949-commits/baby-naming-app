import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleStartNaming = () => {
    // Check if the app is activated
    const isActivated = localStorage.getItem('AI_BABY_NAMING_ACTIVATED');
    if (isActivated === 'true') {
      navigate('/input');
    } else {
      navigate('/activation');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light">
      <nav className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-lg px-6 py-4 flex items-center">
        <div className="flex items-center gap-2">
           <span className="material-symbols-outlined text-primary text-3xl filled-icon">child_care</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-center flex-1">智能起名 · 寓意深远</h1>
        <div className="w-10"></div>
      </nav>

      <main className="px-6 pt-4 flex-1">
        <div className="space-y-8">
          {/* Hero Card */}
          <div className="bg-white rounded-[2rem] shadow-soft border border-pink-50 overflow-hidden">
            <div 
              className="h-56 w-full bg-cover bg-center"
              style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA1hRwCh67_zykNI5mBLRtAhNUw0XTCD9-FkA5WYI76mbS0Fk6qIKWeOXnZvbXJrDBAgea_X11rrXA73HrCGX-9qutLT23DgrmujxfUhCgxr0xtBvqjXIDOpzkjVxMgPDwFeDQADOHEYmZzQprPq8UMEWqo8xGHtjwe41vKurhxSKH18XChN6DOrqoBzAVISPChFfweXTvE5GgNEOTLmfGsYSW79467Y3UvZfGut6tepEK6v-0iBXwRxAeEggMJHA_JFv_e0G1RB00')` }}
            ></div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">开始 AI 起名</h3>
              </div>
              <p className="text-pink-800/70 text-sm mb-6 leading-relaxed">
                基于国学大数据与现代AI深度学习，结合生辰八字为您定制万中选一的高分好名。
              </p>
              <button 
                onClick={handleStartNaming}
                className="w-full bg-primary hover:bg-pink-600 text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-glow transition-all active:scale-95"
              >
                <span className="text-lg">即刻起名</span>
                <span className="material-symbols-outlined text-xl">arrow_forward_ios</span>
              </button>
            </div>
          </div>

          {/* Process Steps */}
          <div className="pb-10">
            <h4 className="text-center text-pink-400 text-xs font-bold tracking-[0.2em] mb-8 uppercase">起名流程说明</h4>
            <div className="relative flex justify-between items-start px-2">
              <div className="absolute top-7 left-[15%] right-[15%] h-[1px] bg-pink-100 -z-0"></div>
              
              {[
                { icon: 'edit_note', title: '1. 输入信息', desc: '填写宝宝生辰资料' },
                { icon: 'psychology', title: '2. AI分析', desc: '深度学习精准匹配' },
                { icon: 'verified_user', title: '3. 获取佳名', desc: '筛选满意的高分名字' },
              ].map((step, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center w-1/3">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-md border border-pink-50 mb-3">
                    <span className="material-symbols-outlined text-primary text-2xl">{step.icon}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800 mb-1">{step.title}</span>
                  <span className="text-xs text-pink-800/50 text-center px-1 leading-tight">{step.desc}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center pb-6 flex flex-col items-center">
            <p className="text-pink-900/40 text-xs leading-relaxed">
                当前授权：一客一码付费版<br/>
                由高端AI算法模型提供技术支持
            </p>
          </div>
        </div>
      </main>

      {/* Decorative BG */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[50%] bg-pink-200/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[40%] bg-blue-100/30 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
};

export default Home;