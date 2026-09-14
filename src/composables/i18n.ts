import { ref, computed } from 'vue';

export type Locale = 'th' | 'en' | 'ja' | 'zh' | 'ko' | 'es' | 'fr' | 'de' | 'ru';

export interface LanguageOption {
  code: Locale;
  label: string;
  englishName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'th', label: 'ภาษาไทย', englishName: 'Thai' },
  { code: 'en', label: 'English', englishName: 'English' },
  { code: 'ja', label: '日本語', englishName: 'Japanese' },
  { code: 'zh', label: '简体中文', englishName: 'Chinese' },
  { code: 'ko', label: '한국어', englishName: 'Korean' },
  { code: 'es', label: 'Español', englishName: 'Spanish' },
  { code: 'fr', label: 'Français', englishName: 'French' },
  { code: 'de', label: 'Deutsch', englishName: 'German' },
  { code: 'ru', label: 'Русский', englishName: 'Russian' }
];

export interface Translations {
  // Navigation
  navHome: string;
  navPlayground: string;
  navSettings: string;
  
  // Header / Hero
  heroTitle: string;
  heroSubtitle: string;
  
  // Search Bar
  searchPlaceholder: string;
  refreshGameList: string;
  refreshing: string;
  searchResultHelp: string;
  addGameToList: string;
  id: string;
  executables: string;
  questFoundTitle?: string;
  fetchingQuest?: string;
  questTargetDuration?: string;
  questNotFound?: string;
  
  // Games section
  gamesTitle: string;
  noGamesSelectedSubtitle: string;
  noGamesYet: string;
  noGamesYetDesc: string;
  remove: string;
  running: string;
  verified: string;
  
  // Game Actions
  gameActionsTitle: string;
  selectGamePrompt: string;
  testRPC: string;
  disconnectRPC: string;
  statusTitle: string;
  statusHint: string;
  notPlaying: string;
  currentlyPlaying: string;
  selectExecutableToLaunch: string;
  play: string;
  stop: string;
  
  // Settings
  settingsTitle: string;
  settingsSubtitle: string;
  languageSection: string;
  languageLabel: string;
  thai: string;
  english: string;
  themeSection: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  storageSection: string;
  storageDesc: string;
  dummyGamesFolder: string;
  openFolder: string;
  clearDummyFiles: string;
  clearing: string;
  clearedSuccess: string;
  totalSize: string;
  filesCount: string;
  aboutSection: string;
  aboutDesc: string;
  version: string;
  links: string;
  githubRepo: string;
  autoRefreshTitle: string;
  autoRefreshDesc: string;
  preferencesSection: string;

  // Playground
  playgroundTitle: string;
  discordTestBtn: string;
  connected: string;
  disconnected: string;
  logsTitle: string;
  clearLogs: string;
  noLogs: string;
  copyLogs: string;
  copied: string;
  allLogs: string;

  // Auto-Pilot & Queue
  autoPilotTitle: string;
  autoPilotDesc: string;
  autoPilotInterval: string;
  startAutoPilot: string;
  stopAutoPilot: string;
  skipGame: string;
  autoPilotRunningOn: string;
  timeRemaining: string;
  gameAdded: string;
  reorderUp: string;
  reorderDown: string;
  minutes: string;
  dragToReorder: string;

  // Dialogs & Notices
  dialogRpcWarningTitle: string;
  dialogRpcWarningDesc1: string;
  dialogRpcWarningDesc2: string;
  dialogRpcWarningDesc3: string;
  acceptRisk: string;
  cancel: string;
  ok: string;
  noGameSelectedMsg: string;
  mirrorFetched: string;
  discordFetched: string;
  bundlePreloaded: string;
  fetchingFromMirror: string;
  fetchingFromDiscord: string;
  fetchingFromBundle: string;
}

