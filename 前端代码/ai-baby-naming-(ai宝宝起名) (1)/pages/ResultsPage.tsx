import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NameResult } from '@/src/services/name.service';

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const names: NameResult[] = location.state?.names || [];

  // 处理卡片点击，跳转到详情页
  const handleCardClick = (name: NameResult) => {
    navigate(`/detail/${name.id}`, { state: { name } });
  };

  // 如果没有名字数据，显示空状态
  if (names.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-light px-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error_outline</span>
          <p className="text-slate-500 text-lg mb-6">没有生成结果</p>
          <button
            onClick={() => navigate('/input')}
            className="bg-primary hover:bg-pink-600 text-white font-bold px-8 py-3 rounded-xl transition-all"
          >
            返回重新输入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light">
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-6 bg-background-light/95 backdrop-blur-md border-b border-pink-100">
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-900 text-2xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">🎉 已为您生成{names.length}个好名字</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 px-4 pb-32 pt-4 space-y-4 overflow-y-auto no-scrollbar">
        {names.map((item) => (
          <div
            key={item.id}
            onClick={() => handleCardClick(item)}
            className="group relative bg-white p-6 rounded-2xl shadow-soft border border-pink-50 transition-all duration-300 hover:shadow-xl active:scale-[0.98] cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <p className="text-primary/80 text-sm font-medium tracking-widest mb-1">{item.pinyin}</p>
                <h2 className="text-5xl font-bold text-slate-900 font-serif">{item.full_name}</h2>
              </div>
              <div className="flex flex-col items-end bg-pink-50 px-3 py-2 rounded-xl">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-primary font-bold text-2xl">{item.score}</span>
                  <span className="text-xs font-bold text-primary opacity-80">分</span>
                </div>
                <div className="flex text-yellow-500 gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`material-symbols-outlined text-[14px] ${i < Math.floor(item.score / 20) ? 'filled-icon' : ''}`}
                    >
                      {i < Math.floor(item.score / 20) ? 'star' : 'star'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-50 pt-4">
              <p className="text-slate-600 text-[15px] leading-relaxed line-clamp-2">
                {item.highlight}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.three_scores && (
                  <>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">
                      韵律 {item.three_scores.rhythm}
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-md">
                      文化 {item.three_scores.culture}
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-md">
                      五行 {item.three_scores.luck}
                    </span>
                  </>
                )}
                <span className="text-[11px] text-slate-400 font-medium">综合评定</span>
              </div>
              <button className="flex items-center gap-1 text-primary font-bold text-sm group/btn">
                <span>查看详情</span>
                <span className="material-symbols-outlined transform group-hover/btn:translate-x-1 transition-transform text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 w-full max-w-md bg-gradient-to-t from-background-light via-background-light to-transparent p-6 pb-10 z-30 pointer-events-none">
        <button
          onClick={() => navigate('/input')}
          className="w-full pointer-events-auto bg-primary hover:bg-pink-600 text-white font-bold h-14 rounded-2xl flex items-center justify-center gap-2 shadow-glow hover:shadow-pink-500/40 transition-all duration-300 active:scale-[0.96]"
        >
          <span className="material-symbols-outlined text-[22px]">refresh</span>
          <span>再来一组</span>
        </button>
      </div>
    </div>
  );
};

export default ResultsPage;
