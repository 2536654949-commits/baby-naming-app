import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NameResult, generateName, NameInputParams } from '@/src/services/name.service';

const LoadingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [statusText, setStatusText] = useState("正在分析姓氏渊源...");
  const [names, setNames] = useState<NameResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const hasGenerated = useRef(false);
  const apiCompletedRef = useRef(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const babyInfo: NameInputParams | undefined = location.state?.babyInfo;
    const isGenerating = location.state?.isGenerating;
    const existingNames = location.state?.names;

    // 如果没有 babyInfo，返回输入页
    if (!babyInfo) {
      console.error('没有宝宝信息');
      navigate('/input');
      return;
    }

    // 如果已经有结果（直接传入的），直接播放动画
    if (existingNames && !isGenerating) {
      setNames(existingNames);
      setIsLoading(false);
      startProgressAnimation();
      // 3秒后跳转
      setTimeout(() => {
        completeProgressAndNavigate(existingNames);
      }, 3000);
      return;
    }

    // 需要执行 API 请求生成名字
    if (isGenerating && !hasGenerated.current) {
      hasGenerated.current = true;
      generateNamesAndAnimate(babyInfo);
    }
  }, [location.state, navigate]);

  // 生成名字并开始动画（并行执行）
  const generateNamesAndAnimate = async (babyInfo: NameInputParams) => {
    try {
      setIsLoading(true);

      // 同时启动进度条动画和API请求
      const progressPromise = startProgressAnimation();
      const apiPromise = generateName(babyInfo);

      // 等待API请求完成
      const response = await apiPromise;

      if (response.success && response.data) {
        const generatedNames = response.data.names;
        setNames(generatedNames);
        apiCompletedRef.current = true;

        // 等待进度条到达95%以上再完成
        await waitForProgressToComplete();

        // 快速完成最后进度并跳转
        completeProgressAndNavigate(generatedNames, babyInfo);
      } else {
        throw new Error('生成失败');
      }
    } catch (err: any) {
      // 清理进度条定时器
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
      handleError(err);
    }
  };

  // 等待进度条到达合适位置
  const waitForProgressToComplete = async () => {
    return new Promise<void>((resolve) => {
      const checkProgress = () => {
        // 使用ref获取最新进度，避免闭包问题
        const currentProgress = progressRef.current;
        // 如果进度已经到95%以上，或者API已完成但进度不够，直接继续
        if (currentProgress >= 95) {
          resolve();
        } else if (apiCompletedRef.current) {
          // API已完成但进度还没到95%，快速推进到95%
          setProgress(95);
          progressRef.current = 95;
          resolve();
        } else {
          // 否则等待一下再检查
          setTimeout(checkProgress, 100);
        }
      };
      checkProgress();
    });
  };

  // 完成进度并跳转
  const completeProgressAndNavigate = (nameList: NameResult[], babyInfo?: NameInputParams) => {
    // 快速完成到100%
    setProgress(100);
    setStatusText("生成完成！");

    setTimeout(() => {
      navigate('/results', {
        state: {
          names: nameList,
          babyInfo: babyInfo || location.state?.babyInfo
        }
      });
    }, 500);
  };

  // 处理错误
  const handleError = (err: any) => {
    if (err.response?.status === 429) {
      const waitSeconds = err.response?.data?.error?.waitSeconds;
      setError(`请求过于频繁，请等待${waitSeconds}秒后再试`);
    } else if (err.response?.status === 401) {
      navigate('/activation', { replace: true });
      return;
    } else {
      const errorMsg = err.response?.data?.error?.message;
      setError(errorMsg || '生成失败，请重试');
    }
    setIsLoading(false);
  };

  // 开始进度条动画（与API并行）
  const startProgressAnimation = () => {
    // 每300ms增加1%，约30秒到达100%
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = (() => {
          // 如果API已完成，快速完成剩余进度
          if (apiCompletedRef.current) {
            if (progressTimerRef.current) {
              clearInterval(progressTimerRef.current);
            }
            return prev;
          }

          // 最多到95%，等待API完成后再到100%
          if (prev >= 95) {
            if (progressTimerRef.current) {
              clearInterval(progressTimerRef.current);
            }
            return 95;
          }

          // 根据进度更新状态文本
          if (prev === 20) setStatusText("正在查阅典籍出处...");
          if (prev === 50) setStatusText("正在筛选大师精选...");
          if (prev === 80) setStatusText("正在匹配千万名字库...");

          return prev + 1;
        })();

        // 同步更新ref以保持最新值
        progressRef.current = newProgress;
        return newProgress;
      });
    }, 300); // 300ms * 100 = 30秒
  };

  // 重试
  const handleRetry = () => {
    setError('');
    setProgress(0);
    setStatusText("正在分析姓氏渊源...");
    hasGenerated.current = false;
    const babyInfo = location.state?.babyInfo;
    if (babyInfo) {
      generateNamesAndAnimate(babyInfo);
    }
  };

  // 返回输入页
  const handleBack = () => {
    navigate('/input');
  };

  // 错误状态 UI
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#FFF9F6] to-[#FFE4E9] px-6">
        <div className="relative flex items-center justify-center mb-8">
          <div className="relative z-10 w-40 h-40 flex items-center justify-center bg-white rounded-full shadow-2xl border-4 border-white overflow-hidden">
            <span className="material-symbols-outlined text-6xl text-red-400">error_outline</span>
          </div>
        </div>

        <h2 className="mb-4 text-center text-xl font-bold tracking-tight text-[#4E342E]">
          生成失败
        </h2>

        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 max-w-[300px]">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[280px]">
          <button
            onClick={handleRetry}
            className="w-full bg-primary hover:bg-pink-600 text-white font-bold h-12 rounded-xl shadow-glow transition-all active:scale-95"
          >
            重试
          </button>
          <button
            onClick={handleBack}
            className="w-full bg-white hover:bg-gray-50 text-slate-700 font-bold h-12 rounded-xl border border-gray-200 transition-all active:scale-95"
          >
            返回修改
          </button>
        </div>
      </div>
    );
  }

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
        大师正在为您甄选佳名...
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
        <div className={`flex items-center justify-center w-full px-4 py-3 rounded-xl border shadow-sm ${progress < 20 ? 'bg-white/40 border-primary/10' : 'bg-white border-primary/20'}`}>
           <span className={`text-sm font-bold ${progress < 20 ? 'text-[#A1887F]' : 'text-[#5D4037]'}`}>
             {progress < 20 ? '正在初始化...' : '正在查阅典籍出处...'}
           </span>
        </div>
        <div className={`flex items-center justify-center w-full px-4 py-3 rounded-xl ${progress < 50 ? 'bg-white/20' : 'bg-white/40'}`}>
           <span className={`text-sm font-medium ${progress < 50 ? 'text-[#A1887F]/50' : 'text-[#A1887F]'}`}>
             正在筛选最佳组合...
           </span>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="p-10 text-center mt-auto">
        <div className="inline-block px-8 py-5 rounded-3xl bg-white/80 shadow-lg border border-white">
          <p className="text-[15px] text-[#6D4C41] leading-relaxed font-semibold">
            温馨提示：为了呈现最佳寓意<br/>
            <span className="text-primary">大师正在千万名字库中甄选</span>，好名字值得片刻等待
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoadingPage;
