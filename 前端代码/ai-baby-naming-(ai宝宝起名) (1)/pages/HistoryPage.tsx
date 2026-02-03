import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { getHistory, getHistoryDetail } from '@/src/services/name.service';
import { HistoryRecord } from '@/src/services/name.service';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await getHistory(100, 0);
      if (response.success && response.data) {
        setRecords(response.data.records);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/activation', { replace: true });
      } else {
        setError('获取历史记录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecordClick = async (recordId: string) => {
    try {
      const response = await getHistoryDetail(recordId);
      if (response.success && response.data) {
        navigate('/results', {
          state: {
            names: response.data.record.names,
            fromHistory: true
          }
        });
      }
    } catch (err) {
      console.error('获取详情失败:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background-light">
        <Header title="历史记录" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-slate-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-background-light">
        <Header title="历史记录" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error_outline</span>
            <p className="text-slate-500 mb-4">{error}</p>
            <button
              onClick={fetchHistory}
              className="bg-primary hover:bg-pink-600 text-white font-bold px-6 py-2 rounded-xl transition-all"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col h-full bg-background-light">
        <Header title="历史记录" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">history</span>
            <p className="text-slate-500 text-lg mb-2">暂无历史记录</p>
            <p className="text-slate-400 text-sm">开始起名后，历史记录将显示在这里</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light">
      <Header title="历史记录" />

      <div className="flex-1 px-4 py-6 relative overflow-y-auto pb-24">
        <div className="absolute left-[27px] top-[24px] bottom-0 w-[2px] bg-gradient-to-b from-primary to-gray-200 opacity-30"></div>

        <div className="flex flex-col gap-8 relative">
          {records.map((record) => (
             <div
               key={record.id}
               onClick={() => handleRecordClick(record.id)}
               className="flex gap-4 cursor-pointer group"
             >
                <div className="z-10 mt-1">
                   <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center border-4 border-white shadow-sm group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[14px] text-white">calendar_today</span>
                   </div>
                </div>

                <div className="flex-1 flex flex-col gap-3">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1">
                        {formatDate(record.createdAt)} {formatTime(record.createdAt)}
                      </span>
                      <h3 className="text-slate-900 text-base font-semibold">
                        姓氏：{record.surname} | 性别：{record.gender === 'male' ? '男孩' : record.gender === 'female' ? '女孩' : '未知'}
                      </h3>
                      {record.birthDate && (
                        <p className="text-slate-500 text-sm">
                          出生日期：{record.birthDate}
                          {record.birthTime && ` ${record.birthTime}`}
                        </p>
                      )}
                   </div>

                   <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar pr-4">
                      {record.names.map((name) => (
                        <div
                          key={name.id}
                          className="flex h-9 shrink-0 items-center justify-center rounded-xl bg-white border border-primary/20 px-4 shadow-sm group-hover:border-primary/50 transition-colors"
                        >
                           <p className="text-slate-900 text-sm font-medium">{name.full_name}</p>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
