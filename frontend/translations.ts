
export const translations = {
  zh: {
    nav: { dashboard: "看板", new: "复盘", schedule: "日程", customers: "客户", me: "我的" },
    header: { title: "SaleSwift AI", subtitle: "智能销售副驾驶" },
    new: { title: "客户互动复盘", subtitle: "整理今日访谈，沉淀销售情报", record: "录音", stop: "停止", manual_input: "手动输入", placeholder: "粘贴访谈摘要或手动输入访谈内容...", analyze: "生成 AI 结构化报告", analyzing: "正在深度分析...", upload: "上传文件", change_file: "更换文件", match_customer: "自动匹配客户", recent_records: "最近复盘记录", all: "全部", link_profile_title: "关联客户档案", cancel: "取消", new_client: "新建客户", create_new_client: "新建客户", name_placeholder: "姓名", company_placeholder: "公司", confirm_review: "确认并查看", saving: "保存中..." },
    profile: { title: "个人中心", logout: "登出当前账户", settings: "账号设置", language: "语言设置", notifications: "消息提醒", security: "安全与隐私", avatar: "更换头像", theme: "界面风格", theme_classic: "经典蓝", theme_dark: "极客黑", theme_orange: "活力橙", theme_nature: "森林绿", ai_config: "AI 引擎配置", api_key_label: "自定义 API Key", api_key_placeholder: "粘贴 Google Gemini API Key...", model_select: "模型选择", model_flash: "Gemini 3 Flash", model_flash_desc: "速度快，延迟低", model_pro: "Gemini 3 Pro", model_pro_desc: "推理强，更智能" },
    schedule: { title: "日程安排", subtitle: "AI 自动同步销售待办", voice_title: "语音智能录入", voice_desc: "说出日程，AI 自动安排", start: "开始", recording: "记录中", completed: "已完成", pending: "待处理", empty: "暂无安排", manual: "手动录入", confirm: "确认安排", date: "日期", time: "时间", placeholder_title: "标题", edit: "编辑日程" },
    customers: { title: "客户档案库", subtitle: "支持语音搜索与快速建档", add: "新增", search: "搜索姓名、公司或标签...", filter_all: "全部", empty: "未找到档案", manual_title: "手动录入", name: "姓名 *", company: "公司 *", tags: "标签 (空格分隔)", save: "保存档案", funnel: "销售阶段漏斗", funnel_empty: "添加客户或互动后显示漏斗", stage_prospecting: "潜在", stage_qualification: "需求", stage_proposal: "方案", stage_negotiation: "谈判", stage_closed_won: "赢单", stage_closed_lost: "丢单", customer_count: "客户数" },
    customer_detail: { 
      back: "返回列表", roleplay: "AI 对话演练", edit: "编辑", save: "保存", cancel: "取消", tags_label: "标签", email: "电子邮箱", phone: "电话号码", interactions: "访谈复盘", schedules: "待办日程", no_interactions: "暂无互动记录", no_schedules: "暂无待办日程", add_schedule: "新增", quick_schedule: "快速日程", subject: "主题 (如: 商务谈判)", confirm: "确认",
      course_plan: "AI 课程规划", gen_course: "生成规划", generating: "规划中...", plan_title: "定制培训方案", plan_objective: "培训目标", plan_modules: "课程模块", plan_resources: "推荐资源", no_plan: "暂无课程规划", not_found: "未找到该客户", back_to_list: "返回列表", name_placeholder: "姓名", role_placeholder: "职位", company_placeholder: "公司"
    },
    interaction_detail: {
      back: "返回", stage: "当前阶段", confidence: "AI 置信度", summary: "执行摘要", intelligence: "销售情报", pain_points: "核心痛点", key_interests: "关键兴趣", next_steps: "下一步计划", suggestions: "AI 改进建议", metrics: "表现评估", talk_ratio: "发言比", questions: "提问率", sentiment: "情绪基调", scheduled: "已入日程", deep_dive: "AI解析", dive_loading: "正在深度挖掘情报...", dive_title: "AI解析", ask_placeholder: "针对该兴趣点深入追问...", send_qa: "追问", chat_user: "我的提问", chat_ai: "AI 解答",
      assistant_title: "AI 访谈助手", assistant_subtitle: "基于本次互动深度问答", assistant_placeholder: "询问任何关于本次访谈的问题...", assistant_empty: "有什么我可以帮您的吗？例如：帮我草拟一份跟进邮件。", not_found: "未找到该复盘", back_to_list: "返回列表"
    },
    history: { title: "全部复盘", subtitle: "所有复盘记录和结构化数据", search_placeholder: "通过姓名、公司或摘要内容搜索...", filter: "筛选", sort: "排序", filter_all: "全部", empty_title: "未找到匹配的复盘记录", empty_hint: "尝试更换关键词或使用语音搜索", detail: "详情", date: "日期", customer_company: "客户与公司", stage: "当前阶段", sentiment: "情绪基调", action: "操作", voice_search: "语音搜索", stop_recording: "停止录音", report: "汇报", report_title: "生成汇报", date_range: "日期范围", today: "今日", yesterday: "昨天", this_week: "本周", last_7_days: "最近7天", last_week: "上周", last_30_days: "最近30天", this_month: "本月", last_month: "上月", this_quarter: "本季度", last_quarter: "上季度", this_year: "今年", last_year: "去年", custom: "自定义", start_date: "开始日期", end_date: "结束日期", generate: "汇总", copy: "复制", report_placeholder: "汇报内容将显示在这里...", generating_report: "正在生成汇报..." },
    login: { 
      forget_password: "忘记密码？",
      forget_password_coming_soon: "功能开发中，敬请期待。",
      title: "SaleSwift AI",
      subtitle: "智能销售副驾驶系统",
      email_placeholder: "请输入电子邮箱",
      password_placeholder: "请输入登录密码",
      login_button: "立即登录",
      or: "或者",
      no_account: "还没有账号？",
      register_link: "立即免费注册",
      security_text: "企业级 OAuth 2.0 数据加密保护"
    },
    register: {
      title: "加入 SaleSwift",
      subtitle: "让每一场谈话都成为增长引擎",
      name_placeholder: "您的姓名",
      email_placeholder: "工作邮箱",
      password_placeholder: "设置密码",
      confirm_password_placeholder: "确认密码",
      register_button: "立即加入",
      quick_way: "快捷方式",
      has_account: "已有账号？",
      login_link: "立即返回登录",
      security_text: "您的隐私受到企业级安全标准的保护"
    }
  },
  en: {
    nav: { dashboard: "Board", new: "Review", schedule: "Plan", customers: "Clients", me: "Me" },
    header: { title: "SaleSwift AI", subtitle: "AI Sales Copilot" },
    new: { title: "Meeting Review", subtitle: "Organize today's talk into intelligence", record: "Rec", stop: "Stop", manual_input: "Type", placeholder: "Paste interview summary or type interview content...", analyze: "Generate AI Report", analyzing: "Analyzing...", upload: "Upload", change_file: "Change", match_customer: "Match Client", recent_records: "Recent Interactions", all: "All", link_profile_title: "Link Customer Profile", cancel: "Cancel", new_client: "New Client", create_new_client: "Create New Client", name_placeholder: "Name", company_placeholder: "Company", confirm_review: "Confirm & Review", saving: "Saving..." },
    profile: { title: "Profile", logout: "Logout Account", settings: "Account Settings", language: "Language", notifications: "Notifications", security: "Security", avatar: "Change Avatar", theme: "Theme Style", theme_classic: "Classic", theme_dark: "Midnight", theme_orange: "Vibrant", theme_nature: "Nature", ai_config: "AI Configuration", api_key_label: "Custom API Key", api_key_placeholder: "Paste Gemini API Key...", model_select: "Model Selection", model_flash: "Gemini 3 Flash", model_flash_desc: "Fast & Efficient", model_pro: "Gemini 3 Pro", model_pro_desc: "Deep Reasoning" },
    schedule: { title: "Schedule", subtitle: "AI synced sales tasks", voice_title: "Smart Voice Input", voice_desc: "Speak your plans, AI handles it", start: "Start", recording: "Recording", completed: "Done", pending: "To Do", empty: "No tasks", manual: "Manual Entry", confirm: "Confirm", date: "Date", time: "Time", placeholder_title: "Title", edit: "Edit Schedule" },
    customers: { title: "Client Database", subtitle: "Voice search & quick entry", add: "Add", search: "Search name, company...", filter_all: "All", empty: "No records found", manual_title: "Manual Entry", name: "Name *", company: "Company *", tags: "Tags (space separated)", save: "Save Profile", funnel: "Sales Funnel", funnel_empty: "Add clients or interactions to see funnel", stage_prospecting: "Lead", stage_qualification: "Qual", stage_proposal: "Prop", stage_negotiation: "Neg", stage_closed_won: "Won", stage_closed_lost: "Lost", customer_count: "Clients" },
    customer_detail: { 
      back: "Back", roleplay: "AI Roleplay", edit: "Edit", save: "Save", cancel: "Cancel", tags_label: "Tags", email: "Email", phone: "Phone", interactions: "Interactions", schedules: "To-Do Schedule", no_interactions: "No interactions yet", no_schedules: "No to-do items", add_schedule: "Add", quick_schedule: "Quick Schedule", subject: "Subject (e.g. Negotiation)", confirm: "Confirm",
      course_plan: "AI Course Plan", gen_course: "Gen Plan", generating: "Planning...", plan_title: "Custom Curriculum", plan_objective: "Objective", plan_modules: "Modules", plan_resources: "Resources", no_plan: "No plan generated", not_found: "Customer not found", back_to_list: "Back to list", name_placeholder: "Name", role_placeholder: "Role", company_placeholder: "Company"
    },
    interaction_detail: {
      back: "Back", stage: "Stage", confidence: "Confidence", summary: "Executive Summary", intelligence: "Sales Intelligence", pain_points: "Pain Points", key_interests: "Key Interests", next_steps: "Next Steps", suggestions: "AI Suggestions", metrics: "Metrics", talk_ratio: "Talk Ratio", questions: "Questions", sentiment: "Sentiment", scheduled: "Scheduled", deep_dive: "AI Parse", dive_loading: "Deep diving into intelligence...", dive_title: "AI Parse", ask_placeholder: "Ask follow-up questions...", send_qa: "Ask", chat_user: "Question", chat_ai: "AI Response",
      assistant_title: "AI Review Assistant", assistant_subtitle: "Chat about this interaction", assistant_placeholder: "Ask anything about this review...", assistant_empty: "How can I help? Try: 'Draft a follow-up email based on this'.", not_found: "Review not found", back_to_list: "Back to list"
    },
    history: { title: "All Reviews", subtitle: "All your review records and structured data", search_placeholder: "Search by name, company or summary...", filter: "Filter", sort: "Sort", filter_all: "All", empty_title: "No matching reviews", empty_hint: "Try different keywords or voice search", detail: "Detail", date: "Date", customer_company: "Customer & Company", stage: "Stage", sentiment: "Sentiment", action: "Action", voice_search: "Voice search", stop_recording: "Stop recording", report: "Report", report_title: "Generate Report", date_range: "Date Range", today: "Today", yesterday: "Yesterday", this_week: "This Week", last_7_days: "Last 7 Days", last_week: "Last Week", last_30_days: "Last 30 Days", this_month: "This Month", last_month: "Last Month", this_quarter: "This Quarter", last_quarter: "Last Quarter", this_year: "This Year", last_year: "Last Year", custom: "Custom", start_date: "Start Date", end_date: "End Date", generate: "Generate", copy: "Copy", report_placeholder: "Report content will appear here...", generating_report: "Generating report..." },
    login: { 
      forget_password: "Forgot Password?",
      forget_password_coming_soon: "Coming soon. Stay tuned.",
      title: "SaleSwift AI",
      subtitle: "AI Sales Copilot",
      email_placeholder: "Email",
      password_placeholder: "Password",
      login_button: "Sign In",
      or: "OR",
      no_account: "Don't have an account?",
      register_link: "Sign up now",
      security_text: "Enterprise OAuth 2.0 Data Encryption"
    },
    register: {
      title: "Join SaleSwift",
      subtitle: "Turn every conversation into growth",
      name_placeholder: "Your Name",
      email_placeholder: "Work Email",
      password_placeholder: "Set Password",
      confirm_password_placeholder: "Confirm Password",
      register_button: "Sign Up",
      quick_way: "Quick Sign Up",
      has_account: "Already have an account?",
      login_link: "Sign in",
      security_text: "Your privacy is protected by enterprise security standards"
    }
  },
  ja: {
    nav: { dashboard: "ボード", new: "復盤", schedule: "予定", customers: "顧客", me: "マイ" },
    header: { title: "SaleSwift AI", subtitle: "AI セールスコパイロット" },
    new: { title: "商談レビュー", subtitle: "今日の面談を情報資産に", record: "録音", stop: "停止", manual_input: "手入力", placeholder: "インタビュー要約を貼り付けるか、インタビュー内容を入力してください...", analyze: "AIレポート作成", analyzing: "分析中...", upload: "アップロード", change_file: "変更", match_customer: "顧客を照合", recent_records: "最近の履歴", all: "すべて", link_profile_title: "顧客プロフィールをリンク", cancel: "キャンセル", new_client: "新規顧客", create_new_client: "新規顧客作成", name_placeholder: "名前", company_placeholder: "会社", confirm_review: "確認して表示", saving: "保存中..." },
    profile: { title: "プロフィール", logout: "ログアウト", settings: "アカウント設定", language: "言語設定", notifications: "通知設定", security: "セキュリティ", avatar: "写真を変更", theme: "テーマ", theme_classic: "クラシック", theme_dark: "ダーク", theme_orange: "ビタント", theme_nature: "ネイチャー", ai_config: "AI 設定", api_key_label: "カスタム API Key", api_key_placeholder: "APIキーを貼り付け...", model_select: "モデル选择", model_flash: "Gemini 3 Flash", model_flash_desc: "高速・低遅延", model_pro: "Gemini 3 Pro", model_pro_desc: "高度な推论" },
    schedule: { title: "予定管理", subtitle: "AI自動同期のタスク", voice_title: "音声スマート输入", voice_desc: "予定を话すとAIが自动登録", start: "开始", recording: "録音中", completed: "完了", pending: "未完了", empty: "予定なし", manual: "手动输入", confirm: "予定を确定", date: "日付", time: "时间", placeholder_title: "タイトル", edit: "予定を編集" },
    customers: { title: "顧客データベース", subtitle: "音声検索とクイック登録", add: "新規", search: "名前、会社、タグで検索...", filter_all: "すべて", empty: "データが見つかりません", manual_title: "手动登録", name: "名前 *", company: "会社 *", tags: "タグ (スペース区切り)", save: "保存", funnel: "販売ファンネル", funnel_empty: "顧客またはインタラクションを追加すると表示されます", stage_prospecting: "潜在", stage_qualification: "需要", stage_proposal: "提案", stage_negotiation: "交渉", stage_closed_won: "成約", stage_closed_lost: "失注", customer_count: "顧客数" },
    customer_detail: { 
      back: "戻る", roleplay: "AI ロールプレイ", edit: "編集", save: "保存", cancel: "キャンセル", tags_label: "タグ", email: "メール", phone: "電話番号", interactions: "商谈履歴", schedules: "To-Do 予定", no_interactions: "履歴なし", no_schedules: "予定なし", add_schedule: "追加", quick_schedule: "クイック予定", subject: "件名 (例: 商谈)", confirm: "确定",
      course_plan: "AI カリキュラム", gen_course: "作成", generating: "作成中...", plan_title: "カスタムプラン", plan_objective: "目的", plan_modules: "モジュール", plan_resources: "リソース", no_plan: "カリキュラムなし", not_found: "顧客が見つかりません", back_to_list: "一覧に戻る", name_placeholder: "名前", role_placeholder: "役職", company_placeholder: "会社"
    },
    interaction_detail: {
      back: "戻る", stage: "ステージ", confidence: "確信度", summary: "エグゼクティブサマリー", intelligence: "セールスインテリジェンス", pain_points: "ペインポイント", key_interests: "主な関心事", next_steps: "次のステップ", suggestions: "AI改善提案", metrics: "パフォーマンス", talk_ratio: "発話比率", questions: "質問数", sentiment: "感情", scheduled: "予定済み", deep_dive: "AI解析", dive_loading: "情報を分析中...", dive_title: "AI解析", ask_placeholder: "さらに質問する...", send_qa: "送信", chat_user: "質問", chat_ai: "AIの回答",
      assistant_title: "AI 相談室", assistant_subtitle: "今回の商谈について话す", assistant_placeholder: "この商谈について质问してください...", assistant_empty: "何かお手伝いしましょうか？例：フォローメールを作成して。", not_found: "レビューが見つかりません", back_to_list: "一覧に戻る"
    },
    history: { title: "すべての復盤", subtitle: "すべての復盤記録と構造化データ", search_placeholder: "名前、会社、要約で検索...", filter: "フィルター", sort: "並び替え", filter_all: "すべて", empty_title: "一致する復盤記録がありません", empty_hint: "キーワードや音声検索をお試しください", detail: "詳細", date: "日付", customer_company: "顧客・会社", stage: "ステージ", sentiment: "感情", action: "操作", voice_search: "音声検索", stop_recording: "録音停止", report: "レポート", report_title: "レポート生成", date_range: "期間", today: "今日", yesterday: "昨日", this_week: "今週", last_7_days: "過去7日", last_week: "先週", last_30_days: "過去30日", this_month: "今月", last_month: "先月", this_quarter: "今四半期", last_quarter: "前四半期", this_year: "今年", last_year: "去年", custom: "カスタム", start_date: "開始日", end_date: "終了日", generate: "生成", copy: "コピー", report_placeholder: "レポート内容がここに表示されます...", generating_report: "レポートを生成中..." },
    login: { 
      forget_password: "パスワードをお忘れですか？",
      forget_password_coming_soon: "準備中です。少々お待ちください。",
      title: "SaleSwift AI",
      subtitle: "AI セールスコパイロット",
      email_placeholder: "メールアドレスを入力",
      password_placeholder: "パスワードを入力",
      login_button: "ログイン",
      or: "または",
      no_account: "アカウントをお持ちでない場合",
      register_link: "今すぐ登録",
      security_text: "エンタープライズ OAuth 2.0 データ暗号化"
    },
    register: {
      title: "SaleSwiftに参加",
      subtitle: "すべての会話を成長のエンジンに",
      name_placeholder: "お名前",
      email_placeholder: "仕事用メール",
      password_placeholder: "パスワードを設定",
      confirm_password_placeholder: "パスワードを確認",
      register_button: "今すぐ参加",
      quick_way: "クイック登録",
      has_account: "すでにアカウントをお持ちですか？",
      login_link: "ログインに戻る",
      security_text: "あなたのプライバシーはエンタープライズセキュリティ標準で保護されています"
    }
  },
  ko: {
    nav: { dashboard: "보드", new: "리뷰", schedule: "일정", customers: "고객", me: "내 정보" },
    header: { title: "SaleSwift AI", subtitle: "AI 영업 부조종사" },
    new: { title: "미팅 리뷰", subtitle: "오늘의 대화를 영업 정보로", record: "녹음", stop: "중지", manual_input: "입력", placeholder: "인터뷰 요약을 붙여넣거나 인터뷰 내용을 입력하세요...", analyze: "AI 리포트 생성", analyzing: "분석 중...", upload: "업로드", change_file: "변경", match_customer: "고객 매칭", recent_records: "최근 활동 내역", all: "전체", link_profile_title: "고객 프로필 연결", cancel: "취소", new_client: "신규 고객", create_new_client: "신규 고객 생성", name_placeholder: "이름", company_placeholder: "회사", confirm_review: "확인 및 보기", saving: "저장 중..." },
    profile: { title: "프로필", logout: "로그아웃", settings: "계정 설정", language: "언어 설정", notifications: "알림 설정", security: "보안", avatar: "아바타 변경", theme: "테마 스타일", theme_classic: "클래식", theme_dark: "다크", theme_orange: "비브란트", theme_nature: "네이처", ai_config: "AI 설정", api_key_label: "사용자 API Key", api_key_placeholder: "API Key 붙여넣기...", model_select: "모델 선택", model_flash: "Gemini 3 Flash", model_flash_desc: "빠르고 효율적", model_pro: "Gemini 3 Pro", model_pro_desc: "심층 추론" },
    schedule: { title: "일정 관리", subtitle: "AI 자동 동기화 할 일", voice_title: "음성 스마트 입력", voice_desc: "일정을 말하면 AI가 자동 등록", start: "시작", recording: "녹음 중", completed: "완료", pending: "대기 중", empty: "일정 없음", manual: "수동 입력", confirm: "일정 확정", date: "날짜", time: "시간", placeholder_title: "제목", edit: "일정 편집" },
    customers: { title: "고객 데이터베이스", subtitle: "음성 검색 및 빠른 등록", add: "추가", search: "이름, 회사, 태그 검색...", filter_all: "전체", empty: "기록을 찾을 수 없습니다", manual_title: "수동 등록", name: "이름 *", company: "회사 *", tags: "태그 (공백으로 구분)", save: "프로필 저장", funnel: "영업 퍼널", funnel_empty: "고객 또는 상호작용 추가 시 표시됨", stage_prospecting: "잠재", stage_qualification: "수요", stage_proposal: "제안", stage_negotiation: "협상", stage_closed_won: "성사", stage_closed_lost: "실패", customer_count: "고객 수" },
    customer_detail: { 
      back: "뒤로", roleplay: "AI 롤플레이", edit: "수정", save: "저장", cancel: "취소", tags_label: "태그", email: "이메일", phone: "전화번호", interactions: "상담 내역", schedules: "할 일 일정", no_interactions: "내역 없음", no_schedules: "할 일 없음", add_schedule: "추가", quick_schedule: "빠른 일정", subject: "주제 (예: 가격 협상)", confirm: "확인",
      course_plan: "AI 교육 플랜", gen_course: "플랜 생성", generating: "생성 중...", plan_title: "맞춤형 커리큘럼", plan_objective: "목표", plan_modules: "커리큘럼", plan_resources: "추천 리소스", no_plan: "교육 플랜 없음", not_found: "고객을 찾을 수 없습니다", back_to_list: "목록으로", name_placeholder: "이름", role_placeholder: "직책", company_placeholder: "회사"
    },
    interaction_detail: {
      back: "뒤로", stage: "단계", confidence: "신뢰도", summary: "핵심 요약", intelligence: "영업 인텔리전스", pain_points: "주요 고충", key_interests: "핵심 관심사", next_steps: "다음 단계", suggestions: "AI 개선 제안", metrics: "성과 지표", talk_ratio: "발화 비중", questions: "질문율", sentiment: "감정 상태", scheduled: "일정 등록됨", deep_dive: "AI 분석", dive_loading: "정보를 심층 분석 중...", dive_title: "AI 분석", ask_placeholder: "추가 질문하기...", send_qa: "전송", chat_user: "질문", chat_ai: "AI 답변",
      assistant_title: "AI 분석 비서", assistant_subtitle: "이번 상담 관련 채팅", assistant_placeholder: "이 상담에 대해 궁금한 점을 물어보세요...", assistant_empty: "어떻게 도와드릴까요? 예: '이 내용을 바탕으로 후속 메일 써줘'.", not_found: "리뷰를 찾을 수 없습니다", back_to_list: "목록으로"
    },
    history: { title: "전체 리뷰", subtitle: "모든 리뷰 기록과 구조화된 데이터", search_placeholder: "이름, 회사, 요약으로 검색...", filter: "필터", sort: "정렬", filter_all: "전체", empty_title: "일치하는 리뷰 기록이 없습니다", empty_hint: "다른 키워드나 음성 검색을 시도해 보세요", detail: "상세", date: "날짜", customer_company: "고객 및 회사", stage: "단계", sentiment: "감정", action: "작업", voice_search: "음성 검색", stop_recording: "녹음 중지", report: "리포트", report_title: "리포트 생성", date_range: "기간", today: "오늘", yesterday: "어제", this_week: "이번 주", last_7_days: "최근 7일", last_week: "지난 주", last_30_days: "최근 30일", this_month: "이번 달", last_month: "지난 달", this_quarter: "이번 분기", last_quarter: "지난 분기", this_year: "올해", last_year: "작년", custom: "사용자 지정", start_date: "시작일", end_date: "종료일", generate: "생성", copy: "복사", report_placeholder: "리포트 내용이 여기에 표시됩니다...", generating_report: "리포트 생성 중..." },
    login: { 
      forget_password: "비밀번호를 잊으셨나요?",
      forget_password_coming_soon: "준비 중입니다. 곧 만나요.",
      title: "SaleSwift AI",
      subtitle: "AI 영업 부조종사",
      email_placeholder: "이메일 입력",
      password_placeholder: "비밀번호 입력",
      login_button: "로그인",
      or: "또는",
      no_account: "계정이 없으신가요?",
      register_link: "지금 가입하기",
      security_text: "엔터프라이즈 OAuth 2.0 데이터 암호화"
    },
    register: {
      title: "SaleSwift 가입",
      subtitle: "모든 대화를 성장의 엔진으로",
      name_placeholder: "이름",
      email_placeholder: "직장 이메일",
      password_placeholder: "비밀번호 설정",
      confirm_password_placeholder: "비밀번호 확인",
      register_button: "지금 가입",
      quick_way: "빠른 가입",
      has_account: "이미 계정이 있으신가요?",
      login_link: "로그인으로 돌아가기",
      security_text: "귀하의 개인정보는 엔터프라이즈 보안 표준으로 보호됩니다"
    }
  }
};

// Add comment: Export Language type based on the keys of the translations object
export type Language = keyof typeof translations;