const enTranslations: Translations = {
  navHome: 'Home',
  navPlayground: 'Playground',
  navSettings: 'Settings',

  heroTitle: 'Discord Quest Completer',
  heroSubtitle: 'Easily track and complete Discord Quests without installing heavy games',

  searchPlaceholder: 'Search Discord games or paste Quest link...',
  refreshGameList: 'Refresh Game List',
  refreshing: 'Refreshing...',
  searchResultHelp: 'Search for games by name or paste Discord Quest link',
  addGameToList: 'Add game',
  id: 'ID',
  executables: 'Executables',
  questFoundTitle: 'Discord Quest Found',
  fetchingQuest: 'Fetching Discord Quest details...',
  questTargetDuration: 'Quest Target',
  questNotFound: 'Quest not found or link is invalid',

  gamesTitle: 'Games',
  noGamesSelectedSubtitle: 'No games selected. Search and add games from the search bar.',
  noGamesYet: 'No games yet',
  noGamesYetDesc: 'Use the search bar above to find and add games from the search bar.',
  remove: 'Remove',
  running: 'Running',
  verified: 'Verified',

  gameActionsTitle: 'Game Actions',
  selectGamePrompt: 'Select a game from the left to perform actions.',
  testRPC: 'Test RPC',
  disconnectRPC: 'Disconnect RPC',
  statusTitle: 'Status',
  statusHint: 'Check Discord to see if it displays that you are playing a game.',
  notPlaying: 'Not playing any game',
  currentlyPlaying: 'Playing:',
  selectExecutableToLaunch: 'Select an executable to launch:',
  play: 'Play',
  stop: 'Stop',

  settingsTitle: 'Settings',
  settingsSubtitle: 'Manage application language, themes, and dummy game cache',
  languageSection: 'Application Language',
  languageLabel: 'Select display language for the application',
  thai: 'ภาษาไทย',
  english: 'English',
  themeSection: 'Appearance & Theme',
  themeLabel: 'Choose your preferred visual theme',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeSystem: 'System',
  storageSection: 'Storage & Dummy Game Cache',
  storageDesc: 'Small dummy runner executables are placed in the games folder for Discord detection.',
  dummyGamesFolder: 'Dummy Games Folder:',
  openFolder: 'Open Folder in Explorer',
  clearDummyFiles: 'Clear All Dummy Games',
  clearing: 'Clearing files...',
  clearedSuccess: 'Dummy files cleared successfully',
  totalSize: 'Total Size:',
  filesCount: 'Items Count:',
  aboutSection: 'About',
  aboutDesc: 'A lightweight Windows application to complete Discord Quests without full game installations.',
  version: 'Version:',
  links: 'Links & Source:',
  githubRepo: 'GitHub Repository',
  autoRefreshTitle: 'Auto-refresh game list',
  autoRefreshDesc: 'Fetch the latest game catalog automatically upon launch',
  preferencesSection: 'Preferences',

  playgroundTitle: 'Discord RPC Playground & Logs',
  discordTestBtn: 'Test Discord RPC',
  connected: 'Connected',
  disconnected: 'Disconnected',
  logsTitle: 'System Logs',
  clearLogs: 'Clear Logs',
  noLogs: 'No logs available right now',
  copyLogs: 'Copy Logs',
  copied: 'Copied!',
  allLogs: 'All',

  autoPilotTitle: 'Auto-Pilot (Automatic Rotation)',
  autoPilotDesc: 'Automatically rotates and runs RPC for each game in the queue on a timer.',
  autoPilotInterval: 'Interval per Game',
  startAutoPilot: 'Start Auto-Pilot',
  stopAutoPilot: 'Stop Auto-Pilot',
  skipGame: 'Skip to Next',
  autoPilotRunningOn: 'Auto-Pilot Running:',
  timeRemaining: 'Remaining',
  gameAdded: 'Added',
  reorderUp: 'Move Up',
  reorderDown: 'Move Down',
  minutes: 'min',
  dragToReorder: 'Drag to reorder games',

  dialogRpcWarningTitle: 'RPC Risk Warning',
  dialogRpcWarningDesc1: 'This is an experimental feature in active development.',
  dialogRpcWarningDesc2: 'It tricks Discord by sending RPC activity with the game ID instead of running the detected process.',
  dialogRpcWarningDesc3: 'Use at your own discretion.',
  acceptRisk: 'Accept risk and continue',
  cancel: 'Cancel',
  ok: 'OK',
  noGameSelectedMsg: 'No game selected. Please select a game from the list on the left.',
  mirrorFetched: 'Game list fetched from mirror',
  discordFetched: 'Game list fetched from Discord',
  bundlePreloaded: 'Game list pre-loaded from bundle',
  fetchingFromMirror: 'Fetching game list from GitHub mirror...',
  fetchingFromDiscord: 'Fetching game list directly from Discord...',
  fetchingFromBundle: 'Loading game list from bundle...'
};

