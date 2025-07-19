// 自动导入所有模块
// 这个文件会自动加载所有模块并注册到模块系统中

// 导入所有模块组件
import './MemberStats';
import './MemberTypeChart';
import './MemberAnalytics';
import './WelcomePanel';
import './MessageSummary';

// 导出模块加载器函数
export { getAllModules, getModulesByPosition, getModule } from '@/lib/moduleLoader';

// 如果需要添加新模块，只需要：
// 1. 在 components/modules/ 目录下创建新的模块文件
// 2. 在该文件中添加对应的 import 语句
// 3. 模块会自动注册并在页面中渲染