
export const translations = {
  zh: {
    nav: { dashboard: "看板", new: "记录", schedule: "日程", customers: "客户", me: "我的" },
    header: { title: "SaleSwift", subtitle: "智能销售副驾驶" },
    dashboard: { welcome: "早上好", deals: "个活跃商机待跟进", active_customers: "活跃客户", probability: "成交概率", pipeline: "管线额度", follow_up: "跟进周期", funnel: "销售阶段漏斗", funnel_empty: "添加互动后显示漏斗", recent: "最近复盘", all: "全部", start_recording: "在下方开始记录" },
    new: { title: "客户互动复盘", subtitle: "整理今日访谈，沉淀销售情报", record: "录音", stop: "停止", placeholder: "粘贴会议摘要或手动输入笔记...", analyze: "生成 AI 结构化报告", analyzing: "正在深度分析...", upload: "上传文件", change_file: "更换文件", match_customer: "自动匹配客户", recent_records: "最近复盘记录" },
    profile: { title: "个人中心", logout: "登出当前账户", settings: "账号设置", language: "语言设置", notifications: "消息提醒", security: "安全与隐私", avatar: "更换头像", theme: "界面风格", theme_classic: "经典蓝", theme_dark: "极客黑", theme_minimal: "清冷灰", theme_nature: "森林绿", ai_config: "AI 引擎配置", api_key_label: "自定义 API Key", api_key_placeholder: "粘贴 Google Gemini API Key...", model_select: "模型选择", model_flash: "Gemini 3 Flash", model_flash_desc: "速度快，延迟低", model_pro: "Gemini 3 Pro", model_pro_desc: "推理强，更智能" },
    schedule: { title: "日程安排", subtitle: "AI 自动同步销售待办", voice_title: "语音智能录入", voice_desc: "说出日程，AI 自动安排", start: "开始", recording: "记录中", completed: "已完成", pending: "待处理", empty: "暂无安排", manual: "手动录入", confirm: "确认安排", date: "日期", time: "时间", placeholder_title: "标题" },
    customers: { title: "客户档案库", subtitle: "支持语音搜索与快速建档", add: "新增", search: "搜索姓名、公司或标签...", filter_all: "全部", empty: "未找到档案", manual_title: "手动录入", name: "姓名 *", company: "公司 *", tags: "标签 (空格分隔)", save: "保存档案" },
    customer_detail: { 
      back: "返回列表", roleplay: "AI 对话演练", edit: "编辑", save: "保存", cancel: "取消", tags_label: "标签", email: "电子邮箱", phone: "电话号码", interactions: "访谈复盘", schedules: "计划待办", no_interactions: "暂无互动记录", no_schedules: "无待办事项", add_schedule: "新增", quick_schedule: "快速日程", subject: "主题 (如: 商务谈判)", confirm: "确认",
      course_plan: "AI 课程规划", gen_course: "生成规划", generating: "规划中...", plan_title: "定制培训方案", plan_objective: "培训目标", plan_modules: "课程模块", plan_resources: "推荐资源", no_plan: "暂无课程规划"
    },
    interaction_detail: {
      back: "返回", stage: "当前阶段", confidence: "AI 置信度", summary: "执行摘要", intelligence: "销售情报", pain_points: "核心痛点", key_interests: "关键兴趣", next_steps: "下一步计划", suggestions: "AI 改进建议", metrics: "表现评估", talk_ratio: "发言比", questions: "提问率", sentiment: "情绪基调", scheduled: "已入日程", deep_dive: "AI 深度解析", dive_loading: "正在深度挖掘情报...", dive_title: "情报深度解析", ask_placeholder: "针对该兴趣点深入追问...", send_qa: "追问", chat_user: "我的提问", chat_ai: "AI 解答",
      assistant_title: "AI 访谈助手", assistant_subtitle: "基于本次互动深度问答", assistant_placeholder: "询问任何关于本次访谈的问题...", assistant_empty: "有什么我可以帮您的吗？例如：帮我草拟一份跟进邮件。"
    }
  },
  en: {
    nav: { dashboard: "Board", new: "Record", schedule: "Plan", customers: "Clients", me: "Me" },
    header: { title: "SaleSwift", subtitle: "AI Sales Copilot" },
    dashboard: { welcome: "Good Morning", deals: "active deals to follow up", active_customers: "Active Clients", probability: "Win Prob.", pipeline: "Pipeline", follow_up: "Cycle", funnel: "Sales Funnel", funnel_empty: "Add interactions to see funnel", recent: "Recent Reviews", all: "All", start_recording: "Start recording below" },
    new: { title: "Meeting Review", subtitle: "Organize today's talk into intelligence", record: "Rec", stop: "Stop", placeholder: "Paste meeting notes or type here...", analyze: "Generate AI Report", analyzing: "Analyzing...", upload: "Upload", change_file: "Change", match_customer: "Match Client", recent_records: "Recent Interactions" },
    profile: { title: "Profile", logout: "Logout Account", settings: "Account Settings", language: "Language", notifications: "Notifications", security: "Security", avatar: "Change Avatar", theme: "Theme Style", theme_classic: "Classic", theme_dark: "Midnight", theme_minimal: "Minimal", theme_nature: "Nature", ai_config: "AI Configuration", api_key_label: "Custom API Key", api_key_placeholder: "Paste Gemini API Key...", model_select: "Model Selection", model_flash: "Gemini 3 Flash", model_flash_desc: "Fast & Efficient", model_pro: "Gemini 3 Pro", model_pro_desc: "Deep Reasoning" },
    schedule: { title: "Schedule", subtitle: "AI synced sales tasks", voice_title: "Smart Voice Input", voice_desc: "Speak your plans, AI handles it", start: "Start", recording: "Recording", completed: "Done", pending: "To Do", empty: "No tasks", manual: "Manual Entry", confirm: "Confirm", date: "Date", time: "Time", placeholder_title: "Title" },
    customers: { title: "Client Database", subtitle: "Voice search & quick entry", add: "Add", search: "Search name, company...", filter_all: "All", empty: "No records found", manual_title: "Manual Entry", name: "Name *", company: "Company *", tags: "Tags (space separated)", save: "Save Profile" },
    customer_detail: { 
      back: "Back", roleplay: "AI Roleplay", edit: "Edit", save: "Save", cancel: "Cancel", tags_label: "Tags", email: "Email", phone: "Phone", interactions: "Interactions", schedules: "Schedules", no_interactions: "No interactions yet", no_schedules: "No pending tasks", add_schedule: "Add", quick_schedule: "Quick Schedule", subject: "Subject (e.g. Negotiation)", confirm: "Confirm",
      course_plan: "AI Course Plan", gen_course: "Gen Plan", generating: "Planning...", plan_title: "Custom Curriculum", plan_objective: "Objective", plan_modules: "Modules", plan_resources: "Resources", no_plan: "No plan generated"
    },
    interaction_detail: {
      back: "Back", stage: "Stage", confidence: "Confidence", summary: "Executive Summary", intelligence: "Sales Intelligence", pain_points: "Pain Points", key_interests: "Key Interests", next_steps: "Next Steps", suggestions: "AI Suggestions", metrics: "Metrics", talk_ratio: "Talk Ratio", questions: "Questions", sentiment: "Sentiment", scheduled: "Scheduled", deep_dive: "AI Deep Dive", dive_loading: "Deep diving into intelligence...", dive_title: "Intelligence Breakdown", ask_placeholder: "Ask follow-up questions...", send_qa: "Ask", chat_user: "Question", chat_ai: "AI Response",
      assistant_title: "AI Review Assistant", assistant_subtitle: "Chat about this interaction", assistant_placeholder: "Ask anything about this review...", assistant_empty: "How can I help? Try: 'Draft a follow-up email based on this'."
    }
  },
  ja: {
    nav: { dashboard: "ボード", new: "记录", schedule: "予定", customers: "顧客", me: "マイ" },
    header: { title: "SaleSwift", subtitle: "AI セールスコパイロット" },
    dashboard: { welcome: "おはようございます", deals: "件の商談が進行中", active_customers: "有効顧客", probability: "成约率", pipeline: "パイプライン", follow_up: "サイクル", funnel: "販売ファンネル", funnel_empty: "インタラクションを追加すると表示されます", recent: "最近のレビュー", all: "すべて", start_recording: "以下で記録を開始" },
    new: { title: "商談レビュー", subtitle: "今日の面談を情報資産に", record: "録音", stop: "停止", placeholder: "メモを貼り付けるか输入してください...", analyze: "AIレポート作成", analyzing: "分析中...", upload: "アップロード", change_file: "変更", match_customer: "顧客を照合", recent_records: "最近の履歴" },
    profile: { title: "プロフィール", logout: "ログアウト", settings: "アカウント設定", language: "言語設定", notifications: "通知設定", security: "セキュリティ", avatar: "写真を変更", theme: "テーマ", theme_classic: "クラシック", theme_dark: "ダーク", theme_minimal: "ミニマル", theme_nature: "ネイチャー", ai_config: "AI 設定", api_key_label: "カスタム API Key", api_key_placeholder: "APIキーを貼り付け...", model_select: "モデル选择", model_flash: "Gemini 3 Flash", model_flash_desc: "高速・低遅延", model_pro: "Gemini 3 Pro", model_pro_desc: "高度な推论" },
    schedule: { title: "予定管理", subtitle: "AI自動同期のタスク", voice_title: "音声スマート输入", voice_desc: "予定を话すとAIが自动登録", start: "开始", recording: "録音中", completed: "完了", pending: "未完了", empty: "予定なし", manual: "手动输入", confirm: "予定を确定", date: "日付", time: "时间", placeholder_title: "タイトル" },
    customers: { title: "顧客データベース", subtitle: "音声検索とクイック登録", add: "新規", search: "名前、会社、タグで検索...", filter_all: "すべて", empty: "データが見つかりません", manual_title: "手动登録", name: "名前 *", company: "会社 *", tags: "タグ (スペース区切り)", save: "保存" },
    customer_detail: { 
      back: "戻る", roleplay: "AI ロールプレイ", edit: "編集", save: "保存", cancel: "キャンセル", tags_label: "タグ", email: "メール", phone: "電話番号", interactions: "商谈履歴", schedules: "今後の予定", no_interactions: "履歴なし", no_schedules: "予定なし", add_schedule: "追加", quick_schedule: "クイック予定", subject: "件名 (例: 商谈)", confirm: "确定",
      course_plan: "AI カリキュラム", gen_course: "作成", generating: "作成中...", plan_title: "カスタムプラン", plan_objective: "目的", plan_modules: "モジュール", plan_resources: "リソース", no_plan: "カリキュラムなし"
    },
    interaction_detail: {
      back: "戻る", stage: "ステージ", confidence: "確信度", summary: "エグゼクティブサマリー", intelligence: "セールスインテリジェンス", pain_points: "ペインポイント", key_interests: "主な関心事", next_steps: "次のステップ", suggestions: "AI改善提案", metrics: "パフォーマンス", talk_ratio: "発話比率", questions: "質問数", sentiment: "感情", scheduled: "予定済み", deep_dive: "AI深掘り", dive_loading: "情報を分析中...", dive_title: "インテリジェンス分析", ask_placeholder: "さらに質問する...", send_qa: "送信", chat_user: "質問", chat_ai: "AIの回答",
      assistant_title: "AI 相談室", assistant_subtitle: "今回の商谈について话す", assistant_placeholder: "この商谈について质问してください...", assistant_empty: "何かお手伝いしましょうか？例：フォローメールを作成して。"
    }
  },
  ko: {
    nav: { dashboard: "보드", new: "기록", schedule: "일정", customers: "고객", me: "내 정보" },
    header: { title: "SaleSwift", subtitle: "AI 영업 부조종사" },
    dashboard: { welcome: "좋은 아침입니다", deals: "개의 활성 딜 진행 중", active_customers: "활성 고객", probability: "성공 확률", pipeline: "파이프라인", follow_up: "주기", funnel: "영업 퍼널", funnel_empty: "상호작용 추가 시 표시됨", recent: "최근 리뷰", all: "전체", start_recording: "아래에서 기록 시작" },
    new: { title: "미팅 리뷰", subtitle: "오늘의 대화를 영업 정보로", record: "녹음", stop: "중지", placeholder: "회의 노트를 붙여넣거나 입력하세요...", analyze: "AI 리포트 생성", analyzing: "분석 중...", upload: "업로드", change_file: "변경", match_customer: "고객 매칭", recent_records: "최근 활동 내역" },
    profile: { title: "프로필", logout: "로그아웃", settings: "계정 설정", language: "언어 설정", notifications: "알림 설정", security: "보안", avatar: "아바타 변경", theme: "테마 스타일", theme_classic: "클래식", theme_dark: "다크", theme_minimal: "미니멀", theme_nature: "네이처", ai_config: "AI 설정", api_key_label: "사용자 API Key", api_key_placeholder: "API Key 붙여넣기...", model_select: "모델 선택", model_flash: "Gemini 3 Flash", model_flash_desc: "빠르고 효율적", model_pro: "Gemini 3 Pro", model_pro_desc: "심층 추론" },
    schedule: { title: "일정 관리", subtitle: "AI 자동 동기화 할 일", voice_title: "음성 스마트 입력", voice_desc: "일정을 말하면 AI가 자동 등록", start: "시작", recording: "녹음 중", completed: "완료", pending: "대기 중", empty: "일정 없음", manual: "수동 입력", confirm: "일정 확정", date: "날짜", time: "시간", placeholder_title: "제목" },
    customers: { title: "고객 데이터베이스", subtitle: "음성 검색 및 빠른 등록", add: "추가", search: "이름, 회사, 태그 검색...", filter_all: "전체", empty: "기록을 찾을 수 없습니다", manual_title: "수동 등록", name: "이름 *", company: "회사 *", tags: "태그 (공백으로 구분)", save: "프로필 저장" },
    customer_detail: { 
      back: "뒤로", roleplay: "AI 롤플레이", edit: "수정", save: "저장", cancel: "취소", tags_label: "태그", email: "이메일", phone: "전화번호", interactions: "상담 내역", schedules: "예정된 일정", no_interactions: "내역 없음", no_schedules: "일정 없음", add_schedule: "추가", quick_schedule: "빠른 일정", subject: "주제 (예: 가격 협상)", confirm: "확인",
      course_plan: "AI 교육 플랜", gen_course: "플랜 생성", generating: "생성 중...", plan_title: "맞춤형 커리큘럼", plan_objective: "목표", plan_modules: "커리큘럼", plan_resources: "추천 리소스", no_plan: "교육 플랜 없음"
    },
    interaction_detail: {
      back: "뒤로", stage: "단계", confidence: "신뢰도", summary: "핵심 요약", intelligence: "영업 인텔리전스", pain_points: "주요 고충", key_interests: "핵심 관심사", next_steps: "다음 단계", suggestions: "AI 개선 제안", metrics: "성과 지표", talk_ratio: "발화 비중", questions: "질문율", sentiment: "감정 상태", scheduled: "일정 등록됨", deep_dive: "AI 심층 분석", dive_loading: "정보를 심층 분석 중...", dive_title: "인텔리전스 분석", ask_placeholder: "추가 질문하기...", send_qa: "전송", chat_user: "질문", chat_ai: "AI 답변",
      assistant_title: "AI 분석 비서", assistant_subtitle: "이번 상담 관련 채팅", assistant_placeholder: "이 상담에 대해 궁금한 점을 물어보세요...", assistant_empty: "어떻게 도와드릴까요? 예: '이 내용을 바탕으로 후속 메일 써줘'."
    }
  }
};

// Add comment: Export Language type based on the keys of the translations object
export type Language = keyof typeof translations;