const thTranslations: Translations = {
  navHome: 'หน้าหลัก',
  navPlayground: 'ห้องทดลอง',
  navSettings: 'ตั้งค่า',

  heroTitle: 'Discord Quest Completer',
  heroSubtitle: 'ค้นหาเกมจาก Discord และติดตามเควสต์ได้ง่ายๆ',

  searchPlaceholder: 'ค้นหาชื่อเกม หรือ วางลิงก์ Discord Quest...',
  refreshGameList: 'รีเฟรชรายชื่อเกม',
  refreshing: 'กำลังโหลด...',
  searchResultHelp: 'ค้นหาเกมตามชื่อ หรือวางลิงก์ Discord Quest เพื่อดึงเกมอัตโนมัติ',
  addGameToList: 'เพิ่มเกม',
  id: 'ไอดี',
  executables: 'ไฟล์เรียกทำงาน (Executables)',
  questFoundTitle: 'พบเควสต์ Discord',
  fetchingQuest: 'กำลังดึงข้อมูลเควสต์จาก Discord...',
  questTargetDuration: 'เวลาเควสต์',
  questNotFound: 'ไม่พบข้อมูลเควสต์ หรือลิงก์หมดอายุแล้ว',

  gamesTitle: 'รายการเกม',
  noGamesSelectedSubtitle: 'ยังไม่ได้เลือกเกม ค้นหาและเพิ่มเกมได้จากช่องค้นหาด้านบน',
  noGamesYet: 'ยังไม่มีเกมในรายการ',
  noGamesYetDesc: 'ใช้ช่องค้นหาด้านบน เพื่อค้นหาและเพิ่มเกมเข้าสู่รายการของคุณ',
  remove: 'ลบ',
  running: 'กำลังทำงาน',
  verified: 'ยืนยันแล้ว',

  gameActionsTitle: 'การทำงานของเกม',
  selectGamePrompt: 'เลือกเกมจากแถบด้านซ้ายเพื่อดำเนินการ',
  testRPC: 'ทดสอบ Rich Presence (RPC)',
  disconnectRPC: 'ยกเลิกการเชื่อมต่อ RPC',
  statusTitle: 'สถานะ',
  statusHint: 'ตรวจดูใน Discord ว่าแสดงสถานะว่ากำลังเล่นเกมอยู่หรือไม่',
  notPlaying: 'ไม่ได้เล่นเกมใดๆ',
  currentlyPlaying: 'กำลังเล่น:',
  selectExecutableToLaunch: 'เลือกไฟล์ที่ต้องการเริ่มจำลอง:',
  play: 'เล่น',
  stop: 'หยุด',

  settingsTitle: 'การตั้งค่า',
  settingsSubtitle: 'ปรับแต่งภาษา ธีม และจัดการระบบจำลองเกมตามต้องการ',
  languageSection: 'ภาษาของโปรแกรม (Language)',
  languageLabel: 'เลือกภาษาที่แสดงผลในโปรแกรม',
  thai: 'ภาษาไทย',
  english: 'English',
  themeSection: 'ธีมและการแสดงผล (Appearance)',
  themeLabel: 'เลือกโหมดการแสดงผลที่ต้องการ',
  themeLight: 'สว่าง',
  themeDark: 'มืด',
  themeSystem: 'ตามระบบ',
  storageSection: 'พื้นที่จัดเก็บและแคชเกมจำลอง (Storage)',
  storageDesc: 'ไฟล์เกมจำลองขนาดเล็กจะถูกบันทึกไว้ในโฟลเดอร์ games เพื่อให้ Discord ตรวจจับได้',
  dummyGamesFolder: 'โฟลเดอร์เกมจำลอง:',
  openFolder: 'เปิดโฟลเดอร์ใน Explorer',
  clearDummyFiles: 'ล้างไฟล์เกมจำลองทั้งหมด',
  clearing: 'กำลังล้างไฟล์...',
  clearedSuccess: 'ล้างไฟล์เกมจำลองเรียบร้อยแล้ว',
  totalSize: 'ขนาดทั้งหมด:',
  filesCount: 'จำนวนไฟล์/โฟลเดอร์:',
  aboutSection: 'เกี่ยวกับโปรแกรม',
  aboutDesc: 'แอปพลิเคชันสำหรับทำ Discord Quest และ Rich Presence โดยไม่ต้องติดตั้งเกมตัวเต็ม',
  version: 'เวอร์ชัน:',
  links: 'ลิงก์และซอร์สโค้ด:',
  githubRepo: 'GitHub Repository',
  autoRefreshTitle: 'รีเฟรชรายการเกมอัตโนมัติ',
  autoRefreshDesc: 'ดึงรายชื่อเกมใหม่ล่าสุดจาก Discord เมื่อเริ่มโปรแกรม',
  preferencesSection: 'การทำงานทั่วไป',

  playgroundTitle: 'Discord RPC Playground & Logs',
  discordTestBtn: 'ทดสอบเชื่อมต่อ Discord RPC',
  connected: 'เชื่อมต่อแล้ว',
  disconnected: 'ไม่ได้เชื่อมต่อ',
  logsTitle: 'บันทึกการทำงาน (System Logs)',
  clearLogs: 'ล้างบันทึก',
  noLogs: 'ไม่มีบันทึกข้อมูลในขณะนี้',
  copyLogs: 'คัดลอก Logs',
  copied: 'คัดลอกแล้ว!',
  allLogs: 'ทั้งหมด',

  autoPilotTitle: 'ระบบทำงานอัตโนมัติ (Auto-Pilot)',
  autoPilotDesc: 'เปิด RPC แต่ละเกมในรายการให้อัตโนมัติ และสลับเกมถัดไปตามเวลาที่ตั้งไว้',
  autoPilotInterval: 'ระยะเวลาต่อเกม',
  startAutoPilot: 'เริ่มทำงานอัตโนมัติ',
  stopAutoPilot: 'หยุดทำงานอัตโนมัติ',
  skipGame: 'ข้ามไปเกมถัดไป',
  autoPilotRunningOn: 'กำลังรันอัตโนมัติ:',
  timeRemaining: 'เวลาที่เหลือ',
  gameAdded: 'เพิ่มแล้ว',
  reorderUp: 'เลื่อนขึ้น',
  reorderDown: 'เลื่อนลง',
  minutes: 'นาที',
  dragToReorder: 'ลากเพื่อเรียงลำดับเกม',

  dialogRpcWarningTitle: 'คำเตือนเรื่องความเสี่ยงของ RPC',
  dialogRpcWarningDesc1: 'ฟังก์ชันนี้อยู่ในขั้นทดลอง',
  dialogRpcWarningDesc2: 'ฟังก์ชันนี้ส่งข้อมูล RPC โดยตรงโดยใช้ Game ID จริง แทนที่จะรันโปรเซสเกม จึงอาจมีความเสี่ยงที่ Discord จะตรวจจับได้',
  dialogRpcWarningDesc3: 'โปรดใช้ด้วยความระมัดระวังและยอมรับความเสี่ยงด้วยตนเอง',
  acceptRisk: 'ยอมรับความเสี่ยงและดำเนินการต่อ',
  cancel: 'ยกเลิก',
  ok: 'ตกลง',
  noGameSelectedMsg: 'ยังไม่ได้เลือกเกม กรุณาเลือกเกมจากรายการด้านซ้ายก่อน',
  mirrorFetched: 'ดึงรายการเกมจาก Mirror สำเร็จ',
  discordFetched: 'ดึงรายการเกมจาก Discord สำเร็จ',
  bundlePreloaded: 'โหลดรายการเกมเริ่มต้นสำเร็จ',
  fetchingFromMirror: 'กำลังดึงรายการเกมจาก Mirror...',
  fetchingFromDiscord: 'กำลังดึงรายการเกมจาก Discord...',
  fetchingFromBundle: 'กำลังโหลดรายการเกมจากบันเดิล...'
};

