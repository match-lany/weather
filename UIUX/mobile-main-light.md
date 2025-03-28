# 移动端主页设计 - 明亮主题

```
[移动端主页 - 明亮主题]
┌─────────────────────────────┐
│                             │
│  北京市 ☀️                  ↓ │ <- 城市名称与切换按钮
│  2023年3月27日 周一 15:30     │ <- 日期与时间
│                             │
│         23°C                │ <- 当前温度(大字号)
│      晴朗                    │ <- 天气状况
│                             │
│  体感温度: 22°C              │
│  ↑24°C ↓15°C                │ <- 今日最高/最低温度
│                             │
│ ┌─────────────────────────┐ │
│ │  详细信息                 │ │ <- 可折叠面板
│ │                         │ │
│ │  💨 西北风 3级            │ │ <- 风向风力
│ │  💧 相对湿度 45%          │ │ <- 相对湿度
│ │  🔍 能见度 10km           │ │ <- 能见度  
│ │  📊 气压 1015hPa          │ │ <- 大气压强
│ │  🌅 06:12 🌇 18:48        │ │ <- 日出日落
│ │  ☔ 降水概率 10%           │ │ <- 降水概率
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│  今日预报                    │ <- 24小时预报标题
│ ┌───┬───┬───┬───┬───┬───┐   │
│ │16时│17时│18时│19时│20时│21时│  <- 时间
│ │ 23°│ 21°│ 19°│ 17°│ 16°│ 15°│  <- 温度
│ │ ☀️ │ ☀️ │ 🌤️ │ 🌙 │ 🌙 │ 🌙 │  <- 天气图标
│ └───┴───┴───┴───┴───┴───┘   │
│         < 滑动查看更多 >      │ <- 水平滚动提示
│                             │
│  未来3天                     │ <- 3天预报标题
│ ┌─────────┬─────────┬─────────┐
│ │  周二    │  周三    │  周四   │ <- 星期
│ │  3/28   │  3/29   │  3/30  │ <- 日期
│ │   ☀️    │   ⛅    │   🌧️   │ <- 天气图标
│ │ 25°/14° │ 23°/12° │ 20°/10°│ <- 最高/最低温度
│ └─────────┴─────────┴─────────┘
│                             │
│  最后更新: 15:15             │ <- 数据更新时间
│                             │
└─────────────────────────────┘
```

## 设计说明

### 布局结构
- 采用单列垂直滚动布局，最重要的信息位于顶部
- 内容按照重要性从上到下排列：当前天气 > 详细信息 > 24小时预报 > 3天预报
- 使用卡片式设计区分不同内容块

### 色彩方案
- 背景色：纯白色 (#FFFFFF)
- 主要文字：深灰色 (#333333)
- 次要文字：中灰色 (#666666)
- 强调色：天蓝色 (#4A90E2)
- 分割线：浅灰色 (#EEEEEE)

### 排版
- 城市名称：18pt, 粗体
- 当前温度：48pt, 粗体
- 天气状况：20pt, 常规
- 详细信息：14pt, 常规
- 预报标题：16pt, 半粗体
- 预报数据：14pt, 常规

### 交互设计
- 城市名称旁的下拉箭头点击后进入城市选择界面
- 详细信息面板可展开/折叠
- 24小时预报支持水平滑动查看更多
- 页面支持下拉刷新更新天气数据 