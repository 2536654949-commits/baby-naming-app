import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateCode, saveToken, recoverToken } from '@/src/services/auth.service';
import { validateCodeFormat, formatCode } from '@/src/utils/validation';

const ActivationPage: React.FC = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 格式化输入：自动转大写并添加前缀
    const formatted = formatCode(value);
    setCode(formatted);
    // 清除错误提示
    if (error) setError('');
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 基础验证
    if (!code.trim()) {
      setError('请输入授权码');
      return;
    }

    // 格式验证
    if (!validateCodeFormat(code)) {
      setError('授权码格式不正确，请输入12位授权码');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // 尝试激活
      const response = await validateCode(code);
      if (response.success) {
        saveToken(response.data.token);
        setMessage('激活成功！');
        setTimeout(() => {
          navigate('/input');
        }, 1000);
      }
    } catch (error: any) {
      // 检查是否是"已使用"错误，尝试恢复
      if (error.response?.data?.error?.code === 'CODE_ALREADY_USED') {
        try {
          const recoverResponse = await recoverToken(code);
          if (recoverResponse.success) {
            saveToken(recoverResponse.data.token);
            setMessage('Token恢复成功');
            setTimeout(() => {
              navigate('/input');
            }, 1500);
            return;
          }
        } catch (recoverError: any) {
          // 恢复失败，显示原始错误
          const errorMsg = recoverError.response?.data?.error?.message || error.response?.data?.error?.message;
          setError(errorMsg || '授权码已使用且无法恢复，请联系客服');
          return;
        }
      }

      // 其他错误处理
      const errorMsg = error.response?.data?.error?.message;
      if (error.response?.status === 401) {
        setError('授权码无效或已过期');
      } else if (error.response?.status === 429) {
        const waitSeconds = error.response?.data?.error?.waitSeconds;
        setError(`请求过于频繁，请${waitSeconds}秒后再试`);
      } else {
        setError(errorMsg || '激活失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background-light">
      {/* Background Gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#fff0eb] via-[#ffe4dc] to-[#f8f6f6]"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm hover:bg-white text-slate-600 transition-colors"
      >
        <span className="material-symbols-outlined text-xl">arrow_back</span>
      </button>

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-6">
        {/* Logo Area */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
             <span className="material-symbols-outlined text-[32px] text-primary">baby_changing_station</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">大师起名</h2>
            <p className="mt-1 text-sm font-medium text-[#9a5f4c]">千万名字库 · 寓意深远</p>
          </div>
        </div>

        {/* Activation Form Card */}
        <div className="w-full rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
           <form className="flex flex-col gap-6" onSubmit={handleActivate}>
              <div className="flex flex-col gap-2">
                 <label htmlFor="activation-code" className="text-sm font-semibold text-slate-900">授权码激活</label>
                 <input
                   id="activation-code"
                   type="text"
                   autoComplete="off"
                   value={code}
                   onChange={handleInputChange}
                   placeholder="BABY-XXXX-XXXX-XXXX"
                   className="w-full rounded-xl border border-[#e7d5cf] bg-[#fcf9f8] p-3.5 text-base font-medium text-slate-900 placeholder:text-[#9a5f4c]/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                   disabled={loading}
                 />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* 成功提示 */}
              {message && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-sm text-green-600">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-primary py-3.5 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {loading ? '激活中...' : '立即激活'}
              </button>
           </form>

           <div className="mt-6 flex flex-col items-center gap-4 border-t border-slate-100 pt-5">
              <p className="text-center text-xs text-slate-500">激活过程中遇到问题？</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-sm font-medium text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors"
              >
                如何获取授权码？
              </button>
           </div>
        </div>

        <div className="mt-4 text-center">
            <p className="text-xs text-[#9a5f4c] leading-relaxed">
                受加密技术保护，确保您的数据安全。<br/>
                您的隐私是我们的首要任务。
            </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-fade-in">
           <div className="w-full max-w-[320px] overflow-hidden rounded-[2rem] bg-white shadow-2xl">
              <div className="flex flex-col p-8 text-center">
                 <h3 className="text-xl font-bold text-slate-900 mb-6">获取授权码</h3>

                 <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
                    <span className="material-symbols-outlined text-3xl text-primary">person_add</span>
                 </div>

                 <div className="space-y-2 mb-8">
                    <p className="text-sm text-slate-500">请添加微信客服获取授权码：</p>
                    <div className="rounded-xl bg-[#fcf9f8] px-4 py-3 border border-gray-100">
                       <span className="text-xl font-bold tracking-wider text-primary select-all">zewzewz</span>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button className="w-full rounded-full bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-[0.97]">
                       一键复制微信号
                    </button>
                    <button
                      onClick={() => setShowModal(false)}
                      className="w-full py-2 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
                    >
                       稍后再说
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ActivationPage;
