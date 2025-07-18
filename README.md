# 落雪公会管理系统 🏔️❄️

**Pokemon Snowfall Guild Management System**

一个现代化的宝可梦公会管理系统，采用模块化架构设计，支持自动模块加载，方便后续扩展。

## ✨ 功能特性

### 📊 数据展示
- **会员统计面板**: 实时显示会员总数、年费会员、月费会员、免费会员和逾期未续费会员数量
- **会员类型占比图**: 使用交互式饼图展示不同类型会员的分布情况
- **动态数据更新**: 支持实时数据刷新和动画过渡效果

### 🔧 技术架构
- **模块化设计**: 完全模块化的组件架构
- **自动加载器**: 新增模块自动注册和渲染
- **TypeScript**: 完整的类型安全支持
- **现代化技术栈**: Next.js 15 + React 19 + TypeScript

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- pnpm 8.0 或更高版本

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本
```bash
pnpm build
pnpm start
```

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局组件
│   ├── page.tsx           # 首页组件
│   └── globals.css        # 全局样式
├── components/            # 组件目录
│   ├── modules/           # 功能模块
│   │   ├── MemberStats.tsx      # 会员统计模块
│   │   ├── MemberTypeChart.tsx  # 会员类型图表模块
│   │   ├── WelcomePanel.tsx     # 欢迎面板模块
│   │   └── index.ts             # 模块自动导入
│   └── ModuleRenderer.tsx # 模块渲染器
├── lib/                   # 工具库
│   └── moduleLoader.ts    # 模块加载器
└── types/                 # 类型定义
    └── index.ts           # 通用类型
```

## 🔧 模块化架构

### 模块系统特性
- **自动注册**: 模块使用装饰器自动注册到系统
- **位置控制**: 支持 `main` 和 `sidebar` 两种布局位置
- **排序支持**: 通过 `order` 属性控制模块显示顺序
- **属性传递**: 支持向模块传递自定义属性

### 添加新模块

1. 在 `src/components/modules/` 目录下创建新模块文件
2. 使用 `@Module` 装饰器注册模块：

```typescript
import { Module } from '@/lib/moduleLoader';

function MyNewModule() {
  return (
    <div>
      {/* 你的模块内容 */}
    </div>
  );
}

export default Module({
  id: 'my-new-module',
  name: '我的新模块',
  position: 'main', // 或 'sidebar'
  order: 3
})(MyNewModule);
```

3. 在 `src/components/modules/index.ts` 中添加导入：

```typescript
import './MyNewModule';
```

模块将自动在页面中渲染！

## 🎨 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) - React 全栈框架
- **UI库**: [React 19](https://react.dev/) - 用户界面库
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/) - 原子化CSS框架
- **动画**: [Framer Motion](https://www.framer.com/motion/) - React动画库
- **图表**: [Recharts](https://recharts.org/) - React图表库
- **图标**: [Lucide React](https://lucide.dev/) - 现代图标库
- **语言**: [TypeScript](https://www.typescriptlang.org/) - 类型安全的JavaScript
- **包管理**: [pnpm](https://pnpm.io/) - 快速、节省磁盘空间的包管理器

### 代码规范
- 使用 ESLint 进行代码检查
- 遵循 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 样式使用 Tailwind CSS 类名

### 性能优化
- 使用 Next.js 15 的 Turbopack 构建工具
- 组件懒加载和代码分割
- 图片优化和字体优化
- 动画性能优化

### 部署建议
- **Vercel**: 推荐部署平台，零配置部署
- **Netlify**: 替代部署选择
- **自托管**: 支持 Docker 容器化部署

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 这个玩意真的有必要致谢吗

---

**落雪公会 Pokemon Snowfall Guild** © 2025

*愿每一位训练师都能在这里找到属于自己的冒险！* 🌟
