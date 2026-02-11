import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import { addFavorite, removeFavorite, checkIsFavorite } from '@/src/services/favorite.service';
import { NameResult } from '@/src/services/name.service';

const DetailPage: React.FC = () => {
  const { id } = useParams();
  const location = useLocation();
  const name: NameResult = location.state?.name;

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (name?.id) {
      checkIsFavorite(name.id).then(result => {
        setIsFavorite(result.isFavorite);
        setFavoriteId(result.favoriteId);
      });
    }
  }, [name]);

  const toggleFavorite = async () => {
    if (!name) return;

    setLoading(true);
    setMessage('');

    try {
      if (isFavorite) {
        if (favoriteId) {
          await removeFavorite(favoriteId);
          setIsFavorite(false);
          setFavoriteId(undefined);
          setMessage('已取消收藏');
        }
      } else {
        const response = await addFavorite(name);
        if (response.success && response.data) {
          setIsFavorite(true);
          setFavoriteId(response.data.id);
          setMessage('收藏成功');
        }
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      setMessage('操作失败，请重试');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!name) {
    return (
      <div className="flex flex-col h-full bg-background-light items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error_outline</span>
        <p className="text-slate-500">未找到名字详情</p>
      </div>
    );
  }

  const subScores = name.three_scores || {
    rhythm: Math.round(name.score * 0.95),
    culture: Math.round(name.score * 0.9),
    luck: Math.round(name.score * 0.88)
  };

  const getWuxingData = () => {
    const elements = name.elements || {};
    return {
      wood: elements['木'] || '适中',
      water: elements['水'] || '适中',
      fire: elements['火'] || '偏弱',
      earth: elements['土'] || '偏弱',
      metal: elements['金'] || '缺失'
    };
  };

  const wuxing = getWuxingData();

  const getCharacterData = () => {
    const chars = name.full_name.split('');
    return chars.map(char => ({
      char,
      pinyin: name.pinyin.split(' ')[chars.indexOf(char)] || '',
      meaning: '寓意美好',
      detail: name.meaning.substring(0, 50) + '...'
    }));
  };

  const characters = getCharacterData();

  return (
    <div className="flex flex-col h-full bg-background-light">
      <Header title="名字详情" transparent />

      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        <div className="px-6 pb-6 flex flex-col items-center justify-center relative">
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="font-serif text-6xl font-bold text-slate-900 mb-2 tracking-[0.2em] leading-normal drop-shadow-sm">
                {name.full_name}
            </h1>
            <p className="text-primary text-xl font-medium tracking-wide">{name.pinyin}</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent rounded-b-[3rem] -z-0 top-[-80px]"></div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
             <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">综合评分</h3>
                  <p className="text-sm text-slate-500">得分越高，推荐度越高</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">{name.score}</span>
                  <span className="text-sm font-semibold text-primary">分</span>
                </div>
             </div>

             <div className="grid grid-cols-3 gap-3">
               <div className="p-3 rounded-xl bg-blue-50 text-center">
                 <p className="text-xs text-blue-600 font-bold">韵律</p>
                 <p className="text-xl font-bold text-blue-700 mt-1">{subScores.rhythm}</p>
               </div>
               <div className="p-3 rounded-xl bg-green-50 text-center">
                 <p className="text-xs text-green-600 font-bold">文化</p>
                 <p className="text-xl font-bold text-green-700 mt-1">{subScores.culture}</p>
               </div>
               <div className="p-3 rounded-xl bg-purple-50 text-center">
                 <p className="text-xs text-purple-600 font-bold">五行</p>
                 <p className="text-xl font-bold text-purple-700 mt-1">{subScores.luck}</p>
               </div>
             </div>
          </div>
        </div>

        <div className="px-4 py-2">
             <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-[18px]">📌</span>
                寓意解析
            </h3>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
              {characters.map((char, idx) => (
                <div key={idx}>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center min-w-[3rem]">
                      <span className="font-serif text-2xl font-bold text-slate-900">{char.char}</span>
                      <span className="text-xs text-gray-500 tracking-wider mt-1">{char.pinyin}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 font-semibold">{char.meaning}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{char.detail}</p>
                    </div>
                  </div>
                  {idx < characters.length - 1 && <div className="h-px bg-gray-100 w-full my-4"></div>}
                </div>
              ))}
              <div className="pt-2">
                <p className="text-sm text-gray-700 leading-relaxed">{name.meaning}</p>
              </div>
            </div>
        </div>

        {name.cultural_source && (
          <div className="px-4 py-2">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span className="text-[18px]">📜</span>
                  典故出处
              </h3>
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 relative">
                 <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
                 <div className="p-5 relative z-10">
                    <div className="flex gap-3 mb-3">
                       <div className="w-1 h-auto bg-primary/40 rounded-full"></div>
                       <p className="font-serif text-base text-slate-800 leading-relaxed">
                          {name.cultural_source}
                       </p>
                    </div>
                 </div>
              </div>
          </div>
        )}

        <div className="px-4 py-2">
           <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-[18px]">✨</span>
                亮点说明
            </h3>
           <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">{name.highlight}</p>
           </div>
        </div>

        {name.mbti_tendency && (
          <div className="px-4 py-2 pb-8">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-[18px]">🧠</span>
              MBTI倾向参考
            </h3>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-700 leading-relaxed">{name.mbti_tendency}</p>
            </div>
          </div>
        )}

        {!name.mbti_tendency && <div className="pb-4"></div>}

        {message && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
            {message}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background-light via-background-light/95 to-transparent pt-10 max-w-md mx-auto z-50">
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`w-full font-bold h-12 rounded-xl shadow-glow flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${isFavorite ? 'bg-gray-800 text-white' : 'bg-primary hover:bg-primary/90 text-white'} disabled:opacity-50`}
          >
             <span className={`material-symbols-outlined text-[20px] ${isFavorite ? 'filled-icon' : ''}`}>favorite</span>
             <span>{loading ? '处理中...' : isFavorite ? '已收藏' : '保存收藏'}</span>
          </button>
      </div>
    </div>
  );
};

export default DetailPage;
