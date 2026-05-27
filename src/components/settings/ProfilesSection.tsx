'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import {
  useProfiles, calcTDEE, resolveDailyCalorieTarget,
  type Profile, type Relation, type Dietary, type Gender, type ActivityLevel,
} from '@/lib/profile';
import { recommendSizes } from '@/lib/sizeRecommend';
import { useToast } from '@/context/ToastContext';
import EmojiIcon from '@/components/EmojiIcon';
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

const GENDER_OPTIONS: { key: Gender; label: string; emoji: string }[] = [
  { key: 'female', label: '여성',   emoji: '👩' },
  { key: 'male',   label: '남성',   emoji: '👨' },
  { key: 'other',  label: '기타',   emoji: '🧑' },
];

const ACTIVITY_OPTIONS: { key: ActivityLevel; label: string; emoji: string; sub: string }[] = [
  { key: 'sedentary',  label: '거의 안함',  emoji: '🪑', sub: '주로 앉아서' },
  { key: 'light',      label: '가볍게',     emoji: '🚶', sub: '주 1-3회 운동' },
  { key: 'moderate',   label: '보통',       emoji: '🏃', sub: '주 3-5회 운동' },
  { key: 'active',     label: '활발',       emoji: '💪', sub: '주 6-7회 운동' },
  { key: 'veryActive', label: '매우 활발',  emoji: '🔥', sub: '하루 2회 또는 육체 노동' },
];

const COMMON_ALLERGENS = ['갑각류', '땅콩', '계란', '우유', '밀', '대두', '복숭아', '토마토', '견과류', '메밀'];

const AVATAR_OPTIONS = ['🧑', '👩', '👨', '🧒', '👧', '👦', '🧓', '🐶', '🐱', '🦁', '🌸', '⭐', '🎨', '🎯'];

export interface ProfilesSectionHandle {
  expandMain: () => void;
}

