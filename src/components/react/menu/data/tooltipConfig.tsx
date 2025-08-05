// components/react/menu/data/tooltipConfig.tsx (새로운 파일)
import { MainMenuType } from "@store/menuStore";

export const tooltipsByLevel: {
  1: Record<MainMenuType, string>;
  2: Record<string, string>;
  3: Record<string, string>;
} = {
  1: {
    // 메인메뉴 레벨
    Statistics: "통계 및 분석",
    Vehicle: "차량 관리",
    Operation: "운영 관리",
    MapBuilder: "도로 편집기",
  },
  2: {
    // 서브메뉴 레벨
    "stats-menu-1": "실시간 데이터 분석",
    "stats-menu-2": "일일 통계 리포트",
    "stats-menu-3": "주간 통계 리포트",
    "stats-menu-4": "월간 통계 리포트",
    "stats-menu-5": "성능 분석",

    "vehicle-menu-1": "전체 차량 현황",
    "vehicle-menu-2": "운행중인 차량",
    "vehicle-menu-3": "대기중인 차량",
    "vehicle-menu-4": "정비중인 차량",
    "vehicle-menu-5": "차량 이력 관리",

    "operation-menu-1": "경로 관리",
    "operation-menu-2": "스케줄 관리",
    "operation-menu-3": "실시간 모니터링",
    "operation-menu-4": "알림 관리",
    "operation-menu-5": "운영 로그",

    "map-menu-1": "직선 도로 생성",
    "map-menu-2": "90° 곡선 도로",
    "map-menu-3": "180° 곡선 도로",
    "map-menu-4": "S자 곡선 도로",
    "map-menu-5": "H자 교차로",
    "map-menu-6": "R자 회전교차로",
    "map-menu-7": "다중 교차로",
    "map-menu-8": "교량 및 고가도로",
    "map-menu-9": "사용자 정의 도로",
  },
  3: {
    // 서브서브메뉴 레벨 (필요한 경우에만)
    // 예: 'realtime-dashboard': '실시간 대시보드',
    // 'realtime-alerts': '실시간 알림 관리'
  },
};