const jaTranslations: Translations = {
  ...enTranslations,
  navHome: 'ホーム',
  navPlayground: 'プレイグラウンド',
  navSettings: '設定',
  heroSubtitle: 'ゲーム本体をインストールせずにDiscordクエストを簡単に達成',
  searchPlaceholder: 'Discord認証済みゲームを検索...',
  refreshGameList: 'ゲーム一覧を更新',
  refreshing: '更新中...',
  searchResultHelp: 'ゲームを名前で検索して「ゲームを追加」をクリック',
  addGameToList: 'ゲームを追加',
  id: 'ID',
  executables: '実行ファイル (Executables)',
  gamesTitle: 'ゲーム一覧',
  noGamesSelectedSubtitle: 'ゲームが選択されていません。検索バーから追加してください。',
  noGamesYet: 'ゲームがありません',
  noGamesYetDesc: '上部の検索バーからゲームを検索してリストに追加してください。',
  remove: '削除',
  running: '実行中',
  verified: '認証済み',
  gameActionsTitle: 'ゲーム操作',
  selectGamePrompt: '左側のリストからゲームを選択してください。',
  testRPC: 'RPCテスト',
  disconnectRPC: 'RPC切断',
  statusTitle: 'ステータス',
  statusHint: 'Discord上でゲームプレイ中のステータスが表示されているか確認してください。',
  notPlaying: 'プレイしていません',
  currentlyPlaying: 'プレイ中:',
  selectExecutableToLaunch: '起動する実行ファイルを選択:',
  play: '開始',
  stop: '停止',
  settingsTitle: '設定',
  settingsSubtitle: '言語、テーマ、およびダミーゲームキャッシュの管理',
  languageSection: '表示言語',
  languageLabel: 'アプリケーションの表示言語を選択します',
  themeSection: '外観とテーマ',
  themeLabel: 'お好みのテーマを選択してください',
  themeLight: 'ライト',
  themeDark: 'ダーク',
  themeSystem: 'システム',
  storageSection: 'ストレージとキャッシュ',
  storageDesc: 'Discord検出用の軽量ダミー実行ファイルがgamesフォルダーに配置されます。',
  dummyGamesFolder: 'ダミーゲームフォルダー:',
  openFolder: 'Explorerでフォルダーを開く',
  clearDummyFiles: 'ダミーゲームをすべて削除',
  clearing: '削除中...',
  clearedSuccess: 'ダミーゲームを正常に削除しました',
  totalSize: '合計サイズ:',
  filesCount: 'ファイル数:',
  aboutSection: 'アプリについて',
  aboutDesc: '大容量ゲームをインストールせずにDiscordクエストを達成するための軽量アプリです。',
  autoRefreshTitle: '起動時にゲームリストを自動更新',
  autoRefreshDesc: '起動時にDiscordから最新カタログを自動取得します',
  preferencesSection: '一般設定'
};

