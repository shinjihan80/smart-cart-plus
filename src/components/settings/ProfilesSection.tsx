'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { useProfiles, type Profile, type Relation, type Dietary } from '@/lib/profile';
import { recommendSizes } from '@/lib/sizeRecommend';
import { useToast } from '@/context/ToastContext';
import { springTransition, CARD, CARD_SHADOW } from '@/components/mypage/shared';

const RELATIONS: Relation[] = ['본인', '배우자', '자녀', '부모', '기타'];

const RELATION_EMOJI: Record<Relation, string> = {
  본인:   '👤',
  배우자: '💞',
  자녀:   '🧒',
  부모:   '🧑‍🦳',
  기타:   '👥',
};

const DIETARY_OPTIONS: { key: Dietary; label: string; emoji: string }[] = [
  { key: 'none',         label: '없음',       emoji: '🍽️' },
  { key: 'pescatarian',  label: '페스코',     emoji: '🐟' },
  { key: 'vegetarian',   label: '채식',       emoji: '🥬' },
  { key: 'vegan',        label: '비건',       emoji: '🌱' },
];

const AVATAR_OPTIONS = ['🧑', '👩', '👨', '🧒', '👧', '👦', '🧓', '🐶', '🐱', '🦁', '🌸', '⭐', '🎨', '🎯'];

