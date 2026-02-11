import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { getFavorites, removeFavorite } from '@/src/services/favorite.service';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'new'>('all');
  const [error, setError] = useState('');

  // 缓存所有收藏数据，避免切换筛选时重复请求
  const [allFavorites, setAllFavorites] = useState<any[]>([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  // 当筛选条件变化时，在前端进行过滤
  useEffect(() => {
    if (allFavorites.length === 0) return;

    let filtered = allFavorites;
    switch (filter) {
      case 'high':
        // 高分推荐：评分 >= 96
        filtered = allFavorites.filter(item => item.nameData?.score >= 96);
        break;
      case 'new':
        // 最新添加：按创建时间倒序（数据已经按时间排序）
        filtered = [...allFavorites];
        break;
      case 'all':
      default:
        filtered = allFavorites;
        break;
    }
    setFavorites(filtered);
  }, [filter, allFavorites]);

  const fetchFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      // 首次加载获取全部数据，后续切换筛选在前端过滤
      const response = await getFavorites('all');
      if (response.success && response.data) {
        setAllFavorites(response.data.favorites);
        setFavorites(response.data.favorites);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/activation', { replace: true });
      } else {
        setError('获取收藏失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent, favoriteId: string, nameId: string) => {
    e.stopPropagation(); // Prevent navigating to details
    if (window.confirm('确定要取消收藏吗？')) {
      try {
        await removeFavorite(favoriteId);
        // 重新获取列表
        fetchFavorites();
      } catch (err) {
        console.error('取消收藏失败:', err);
      }
    }
  };

  const handleCardClick = (favorite: any) => {
    navigate(`/detail/${favorite.nameData.id}`, {
      state: { name: favorite.nameData, favoriteId: favorite.id }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-background-light">
        <Header title="我的收藏" />
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
        <Header title="我的收藏" />
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">error_outline</span>
            <p className="text-slate-500 mb-4">{error}</p>
            <button
              onClick={fetchFavorites}
              className="bg-primary hover:bg-pink-600 text-white font-bold px-6 py-2 rounded-xl transition-all"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background-light">
      <Header title="我的收藏" />

      <div className="flex-1 pb-24 overflow-y-auto">
        {/* Filter Tabs */}
        <div className="flex gap-4 px-4 py-4 overflow-x-auto no-scrollbar">
           <button
             onClick={() => setFilter('all')}
             className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-100'}`}
           >
             全部 ({allFavorites.length})
           </button>
           <button
             onClick={() => setFilter('high')}
             className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'high' ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-100'}`}
           >
             高分推荐
           </button>
           <button
             onClick={() => setFilter('new')}
             className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'new' ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-100'}`}
           >
             最新添加
           </button>
        </div>

        {/* List */}
        <div className="px-4 space-y-4">
           {favorites.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <span className="material-symbols-outlined text-6xl mb-4 opacity-50">bookmark_off</span>
               <p className="text-base mb-1">还没有收藏任何名字</p>
               <p className="text-sm">去结果页收藏喜欢的名字吧</p>
             </div>
           ) : (
             favorites.map((item) => (
               <div
                 key={item.id}
                 onClick={() => handleCardClick(item)}
                 className="group relative flex flex-col items-stretch justify-start rounded-xl shadow-soft bg-white p-5 active:scale-[0.98] transition-all cursor-pointer"
               >
                  <button
                    onClick={(e) => handleRemove(e, item.id, item.nameData.id)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-pink-50 transition-colors"
                  >
                     <span className="material-symbols-outlined text-primary text-2xl filled-icon">favorite</span>
                  </button>

                  <div className="flex flex-col gap-1">
                     <div className="flex items-baseline gap-2">
                        <p className="text-primary text-xs font-bold bg-primary/10 px-2 py-0.5 rounded-md">{item.nameData.score}分</p>
                     </div>
                     <p className="text-slate-900 text-3xl font-bold mt-1 tracking-tight">{item.nameData.full_name}</p>

                     <div className="mt-1">
                        <p className="text-[#9a5f4c] text-base font-medium mb-1">{item.nameData.pinyin}</p>
                        <p className="text-[#6b4235] text-sm font-normal leading-relaxed pr-8 line-clamp-2">
                          {item.nameData.highlight}
                        </p>
                     </div>

                     <div className="mt-4 flex justify-end">
                        <button className="flex items-center justify-center rounded-full h-9 px-5 bg-primary text-white text-sm font-bold shadow-sm group-hover:bg-pink-600 transition-colors">
                          查看详情
                        </button>
                     </div>
                  </div>
               </div>
             ))
           )}

           <div className="px-2 py-4 flex items-center justify-center gap-2 opacity-60">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <p className="text-xs text-slate-900">已通过付费授权，收藏云端同步中</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