const zhTranslations: Translations = {
  ...enTranslations,
  navHome: '主页',
  navPlayground: '演练场',
  navSettings: '设置',
  heroSubtitle: '无需安装完整游戏即可轻松完成 Discord 任务',
  searchPlaceholder: '搜索 Discord 认证游戏...',
  refreshGameList: '刷新游戏列表',
  refreshing: '正在刷新...',
  searchResultHelp: '搜索游戏名称并点击“添加游戏”将其添加到列表',
  addGameToList: '添加游戏',
  id: 'ID',
  executables: '可执行文件',
  gamesTitle: '游戏列表',
  noGamesSelectedSubtitle: '尚未选择游戏。请从上方搜索栏中搜索并添加游戏。',
  noGamesYet: '暂无游戏',
  noGamesYetDesc: '使用上方搜索栏搜索并添加游戏到您的列表。',
  remove: '移除',
  running: '运行中',
  verified: '已验证',
  gameActionsTitle: '游戏操作',
  selectGamePrompt: '从左侧选择一个游戏以执行操作。',
  testRPC: '测试 RPC',
  disconnectRPC: '断开 RPC',
  statusTitle: '状态',
  statusHint: '检查 Discord 是否显示您正在玩该游戏。',
  notPlaying: '未在玩任何游戏',
  currentlyPlaying: '正在玩:',
  selectExecutableToLaunch: '选择要启动的可执行文件:',
  play: '运行',
  stop: '停止',
  settingsTitle: '设置',
  settingsSubtitle: '管理应用语言、主题和虚拟游戏缓存',
  languageSection: '应用语言',
  languageLabel: '选择应用程序的显示语言',
  themeSection: '外观与主题',
  themeLabel: '选择您喜欢的外观主题',
  themeLight: '浅色',
  themeDark: '深色',
  themeSystem: '跟随系统',
  storageSection: '存储与虚拟游戏缓存',
  storageDesc: '微型虚拟运行程序将放置在 games 文件夹中以供 Discord 检测。',
  dummyGamesFolder: '虚拟游戏文件夹:',
  openFolder: '在资源管理器中打开',
  clearDummyFiles: '清除所有虚拟游戏文件',
  clearing: '正在清除...',
  clearedSuccess: '虚拟游戏文件清除成功',
  totalSize: '总大小:',
  filesCount: '文件数量:',
  aboutSection: '关于',
  aboutDesc: '无需安装庞大游戏即可完成 Discord 任务的轻量级工具。',
  autoRefreshTitle: '自动刷新游戏列表',
  autoRefreshDesc: '启动时自动从 Discord 获取最新游戏目录',
  preferencesSection: '常规偏好'
};

