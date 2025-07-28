// 模块类型定义
export interface ModuleConfig {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  position: 'main' | 'sidebar';
  order: number;
  props?: Record<string, any>;
}

// 会员数据类型
export interface MemberStats {
  total: number;
  annual: number;
  monthly: number;
  free: number;
  overdue: number;
}

// 会员类型占比数据
export interface MemberTypeRatio {
  name: string;
  value: number;
  color: string;
}

// 一言API响应类型
export interface HitokotoResponse {
  hitokoto: string;
  from: string;
  id: number;
  uuid: string;
  commit_from: string;
  creator: string;
  creator_uid: number;
  reviewer: number;
  type: string;
  length: number;
}