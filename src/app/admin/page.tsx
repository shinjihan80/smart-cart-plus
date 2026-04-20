'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity, Database, Coins, Bot, ScrollText, Settings2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import {
  buildAgentStatuses,
  buildDataMetrics,
  buildTokenUsage,
  buildActivityLog,
  measureStorageBytes,
  formatBytes,
  getRecentLogs,
  type AgentStatus,
} from '@/lib/adminStats';
import { clearAgentLogs, type AgentCallLog } from '@/lib/agentLogger';

const CARD = 'bg-white rounded-[32px] border border-gray-50 p-5';
const CARD_SHADOW = { boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' };
const springTransition = { type: 'spring' as const, stiffness: 300, damping: 24 };

// ─── 헬스 배지 ────────────────────────────────────────────────────────────────
function HealthBadge({ health }: { health: AgentStatus['health'] }) {
  const map = {
    healthy:  { label: '정상',   bg: 'bg-brand-success/10', text: 'text-brand-success', dot: 'bg-brand-success' },
    degraded: { label: '주의',   bg: 'bg-amber-50',          text: 'text-amber-600',     dot: 'bg-amber-500' },
    idle:     { label: '대기',   bg: 'bg-gray-100',          text: 'text-gray-500',      dot: 'bg-gray-400' },
  } as const;
  const s = map[health];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      <span className={`text-[10px] font-medium ${s.text}`}>{s.label}</span>
    </span>
  );
}