const koTranslations: Translations = {
  ...enTranslations,
  navHome: '홈',
  navPlayground: '실험실',
  navSettings: '설정',
  heroSubtitle: '용량이 큰 게임을 설치하지 않고도 디스코드 퀘스트를 쉽게 완료하세요',
  searchPlaceholder: 'Discord 인증 게임 검색...',
  refreshGameList: '게임 목록 새로고침',
  refreshing: '새로고침 중...',
  searchResultHelp: '게임 이름을 검색하고 "게임 추가"를 클릭하여 선택하세요',
  addGameToList: '게임 추가',
  id: 'ID',
  executables: '실행 파일',
  gamesTitle: '게임 목록',
  noGamesSelectedSubtitle: '선택된 게임이 없습니다. 검색창에서 게임을 검색하여 추가하세요.',
  noGamesYet: '등록된 게임 없음',
  noGamesYetDesc: '상단 검색창을 이용하여 게임을 검색하고 목록에 추가하세요.',
  remove: '삭제',
  running: '실행 중',
  verified: '인증됨',
  gameActionsTitle: '게임 동작',
  selectGamePrompt: '작업을 수행할 게임을 왼쪽에서 선택하세요.',
  testRPC: 'RPC 테스트',
  disconnectRPC: 'RPC 연결 해제',
  statusTitle: '상태',
  statusHint: 'Discord에서 게임 플레이 중으로 표시되는지 확인하세요.',
  notPlaying: '플레이 중인 게임 없음',
  currentlyPlaying: '플레이 중:',
  selectExecutableToLaunch: '실행할 파일 선택:',
  play: '실행',
  stop: '중지',
  settingsTitle: '설정',
  settingsSubtitle: '앱 언어, 테마 및 더미 게임 캐시 관리',
  languageSection: '앱 언어',
  languageLabel: '애플리케이션 표시 언어를 선택하세요',
  themeSection: '테마 및 디자인',
  themeLabel: '선호하는 테마를 선택하세요',
  themeLight: '라이트',
  themeDark: '다크',
  themeSystem: '시스템',
  storageSection: '저장소 및 더미 캐시',
  storageDesc: 'Discord 감지를 위한 경량 더미 파일이 games 폴더에 저장됩니다.',
  dummyGamesFolder: '더미 게임 폴더:',
  openFolder: '탐색기에서 열기',
  clearDummyFiles: '모든 더미 파일 삭제',
  clearing: '삭제 중...',
  clearedSuccess: '더미 파일을 성공적으로 삭제했습니다',
  totalSize: '총 용량:',
  filesCount: '항목 수:',
  aboutSection: '정보',
  aboutDesc: '무거운 게임 설치 없이 Discord 퀘스트를 완료하기 위한 경량 도구입니다.',
  autoRefreshTitle: '게임 목록 자동 새로고침',
  autoRefreshDesc: '앱 실행 시 최신 게임 카탈로그 자동 로드',
  preferencesSection: '환경 설정'
};

const esTranslations: Translations = {
  ...enTranslations,
  navHome: 'Inicio',
  navPlayground: 'Laboratorio',
  navSettings: 'Ajustes',
  heroSubtitle: 'Completa misiones de Discord fácilmente sin instalar juegos pesados',
  searchPlaceholder: 'Buscar juegos verificados de Discord...',
  refreshGameList: 'Actualizar lista de juegos',
  refreshing: 'Actualizando...',
  searchResultHelp: 'Busca juegos por nombre y haz clic en "Añadir juego"',
  addGameToList: 'Añadir juego',
  gamesTitle: 'Juegos',
  noGamesSelectedSubtitle: 'No hay juegos seleccionados. Añade juegos desde la barra de búsqueda.',
  noGamesYet: 'Sin juegos',
  noGamesYetDesc: 'Usa la barra de búsqueda superior para encontrar y añadir juegos a tu lista.',
  remove: 'Eliminar',
  running: 'Ejecutando',
  verified: 'Verificado',
  gameActionsTitle: 'Acciones del juego',
  selectGamePrompt: 'Selecciona un juego de la izquierda para realizar acciones.',
  testRPC: 'Probar RPC',
  disconnectRPC: 'Desconectar RPC',
  statusTitle: 'Estado',
  statusHint: 'Comprueba en Discord si aparece que estás jugando.',
  notPlaying: 'No estás jugando a nada',
  currentlyPlaying: 'Jugando a:',
  selectExecutableToLaunch: 'Selecciona un ejecutable para iniciar:',
  play: 'Jugar',
  stop: 'Detener',
  settingsTitle: 'Ajustes',
  settingsSubtitle: 'Gestiona el idioma, temas y la caché de juegos simulados',
  languageSection: 'Idioma de la aplicación',
  languageLabel: 'Selecciona el idioma para la aplicación',
  themeSection: 'Apariencia y tema',
  themeLabel: 'Elige tu tema preferido',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  themeSystem: 'Sistema',
  storageSection: 'Almacenamiento y caché',
  storageDesc: 'Pequeños ejecutables simulados se guardan en la carpeta games para que Discord los detecte.',
  dummyGamesFolder: 'Carpeta de juegos simulados:',
  openFolder: 'Abrir carpeta en el Explorador',
  clearDummyFiles: 'Eliminar todos los juegos simulados',
  clearing: 'Eliminando...',
  clearedSuccess: 'Archivos simulados eliminados correctamente',
  totalSize: 'Tamaño total:',
  filesCount: 'Cantidad de archivos:',
  aboutSection: 'Acerca de',
  aboutDesc: 'Una aplicación ligera de Windows para completar misiones de Discord sin instalaciones pesadas.',
  autoRefreshTitle: 'Actualización automática de catálogo',
  autoRefreshDesc: 'Obtener el catálogo más reciente de Discord al iniciar',
  preferencesSection: 'Preferencias generales'
};

