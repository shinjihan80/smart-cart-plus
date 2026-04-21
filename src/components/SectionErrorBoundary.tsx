'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 섹션 이름 (에러 메시지에 노출) */
  label?:   string;
  /** 그리드에서 전체 폭으로 렌더해야 하는 경우 'full'. 기본값은 단일 셀. */
  colSpan?: 'full';
}

interface State {
  hasError: boolean;
  message?: string;
}

/**
 * 한 섹션이 터져도 페이지 전체를 멈추지 않도록 분리된 에러 바운더리.
 * 폴백 UI는 작은 warning 카드 + "다시 시도" 버튼.
 */
export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 개발 모드에서만 콘솔에 상세 — 배포 시 외부 로깅 도입 가능
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[SectionErrorBoundary] ${this.props.label ?? 'unknown'}:`, error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (this.state.hasError) {
      const spanClass = this.props.colSpan === 'full' ? 'col-span-2' : '';
      return (
        <div className={`${spanClass} rounded-2xl border border-brand-warning/20 bg-brand-warning/5 px-4 py-3 flex items-start gap-3`}>
          <span className="text-lg">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-warning">
              {this.props.label ?? '이 섹션'}을 불러오지 못했어요
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
              일시적인 문제일 수 있어요. 다시 시도하거나 다른 메뉴에서 이어가세요.
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white border border-brand-warning/30 text-brand-warning hover:bg-brand-warning/10 transition-colors"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