function ProfileCard({ profile, onUpdate, onRemove, initialExpanded = false }: {
  profile: Profile;
  onUpdate: (patch: Partial<Omit<Profile, 'id'>>) => void;
  onRemove: () => void;
  initialExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const rec = recommendSizes(profile.body);

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <EmojiIcon emoji={profile.avatar ?? RELATION_EMOJI[profile.relation]} size={22} className="text-gray-700" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {profile.name}
            {profile.isMain && (
              <span className="ml-1.5 text-xs text-brand-primary font-semibold align-middle">나</span>
            )}
          </p>
          <p className="text-sm text-gray-400 mt-0.5">
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
                <label className="text-sm text-gray-500">이름</label>
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
                  <label className="text-sm text-gray-500">관계</label>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {RELATIONS.filter((r) => r !== '본인').map((r) => (
                      <button
                        key={r}
                        onClick={() => onUpdate({ relation: r })}
                        className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
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
                  <label className="text-sm text-gray-500">키 (cm)</label>
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
                  <label className="text-sm text-gray-500">몸무게 (kg)</label>
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
                <p className="text-sm text-gray-500 mb-1">네모아 권장 사이즈</p>
                {(rec.top || rec.bottom || rec.shoe) ? (
                  <div className="flex gap-1.5 flex-wrap">
                    {rec.top && (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-white border border-brand-primary/20 text-brand-primary font-medium">
                        상의 {rec.top}
                      </span>
                    )}
                    {rec.bottom && (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-white border border-brand-primary/20 text-brand-primary font-medium">
                        하의 {rec.bottom}
                      </span>
                    )}
                    {rec.shoe && (
                      <span className="text-sm px-2 py-0.5 rounded-full bg-white border border-brand-primary/20 text-brand-primary font-medium">
                        신발 {rec.shoe}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">키·몸무게를 입력하면 권장 사이즈를 추천해드려요.</p>
                )}
              </div>

              {/* 사이즈 덮어쓰기 */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-sm text-gray-500">상의</label>
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
                  <label className="text-sm text-gray-500">하의</label>
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
                  <label className="text-sm text-gray-500">신발</label>
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
                <label className="text-sm text-gray-500">아바타</label>
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
                    <EmojiIcon emoji={RELATION_EMOJI[profile.relation]} size={16} className={!profile.avatar ? 'text-white' : 'text-gray-700'} />
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
                      <EmojiIcon emoji={a} size={16} className={profile.avatar === a ? 'text-white' : 'text-gray-700'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* 식습관 */}
              <div>
                <label className="text-sm text-gray-500">식습관</label>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {DIETARY_OPTIONS.map((opt) => {
                    const current = profile.dietary ?? 'none';
                    const active = current === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => onUpdate({ dietary: opt.key })}
                        className={`text-sm px-2 py-0.5 rounded-full transition-colors ${
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

              {/* 나이·성별 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm text-gray-500">나이</label>
                  <input
                    type="number"
                    defaultValue={profile.body.age ?? ''}
                    min={1} max={120}
                    placeholder="예: 30"
                    onBlur={(e) => {
                      const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      if (v !== profile.body.age) onUpdate({ body: { age: v } });
                    }}
                    className="w-full mt-0.5 text-xs text-gray-800 bg-white border border-gray-100 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">성별</label>
                  <div className="flex gap-1 mt-0.5">
                    {GENDER_OPTIONS.map((opt) => {
                      const active = profile.body.gender === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => onUpdate({ body: { gender: opt.key } })}
                          className={`flex-1 text-xs py-1 rounded-xl transition-colors ${
                            active ? 'bg-brand-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {opt.emoji} {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 활동량 */}
              <div>
                <label className="text-sm text-gray-500">활동량 (운동 빈도)</label>
                <div className="grid grid-cols-5 gap-1 mt-0.5">
                  {ACTIVITY_OPTIONS.map((opt) => {
                    const active = (profile.body.activity ?? 'sedentary') === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => onUpdate({ body: { activity: opt.key } })}
                        title={opt.sub}
                        className={`flex flex-col items-center text-xs py-1 rounded-xl transition-colors ${
                          active ? 'bg-brand-primary text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        <span className="mt-0.5 text-[10px] leading-tight text-center">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 일일 칼로리 목표 (자동 계산 + 수동 덮어쓰기) */}
              <div className="rounded-2xl bg-brand-primary/5 border border-brand-primary/10 px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-500">일일 칼로리 목표</p>
                  <span className="text-xs font-bold text-brand-primary tabular-nums">
                    {resolveDailyCalorieTarget(profile.body)} kcal
                  </span>
                </div>
                {(() => {
                  const tdee = calcTDEE(profile.body);
                  return (
                    <p className="text-xs text-gray-400 leading-snug">
                      {tdee
                        ? `TDEE 자동 계산값: ${tdee} kcal. 수동으로 덮어쓰려면 아래 입력.`
                        : '키·몸무게·나이·성별·활동량을 모두 입력하면 자동 계산돼요. (현재 평균 2000 kcal)'}
                    </p>
                  );
                })()}
                <input
                  type="number"
                  defaultValue={profile.body.dailyCalorieTarget ?? ''}
                  min={800} max={5000}
                  placeholder={`자동: ${calcTDEE(profile.body) ?? 2000}`}
                  onBlur={(e) => {
                    const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    if (v !== profile.body.dailyCalorieTarget) onUpdate({ body: { dailyCalorieTarget: v } });
                  }}
                  className="w-full mt-1.5 text-xs text-gray-800 bg-white border border-brand-primary/20 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 tabular-nums"
                />
              </div>

              {/* 알레르기 */}
              <div>
                <label className="text-sm text-gray-500">알레르기</label>
                {(() => {
                  const current = profile.body.allergies ?? [];
                  function toggleAllergen(a: string) {
                    const has = current.includes(a);
                    const next = has ? current.filter((x) => x !== a) : [...current, a];
                    onUpdate({ body: { allergies: next.length > 0 ? next : undefined } });
                  }
                  return (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {COMMON_ALLERGENS.map((a) => {
                        const active = current.includes(a);
                        return (
                          <button
                            key={a}
                            onClick={() => toggleAllergen(a)}
                            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                              active
                                ? 'bg-brand-warning text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {active && '✓ '}{a}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                {(profile.body.allergies?.length ?? 0) > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5 leading-snug">
                    레시피 추천 시 {profile.body.allergies!.join(', ')} 포함 메뉴는 표시되지 않아요.
                  </p>
                )}
              </div>

              {/* 삭제 (본인 아닐 때만) */}
              {!profile.isMain && (
                <button
                  onClick={onRemove}
                  className="flex items-center justify-center gap-1.5 w-full mt-1 py-1.5 rounded-xl bg-white border border-brand-warning/20 text-sm text-brand-warning font-medium hover:bg-brand-warning/5 transition-colors"
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

const ProfilesSection = forwardRef<ProfilesSectionHandle>(function ProfilesSection(_, ref) {
  const { profiles, add, remove, update } = useProfiles();
  const { showToast } = useToast();
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState<Relation>('자녀');
  const [mainExpandKey, setMainExpandKey] = useState(0);

  useImperativeHandle(ref, () => ({
    expandMain: () => setMainExpandKey((k) => k + 1),
  }));

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
          <p className="text-xs text-gray-300 mt-0.5">본인 · 가족 · 공용 구매 물품 분리</p>
        </div>
        <span className="text-sm text-gray-400 tabular-nums">{profiles.length}명</span>
      </div>

      <div className="flex flex-col gap-2">
        {profiles.map((p) => (
          <ProfileCard
            key={p.isMain ? `main-${mainExpandKey}` : p.id}
            profile={p}
            initialExpanded={p.isMain && mainExpandKey > 0}
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
          <p className="text-xs font-semibold text-brand-primary">가족 · 다른 구성원 추가</p>
        </div>
        <p className="text-sm text-gray-500 mb-2">관계를 고르고 이름을 입력하세요.</p>
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {RELATIONS.filter((r) => r !== '본인').map((r) => (
            <button
              key={r}
              onClick={() => setNewRelation(r)}
              className={`text-sm px-2.5 py-1 rounded-full transition-colors ${
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
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-brand-primary text-white hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={12} /> 추가
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default ProfilesSection;