const frTranslations: Translations = {
  ...enTranslations,
  navHome: 'Accueil',
  navPlayground: 'Laboratoire',
  navSettings: 'Paramètres',
  heroSubtitle: 'Accomplissez facilement vos quêtes Discord sans installer de jeux lourds',
  searchPlaceholder: 'Rechercher des jeux vérifiés par Discord...',
  refreshGameList: 'Actualiser la liste des jeux',
  refreshing: 'Actualisation...',
  searchResultHelp: 'Recherchez des jeux par nom et cliquez sur « Ajouter »',
  addGameToList: 'Ajouter le jeu',
  gamesTitle: 'Jeux',
  noGamesSelectedSubtitle: 'Aucun jeu sélectionné. Utilisez la barre de recherche en haut.',
  noGamesYet: 'Aucun jeu',
  noGamesYetDesc: 'Utilisez la barre de recherche ci-dessus pour ajouter des jeux.',
  remove: 'Supprimer',
  running: 'En cours',
  verified: 'Vérifié',
  gameActionsTitle: 'Actions de jeu',
  selectGamePrompt: 'Sélectionnez un jeu à gauche pour effectuer des actions.',
  testRPC: 'Tester RPC',
  disconnectRPC: 'Déconnecter RPC',
  statusTitle: 'Statut',
  statusHint: 'Vérifiez sur Discord si le statut de jeu apparaît.',
  notPlaying: 'Aucun jeu en cours',
  currentlyPlaying: 'En cours de jeu :',
  selectExecutableToLaunch: 'Sélectionnez un exécutable à lancer :',
  play: 'Lancer',
  stop: 'Arrêter',
  settingsTitle: 'Paramètres',
  settingsSubtitle: 'Gérez la langue, les thèmes et le cache des jeux simulés',
  languageSection: 'Langue de l\'application',
  languageLabel: 'Sélectionnez la langue d\'affichage',
  themeSection: 'Apparence et thème',
  themeLabel: 'Choisissez votre thème préféré',
  themeLight: 'Clair',
  themeDark: 'Sombre',
  themeSystem: 'Système',
  storageSection: 'Stockage et cache',
  storageDesc: 'De petits exécutables factices sont créés dans le dossier games pour la détection Discord.',
  dummyGamesFolder: 'Dossier des jeux simulés :',
  openFolder: 'Ouvrir le dossier dans l\'Explorateur',
  clearDummyFiles: 'Effacer tous les jeux simulés',
  clearing: 'Suppression en cours...',
  clearedSuccess: 'Fichiers factices supprimés avec succès',
  totalSize: 'Taille totale :',
  filesCount: 'Nombre de fichiers :',
  aboutSection: 'À propos',
  aboutDesc: 'Une application légère pour accomplir les quêtes Discord sans installer de jeux volumineux.',
  autoRefreshTitle: 'Actualisation automatique',
  autoRefreshDesc: 'Télécharger le dernier catalogue de jeux au lancement',
  preferencesSection: 'Préférences générales'
};

const deTranslations: Translations = {
  ...enTranslations,
  navHome: 'Startseite',
  navPlayground: 'Playground',
  navSettings: 'Einstellungen',
  heroSubtitle: 'Discord-Quests einfach abschließen, ohne schwere Spiele zu installieren',
  searchPlaceholder: 'Discord-verifizierte Spiele suchen...',
  refreshGameList: 'Spieleliste aktualisieren',
  refreshing: 'Wird aktualisiert...',
  searchResultHelp: 'Spiele nach Namen suchen und auf "Spiel hinzufügen" klicken',
  addGameToList: 'Spiel hinzufügen',
  gamesTitle: 'Spiele',
  noGamesSelectedSubtitle: 'Kein Spiel ausgewählt. Suchen und fügen Sie Spiele hinzu.',
  noGamesYet: 'Noch keine Spiele',
  noGamesYetDesc: 'Nutzen Sie die Suchleiste oben, um Spiele hinzuzufügen.',
  remove: 'Entfernen',
  running: 'Läuft',
  verified: 'Verifiziert',
  gameActionsTitle: 'Spielaktionen',
  selectGamePrompt: 'Wählen Sie links ein Spiel aus, um Aktionen auszuführen.',
  testRPC: 'RPC testen',
  disconnectRPC: 'RPC trennen',
  statusTitle: 'Status',
  statusHint: 'Prüfen Sie in Discord, ob der Spielstatus angezeigt wird.',
  notPlaying: 'Es wird kein Spiel ausgeführt',
  currentlyPlaying: 'Spielt gerade:',
  selectExecutableToLaunch: 'Wählen Sie eine ausführbare Datei:',
  play: 'Starten',
  stop: 'Beenden',
  settingsTitle: 'Einstellungen',
  settingsSubtitle: 'Sprache, Themes und Cache für Dummy-Spiele verwalten',
  languageSection: 'App-Sprache',
  languageLabel: 'Wählen Sie die Anzeigesprache der Anwendung',
  themeSection: 'Erscheinungsbild',
  themeLabel: 'Wählen Sie Ihr bevorzugtes Design',
  themeLight: 'Hell',
  themeDark: 'Dunkel',
  themeSystem: 'System',
  storageSection: 'Speicher & Cache',
  storageDesc: 'Kleine Dummy-Programme werden im games-Ordner abgelegt, damit Discord sie erkennt.',
  dummyGamesFolder: 'Dummy-Spieleordner:',
  openFolder: 'Ordner im Explorer öffnen',
  clearDummyFiles: 'Alle Dummy-Spiele bereinigen',
  clearing: 'Wird bereinigt...',
  clearedSuccess: 'Dummy-Dateien erfolgreich bereinigt',
  totalSize: 'Gesamtgröße:',
  filesCount: 'Anzahl der Dateien:',
  aboutSection: 'Über das Programm',
  aboutDesc: 'Ein schlankes Windows-Tool zum Abschließen von Discord-Quests ohne Download.',
  autoRefreshTitle: 'Spieleliste automatisch aktualisieren',
  autoRefreshDesc: 'Beim Start automatisch die aktuelle Spieleliste laden',
  preferencesSection: 'Allgemeine Einstellungen'
};

