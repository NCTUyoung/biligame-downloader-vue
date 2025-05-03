# 碧蓝航线Wiki下载器

一个用于从碧蓝航线Wiki下载舰船图片的桌面应用程序。

## 功能特性

- 从碧蓝航线Wiki解析和下载舰船数据
- 支持下载舰船立绘和相关图片
- 批量下载功能
- 自定义下载路径
- 错误处理和重试机制

## 技术栈

- Vue 3
- TypeScript
- Electron
- Ant Design Vue
- Pinia 状态管理

## 安装与使用

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建应用

```bash
# 构建生产版本
npm run build
```

构建完成后，可在`release`目录下找到应用安装程序。

## 项目结构

- `src/` - Vue前端代码
  - `components/` - Vue组件
  - `stores/` - Pinia状态管理
  - `services/` - 服务层代码
- `electron/` - Electron主进程代码
  - `main.ts` - 主进程入口
  - `preload.ts` - 预加载脚本

## 许可证

MIT