function ProfileCard({ profile, onUpdate, onRemove }: {
  profile: Profile;
  onUpdate: (patch: Partial<Omit<Profile, 'id'>>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rec = recommendSizes(profile.body);

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-2xl">{profile.avatar ?? RELATION_EMOJI[profile.relation]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {profile.name}
            {profile.isMain && (
              <span className="ml-1.5 text-[9px] text-brand-primary font-semibold align-middle">나</span>
            )}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {profile.relation}
            {profile.body.heightCm && <span> · {profile.body.heightCm}cm</span>}
            {profile.body.weightKg && <span> · {profile.body.weightKg}kg</span>}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-300 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 p-3 bg-gray-50/50 flex flex-col gap-2.5">
              {/* 이름 수정 */}
              <div>
                <label className="text-[10px] text-gray-500">이름</label>
                <input
                  type="text"
                  defaultValue={profile.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== profile.name) onUpdate({ name: v });
                  }}
                  className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                />
              </div>

              {/* 관계 */}
              {!profile.isMain && (
                <div>
                  <label className="text-[10px] text-gray-500">관계</label>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {RELATIONS.filter((r) => r !== '본인').map((r) => (
                      <button
                        key={r}
                        onClick={() => onUpdate({ relation: r })}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                          profile.relation === r
                            ? 'bg-brand-primary text-white'
                            : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {RELATION_EMOJI[r]} {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 신체 정보 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">키 (cm)</label>
                  <input
                    type="number"
                    defaultValue={profile.body.heightCm ?? ''}
                    min={50} max={250}
                    placeholder="예: 170"
                    onBlur={(e) => {
                      const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      if (v !== profile.body.heightCm) onUpdate({ body: { heightCm: v } });
                    }}
                    className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">몸무게 (kg)</label>
                  <input
                    type="number"
                    defaultValue={profile.body.weightKg ?? ''}
                    min={10} max={300}
                    placeholder="예: 65"
                    onBlur={(e) => {
                      const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      if (v !== profile.body.weightKg) onUpdate({ body: { weightKg: v } });
                    }}
                    className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                  />
                </div>
              </div>

              {/* 권장 사이즈 */}
              <div className="rounded-2xl bg-brand-primary/5 border border-brand-primary/10 px-3 py-2">
                <p className="text-[10px] text-gray-500 mb-1">네모아 권장 사이즈</p>
                {(rec.top || rec.bottom || rec.shoe) ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {rec.top && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-brand-primary/20 text-brand-primary font-medium">
                        상의 {rec.top}
                      </span>
                    )}
                    {rec.bottom && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-brand-primary/20 text-brand-primary font-medium">
                        하의 {rec.bottom}
                      </span>
                    )}
                    {rec.shoe && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-brand-primary/20 text-brand-primary font-medium">
                        신발 {rec.shoe}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400">키·몸무게를 입력하면 권장 사이즈를 추천해드려요.</p>
                )}
              </div>

              {/* 사이즈 덮어쓰기 */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">상의</label>
                  <input
                    type="text"
                    defaultValue={profile.body.topSize ?? ''}
                    placeholder={rec.top ?? '—'}
                    onBlur={(e) => {
                      const v = e.target.value.trim() || undefined;
                      if (v !== profile.body.topSize) onUpdate({ body: { topSize: v } });
                    }}
                    className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-gray-100 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">하의</label>
                  <input
                    type="text"
                    defaultValue={profile.body.bottomSize ?? ''}
                    placeholder={rec.bottom ?? '—'}
                    onBlur={(e) => {
                      const v = e.target.value.trim() || undefined;
                      if (v !== profile.body.bottomSize) onUpdate({ body: { bottomSize: v } });
                    }}
                    className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-gray-100 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">신발</label>
                  <input
                    type="number"
                    defaultValue={profile.body.shoeSize ?? ''}
                    min={150} max={330}
                    placeholder={rec.shoe ? String(rec.shoe) : '—'}
                    onBlur={(e) => {
                      const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      if (v !== profile.body.shoeSize) onUpdate({ body: { shoeSize: v } });
                    }}
                    className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-gray-100 rounded-xl px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                  />
                </div>
              </div>

              {/* 아바타 */}
              <div>
                <label className="text-[10px] text-gray-500">아바타</label>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <button
                    onClick={() => onUpdate({ avatar: undefined })}
                    className={`text-base w-7 h-7 rounded-full transition-colors ${
                      !profile.avatar
                        ? 'bg-brand-primary text-white ring-2 ring-brand-primary/30'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    title="관계 기본 이모지"
                  >
                    {RELATION_EMOJI[profile.relation]}
                  </button>
                  {AVATAR_OPTIONS.map((a) => (
                    <button
                      key={a}
                      onClick={() => onUpdate({ avatar: a })}
                      className={`text-base w-7 h-7 rounded-full transition-colors ${
                        profile.avatar === a
                          ? 'bg-brand-primary ring-2 ring-brand-primary/30'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* 식습관 */}
              <div>
                <label className="text-[10px] text-gray-500">식습관</label>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {DIETARY_OPTIONS.map((opt) => {
                    const current = profile.dietary ?? 'none';
                    const active = current === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => onUpdate({ dietary: opt.key })}
                        className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                          active
                            ? 'bg-brand-primary text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {opt.emoji} {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 삭제 (본인 아닐 때만) */}
              {!profile.isMain && (
                <button
                  onClick={onRemove}
                  className="flex items-center justify-center gap-1.5 w-full mt-1 py-1.5 rounded-xl bg-white border border-brand-warning/20 text-[10px] text-brand-warning font-medium hover:bg-brand-warning/5 transition-colors"
                >
                  <Trash2 size={10} /> 이 프로필 삭제
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfilesSection() {
  const { profiles, add, remove, update } = useProfiles();
  const { showToast } = useToast();
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState<Relation>('자녀');

  function handleAdd() {
    const name = newName.trim();
    if (!name) {
      showToast('이름을 입력해주세요.');
      return;
    }
    add(name, newRelation);
    setNewName('');
    showToast(`"${name}" 프로필이 추가됐어요.`);
  }

  return (
    <motion.div
      id="profiles"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.08 }}
      className={CARD}
      style={CARD_SHADOW}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs text-gray-400 font-medium">프로필 관리</h3>
          <p className="text-[9px] text-gray-300 mt-0.5">본인 · 가족 · 공용 구매 물품 분리</p>
        </div>
        <span className="text-[10px] text-gray-400 tabular-nums">{profiles.length}명</span>
      </div>

      <div className="flex flex-col gap-2">
        {profiles.map((p) => (
          <ProfileCard
            key={p.id}
            profile={p}
            onUpdate={(patch) => update(p.id, patch)}
            onRemove={() => {
              if (confirm(`"${p.name}" 프로필을 삭제할까요? 연결된 아이템 정보는 유지돼요.`)) {
                remove(p.id);
                showToast(`"${p.name}" 삭제됐어요.`);
              }
            }}
          />
        ))}
      </div>

      {/* 가족 추가 폼 */}
      <div className="mt-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/15 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Plus size={12} className="text-brand-primary" />
          <p className="text-[11px] font-semibold text-brand-primary">가족 · 다른 구성원 추가</p>
        </div>
        <p className="text-[10px] text-gray-500 mb-2">관계를 고르고 이름을 입력하세요.</p>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {RELATIONS.filter((r) => r !== '본인').map((r) => (
            <button
              key={r}
              onClick={() => setNewRelation(r)}
              className={`text-[10px] px-2.5 py-1 rounded-full transition-colors ${
                newRelation === r
                  ? 'bg-brand-primary text-white'
                  : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {RELATION_EMOJI[r]} {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder={`${newRelation} 이름 (예: 엄마, 큰아이)`}
            aria-label="새 프로필 이름"
            className="flex-1 text-xs text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-brand-primary text-white hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={12} /> 추가
          </button>
        </div>
      </div>
    </motion.div>
  );
}