const ruTranslations: Translations = {
  ...enTranslations,
  navHome: 'Главная',
  navPlayground: 'Песочница',
  navSettings: 'Настройки',
  heroSubtitle: 'Легко выполняйте задания Discord Quest без скачивания тяжелых игр',
  searchPlaceholder: 'Поиск верифицированных игр Discord...',
  refreshGameList: 'Обновить список игр',
  refreshing: 'Обновление...',
  searchResultHelp: 'Найдите игру по названию и нажмите «Добавить игру»',
  addGameToList: 'Добавить игру',
  gamesTitle: 'Список игр',
  noGamesSelectedSubtitle: 'Игра не выбрана. Найдите и добавьте игры через строку поиска.',
  noGamesYet: 'Список пуст',
  noGamesYetDesc: 'Используйте поиск выше, чтобы найти и добавить нужные игры.',
  remove: 'Удалить',
  running: 'Запущено',
  verified: 'Проверено',
  gameActionsTitle: 'Управление игрой',
  selectGamePrompt: 'Выберите игру из списка слева для управления.',
  testRPC: 'Тест RPC',
  disconnectRPC: 'Отключить RPC',
  statusTitle: 'Статус',
  statusHint: 'Проверьте в Discord, отображается ли активность в игре.',
  notPlaying: 'Игра не запущена',
  currentlyPlaying: 'Сейчас запущено:',
  selectExecutableToLaunch: 'Выберите файл для запуска:',
  play: 'Играть',
  stop: 'Остановить',
  settingsTitle: 'Настройки',
  settingsSubtitle: 'Язык, оформление и управление виртуальными играми',
  languageSection: 'Язык приложения',
  languageLabel: 'Выберите язык интерфейса приложения',
  themeSection: 'Оформление и тема',
  themeLabel: 'Выберите подходящую тему',
  themeLight: 'Светлая',
  themeDark: 'Тёмная',
  themeSystem: 'Системная',
  storageSection: 'Хранилище и кэш',
  storageDesc: 'Легковесные заглушки сохраняются в папку games для обнаружения Дискордом.',
  dummyGamesFolder: 'Папка с играми:',
  openFolder: 'Открыть папку в Проводнике',
  clearDummyFiles: 'Очистить файлы заглушек',
  clearing: 'Очистка...',
  clearedSuccess: 'Файлы заглушек успешно удалены',
  totalSize: 'Общий размер:',
  filesCount: 'Количество файлов:',
  aboutSection: 'О программе',
  aboutDesc: 'Утилита для быстрого прохождения заданий Discord Quest без установки игр.',
  autoRefreshTitle: 'Автообновление каталога',
  autoRefreshDesc: 'Автоматически загружать список игр при старте',
  preferencesSection: 'Основные параметры'
};

const translations: Record<Locale, Translations> = {
  th: thTranslations,
  en: enTranslations,
  ja: jaTranslations,
  zh: zhTranslations,
  ko: koTranslations,
  es: esTranslations,
  fr: frTranslations,
  de: deTranslations,
  ru: ruTranslations
};

const savedLocale = (localStorage.getItem('dqc_locale') as Locale) || 'th';
const currentLocale = ref<Locale>(translations[savedLocale] ? savedLocale : 'th');

export function useI18n() {
  function setLocale(locale: Locale) {
    if (translations[locale]) {
      currentLocale.value = locale;
      localStorage.setItem('dqc_locale', locale);
    }
  }

  const t = computed(() => translations[currentLocale.value] || translations['en']);

  return {
    currentLocale,
    setLocale,
    t,
    SUPPORTED_LANGUAGES
  };
}

