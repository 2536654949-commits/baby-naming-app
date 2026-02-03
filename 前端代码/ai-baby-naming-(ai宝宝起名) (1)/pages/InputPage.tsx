import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { generateName } from '@/src/services/name.service';
import { NameInputParams } from '@/src/services/name.service';
import { isAuthenticated } from '@/src/services/auth.service';

const InputPage: React.FC = () => {
  const navigate = useNavigate();
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    surname: '',
    birthDate: '',
    birthTime: '',
    requirements: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/activation', { replace: true });
    }
  }, [navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.surname.trim()) {
      setError('请输入姓氏');
      return;
    }

    if (!gender) {
      setError('请选择宝宝性别');
      return;
    }

    const params: NameInputParams = {
      surname: formData.surname.trim(),
      gender: gender!,
      birthDate: formData.birthDate || undefined,
      birthTime: formData.birthTime || undefined,
      requirements: formData.requirements.trim() || undefined
    };

    setLoading(true);
    setError('');

    try {
      const response = await generateName(params);

      if (response.success && response.data) {
        navigate('/loading', {
          state: {
            names: response.data.names,
            generationTime: response.data.generationTime
          }
        });
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        const waitSeconds = error.response?.data?.error?.waitSeconds;
        setError(`请求过于频繁，请等待${waitSeconds}秒后再试`);
      } else if (error.response?.status === 401) {
        navigate('/activation', { replace: true });
      } else {
        const errorMsg = error.response?.data?.error?.message;
        setError(errorMsg || '生成失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="填写宝宝信息" />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-6 pt-6 pb-2">
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">为您的宝宝开启好名字</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            请输入宝宝的详细信息，我们的AI将为您推荐蕴含文化底蕴的高分名字。
          </p>
        </div>

        <div className="px-6 flex flex-col gap-6 pt-6">
          {/* Surname */}
          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-semibold text-slate-800">姓氏</label>
            <input
              type="text"
              value={formData.surname}
              onChange={(e) => handleInputChange('surname', e.target.value)}
              placeholder="请输入姓氏，如：李"
              className="w-full h-14 rounded-xl border-none bg-white text-slate-900 px-4 text-base font-medium shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-gray-400"
              disabled={loading}
            />
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-semibold text-slate-800">宝宝性别</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setGender('male');
                  if (error) setError('');
                }}
                disabled={loading}
                className={`h-14 rounded-xl border-2 flex items-center justify-center transition-all ${gender === 'male' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-transparent bg-white text-slate-900 shadow-sm ring-1 ring-gray-100'} disabled:opacity-50`}
              >
                <span className="font-semibold">男</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setGender('female');
                  if (error) setError('');
                }}
                disabled={loading}
                className={`h-14 rounded-xl border-2 flex items-center justify-center transition-all ${gender === 'female' ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-transparent bg-white text-slate-900 shadow-sm ring-1 ring-gray-100'} disabled:opacity-50`}
              >
                 <span className="font-semibold">女</span>
              </button>
            </div>
          </div>

          {/* Date Time */}
          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-semibold text-slate-800">出生日期与时间</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                className="h-14 rounded-xl bg-white text-slate-900 px-4 text-sm font-medium shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                disabled={loading}
              />
              <input
                type="time"
                value={formData.birthTime}
                onChange={(e) => handleInputChange('birthTime', e.target.value)}
                className="h-14 rounded-xl bg-white text-slate-900 px-4 text-sm font-medium shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                disabled={loading}
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="flex flex-col gap-2">
            <label className="text-[15px] font-semibold text-slate-800">特殊要求（选填）</label>
            <div className="relative">
              <textarea
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="例如：希望名字中包含“远”字，避开“金”属性，或者有特定的寓意偏好"
                maxLength={200}
                className="w-full min-h-[120px] rounded-xl border-none bg-white p-4 text-base resize-none shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-primary/50 placeholder:text-gray-400 disabled:opacity-50"
                disabled={loading}
              ></textarea>
              <div className="absolute bottom-3 right-3 text-[10px] font-medium text-gray-400">
                {formData.requirements.length}/200
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 pb-8 z-20">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-primary hover:bg-pink-600 text-white font-bold h-14 rounded-2xl shadow-glow transition-all active:scale-95 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '生成中...' : '开始起名'}
        </button>
      </div>
    </div>
  );
};

export default InputPage;
