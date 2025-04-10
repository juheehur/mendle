import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdCopy } from '@/lib/types';

type EditAdCopyProps = {
  adCopy: AdCopy;
  onUpdate: (updatedCopy: AdCopy) => void;
  onCancel: () => void;
};

export default function EditAdCopy({ adCopy, onUpdate, onCancel }: EditAdCopyProps) {
  const [mainCopy, setMainCopy] = useState(adCopy.mainCopy);
  const [subCopy, setSubCopy] = useState(adCopy.subCopy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adCopy.editCount >= 20) {
      setError('수정 가능 횟수를 초과했습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 수정 이력 저장
      const { error: historyError } = await supabase
        .from('edit_history')
        .insert({
          adCopyId: adCopy.id,
          mainCopy: adCopy.mainCopy,
          subCopy: adCopy.subCopy,
        });

      if (historyError) throw historyError;

      // 광고 카피 업데이트
      const { data, error: updateError } = await supabase
        .from('ad_copies')
        .update({
          mainCopy,
          subCopy,
          editCount: adCopy.editCount + 1,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', adCopy.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) {
        onUpdate(data);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">광고 멘트 수정</h3>
      <p className="text-sm text-gray-500 mb-4">
        남은 수정 횟수: {20 - adCopy.editCount}회
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메인 카피
          </label>
          <textarea
            value={mainCopy}
            onChange={(e) => setMainCopy(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            서브 카피
          </label>
          <textarea
            value={subCopy}
            onChange={(e) => setSubCopy(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={3}
          />
        </div>
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || adCopy.editCount >= 20}
            className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? '수정중...' : '수정하기'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
} 