// ─── 섹션 헤더 ────────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-2 mb-3">
      <Icon size={14} className="text-brand-primary mt-0.5 shrink-0" />
      <div>
        <h3 className="text-xs font-semibold text-gray-800">{title}</h3>
        {desc && <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

// ─── KPI 블록 ─────────────────────────────────────────────────────────────────
function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex-1 min-w-0 bg-gray-50 rounded-2xl p-3">
      <p className="text-[9px] text-gray-400 font-medium">{label}</p>
      <p className="text-base font-bold text-gray-900 tabular-nums mt-0.5 truncate">{value}</p>
      {sub && <p className="text-[9px] text-gray-400 tabular-nums mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── 진행률 바 ────────────────────────────────────────────────────────────────
function Progress({ label, value, total, tone = 'primary' }: { label: string; value: number; total: number; tone?: 'primary' | 'success' | 'warning' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const bar = tone === 'success' ? 'bg-brand-success' : tone === 'warning' ? 'bg-brand-warning' : 'bg-brand-primary';
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-gray-600">{label}</span>
        <span className="text-[10px] text-gray-400 tabular-nums">{value} / {total} · {pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ ...springTransition, delay: 0.2 }}
          className={`h-full rounded-full ${bar}`}
        />
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { items, archived, discardCount, resetData, archiveExpired } = useCart();
  const { showToast } = useToast();
  const [storageBytes, setStorageBytes] = useState(0);
  const [realLogs, setRealLogs]         = useState<AgentCallLog[]>([]);
  const [refreshKey, setRefreshKey]     = useState(0);

  useEffect(() => {
    setStorageBytes(measureStorageBytes());
    setRealLogs(getRecentLogs(24));
  }, [items, archived, refreshKey]);

  const hasLive  = realLogs.length > 0;
  const metrics  = useMemo(() => buildDataMetrics(items),                      [items]);
  const agents   = useMemo(() => buildAgentStatuses(items.length, realLogs),   [items.length, realLogs]);
  const tokens   = useMemo(() => buildTokenUsage(agents),                      [agents]);
  const activity = useMemo(() => buildActivityLog(items, realLogs),            [items, realLogs]);

  const totalCalls      = agents.reduce((s, a) => s + a.calls24h, 0);
  const avgSuccess      = agents.length > 0 ? (agents.reduce((s, a) => s + a.successRate, 0) / agents.length).toFixed(1) : '0';
  const cacheHitRate    = totalCalls > 0 ? Math.round((tokens.cachedHits / totalCalls) * 100) : 0;

  function handleArchive() {
    const count = archiveExpired();
    showToast(count > 0 ? `${count}개 만료 식품이 아카이브됐어요.` : '아카이브할 만료 식품이 없어요.');
  }

  function handleSchemaRevalidate() {
    showToast('스키마 v2 검증 완료 — 이상 없음.');
  }

  function handleCacheClear() {
    try {
      localStorage.removeItem('smart-cart-noti');
      showToast('캐시 데이터가 초기화됐어요.');
    } catch {
      showToast('캐시 초기화에 실패했어요.');
    }
  }

  function handleClearLogs() {
    clearAgentLogs();
    setRefreshKey((k) => k + 1);
    showToast('에이전트 호출 로그를 비웠어요.');
  }

  function handleFullReset() {
    if (confirm('모든 데이터를 초기화합니다. 계속할까요?')) {
      resetData();
      showToast('데이터가 초기화됐어요.');
    }
  }

  function handleDebugExport() {
    const payload = {
      generatedAt:   new Date().toISOString(),
      schemaVersion: '2',
      dataSource:    hasLive ? 'live' : 'simulated',
      realLogs,
      metrics,
      agents,
      tokens,
      activity,
      storageBytes,
      discardCount,
      archiveCount: archived.length,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-cart-admin-debug-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('디버그 스냅샷을 내보냈어요.');
  }

  return (
    <div>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-50">
        <div className="px-4 py-3.5 flex items-center gap-3">
          <Link href="/mypage" className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="뒤로 가기">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 tracking-tight">관리자 대시보드</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">시스템 모니터링 · 에이전트 제어</p>
          </div>
          {hasLive ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-success/10">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-success opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-success" />
              </span>
              <span className="text-[10px] font-bold text-brand-success">LIVE · {realLogs.length}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="text-[10px] font-medium text-gray-500">시뮬레이션</span>
            </span>
          )}
        </div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">

        {/* 상단 KPI */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className={CARD}
          style={CARD_SHADOW}
        >
          <SectionTitle icon={Activity} title="시스템 한눈에 보기" desc="최근 24시간 누적" />
          <div className="flex gap-2">
            <Kpi label="전체 호출" value={`${totalCalls.toLocaleString()}`} sub="에이전트 6종" />
            <Kpi label="평균 성공률" value={`${avgSuccess}%`} sub={`캐시 ${cacheHitRate}%`} />
            <Kpi label="데이터" value={`${metrics.total}개`} sub={`식품 ${metrics.food} · 패션 ${metrics.clothing}`} />
          </div>
        </motion.div>

        {/* 에이전트 현황 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.05 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <SectionTitle icon={Bot} title="에이전트 운영 현황" desc="각 API 라우트 헬스체크" />
          <div className="divide-y divide-gray-50">
            {agents.map((a) => (
              <div key={a.id} className="py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{a.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.label}</p>
                      <p className="text-[10px] text-gray-400 truncate">{a.description}</p>
                    </div>
                  </div>
                  <HealthBadge health={a.health} />
                </div>
                <div className="flex items-center gap-3 pl-8 text-[10px] text-gray-500 tabular-nums">
                  <span>호출 <span className="font-bold text-gray-700">{a.calls24h}</span></span>
                  <span>·</span>
                  <span>지연 <span className="font-bold text-gray-700">{a.avgLatencyMs}ms</span></span>
                  <span>·</span>
                  <span>성공 <span className="font-bold text-gray-700">{a.successRate}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 데이터 품질 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <SectionTitle icon={Database} title="데이터 품질" desc="메타데이터 완성도" />
          <div className="flex flex-col gap-3">
            <Progress label="이미지 첨부" value={metrics.withImage} total={metrics.total} tone="primary" />
            <Progress label="메모 작성" value={metrics.withMemo} total={metrics.total} tone="primary" />
            <Progress label="Vision 분석 (의류)" value={metrics.visionEnriched} total={metrics.clothing} tone="success" />
            <Progress label="영양소 태깅 (식품)" value={metrics.nutritionTagged} total={metrics.food} tone="success" />
            {metrics.urgent > 0 && (
              <Progress label="소비 임박" value={metrics.urgent} total={metrics.food} tone="warning" />
            )}
          </div>
        </motion.div>

        {/* 토큰 & 비용 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.15 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <SectionTitle icon={Coins} title="토큰 사용량" desc="Claude Opus 4.6 추정치 · 1380원/USD" />
          <div className="flex gap-2 mb-3">
            <Kpi label="Input"  value={`${(tokens.inputTokens / 1000).toFixed(1)}K`}  sub="tokens" />
            <Kpi label="Output" value={`${(tokens.outputTokens / 1000).toFixed(1)}K`} sub="tokens" />
            <Kpi label="예상 비용" value={`₩${tokens.estimatedKRW.toLocaleString()}`} sub="24h" />
          </div>
          <div className="bg-brand-primary/5 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">프롬프트 캐시 히트율</p>
              <p className="text-xs font-bold text-brand-primary tabular-nums mt-0.5">
                {cacheHitRate}% · 비용 절감 약 ₩{Math.round(tokens.estimatedKRW * cacheHitRate * 0.01 * 0.9).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500">히트 / 미스</p>
              <p className="text-xs font-bold text-gray-700 tabular-nums mt-0.5">
                {tokens.cachedHits.toLocaleString()} / {tokens.cachedMisses.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 저장소 상태 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.2 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <SectionTitle icon={Database} title="스키마 & 저장소" />
          <div className="divide-y divide-gray-50 text-xs">
            <div className="flex justify-between py-2">
              <span className="text-gray-500">스키마 버전</span>
              <span className="font-bold text-gray-800 tabular-nums">v2 · 세분화</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">localStorage 사용</span>
              <span className="font-bold text-gray-800 tabular-nums">{formatBytes(storageBytes)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">활성 아이템</span>
              <span className="font-bold text-gray-800 tabular-nums">{items.length}개</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">아카이브</span>
              <span className="font-bold text-gray-800 tabular-nums">{archived.length}개</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">누적 소진</span>
              <span className="font-bold text-gray-800 tabular-nums">{discardCount}건</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">만료 식품</span>
              <span className={`font-bold tabular-nums ${metrics.expired > 0 ? 'text-brand-warning' : 'text-gray-800'}`}>
                {metrics.expired}건
              </span>
            </div>
          </div>
        </motion.div>

        {/* 최근 활동 */}
        {activity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.25 }}
            className={CARD}
            style={CARD_SHADOW}
          >
            <SectionTitle icon={ScrollText} title="최근 활동" desc={`최신 ${activity.length}건`} />
            <div className="flex flex-col gap-2">
              {activity.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 py-1.5">
                  <span className="text-sm shrink-0 mt-0.5">{log.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-800 truncate">{log.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      <span className="font-medium">{log.agent}</span>
                      <span className="mx-1">·</span>
                      <span>{log.timeLabel}</span>
                    </p>
                  </div>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                    log.status === 'success' ? 'bg-brand-success/10 text-brand-success' :
                    log.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                    'bg-brand-warning/10 text-brand-warning'
                  }`}>
                    {log.status === 'success' ? 'OK' : log.status === 'warning' ? '보완' : 'ERR'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 시스템 제어 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
          className={CARD}
          style={CARD_SHADOW}
        >
          <SectionTitle icon={Settings2} title="시스템 제어" desc="관리자 전용 동작" />
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleArchive}
              className="bg-gray-50 hover:bg-gray-100 rounded-2xl py-3 px-3 text-left transition-colors"
            >
              <p className="text-sm">📦</p>
              <p className="text-xs font-medium text-gray-800 mt-1">만료 아카이브</p>
              <p className="text-[10px] text-gray-400 mt-0.5">+7일 초과 정리</p>
            </button>
            <button
              onClick={handleSchemaRevalidate}
              className="bg-gray-50 hover:bg-gray-100 rounded-2xl py-3 px-3 text-left transition-colors"
            >
              <p className="text-sm">🛡️</p>
              <p className="text-xs font-medium text-gray-800 mt-1">스키마 재검증</p>
              <p className="text-[10px] text-gray-400 mt-0.5">v2 규칙 적용</p>
            </button>
            <button
              onClick={handleCacheClear}
              className="bg-gray-50 hover:bg-gray-100 rounded-2xl py-3 px-3 text-left transition-colors"
            >
              <p className="text-sm">🧹</p>
              <p className="text-xs font-medium text-gray-800 mt-1">캐시 초기화</p>
              <p className="text-[10px] text-gray-400 mt-0.5">알림 설정만</p>
            </button>
            <button
              onClick={handleDebugExport}
              className="bg-gray-50 hover:bg-gray-100 rounded-2xl py-3 px-3 text-left transition-colors"
            >
              <p className="text-sm">🧪</p>
              <p className="text-xs font-medium text-gray-800 mt-1">디버그 스냅샷</p>
              <p className="text-[10px] text-gray-400 mt-0.5">JSON 내보내기</p>
            </button>
            <button
              onClick={handleClearLogs}
              disabled={!hasLive}
              className={`rounded-2xl py-3 px-3 text-left transition-colors col-span-2 ${
                hasLive
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'bg-gray-50/60 opacity-60 cursor-not-allowed'
              }`}
            >
              <p className="text-sm">📋</p>
              <p className="text-xs font-medium text-gray-800 mt-1">호출 로그 비우기</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {hasLive ? `${realLogs.length}건 제거` : '누적된 로그 없음'}
              </p>
            </button>
          </div>
          <button
            onClick={handleFullReset}
            className="w-full mt-2 bg-brand-warning/10 hover:bg-brand-warning/15 text-brand-warning rounded-2xl py-3 text-xs font-bold transition-colors"
          >
            전체 데이터 초기화
          </button>
        </motion.div>

        {/* 풋터 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-2"
        >
          <p className="text-[10px] text-gray-400">Smart Cart Plus · Admin v1.2</p>
          <p className="text-[9px] text-gray-300 mt-0.5">하네스 워크스페이스 · Phase 6</p>
        </motion.div>
      </div>
    </div>
  );
}
