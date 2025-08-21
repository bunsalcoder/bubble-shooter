export type Language = 'en' | 'zh' | 'km';

export interface Translations {
  // Menu items
  resume: string;
  restart: string;
  leaderboard: string;
  language: string;
  mute: string;
  unmute: string;
  
  // Game messages
  gameOver: string;
  youWin: string;
  congratulations: string;
  tryAgain: string;
  ok: string;
  
  // Leaderboard
  globalLeaderboard: string;
  best: string;
  current: string;
  tip: string;
  
  // Settings
  settings: string;
  color: string;
  moveDownAfter: string;
  submit: string;
  pleaseInputColor: string;
  pleaseInputTime: string;
  
  // Question modal
  question: string;
  pressOkForCorrect: string;
  pressCancelForWrong: string;
  
  // Language selection
  selectLanguage: string;
  english: string;
  chinese: string;
  khmer: string;
  
  // Loading
  loading: string;
  loadingGame: string;
  
  // Start Game Screen
  startGame: string;
  tapToStart: string;
  classicEdition: string;
  bubbleShooter: string;
  
  // Help/Info modal
  howToPlay: string;
  objective: string;
  objectiveDescription: string;
  controls: string;
  control1: string;
  control2: string;
  control3: string;
  scoring: string;
  score1: string;
  score2: string;
  score3: string;
  gameOverDescription: string;
  tips: string;
  tip1: string;
  tip2: string;
  tip3: string;
  tip4: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Menu items
    resume: 'Resume',
    restart: 'Restart',
    leaderboard: 'Leaderboard',
    language: 'Language',
    mute: 'Mute',
    unmute: 'Unmute',
    
    // Game messages
    gameOver: 'Game Over!',
    youWin: 'You Win!',
    congratulations: '🎉 Congratulations! 🎉',
    tryAgain: '💪 Try again! 💪',
    ok: 'OK',
    
    // Leaderboard
    globalLeaderboard: '🏆 Global Leaderboard',
    best: 'Best',
    current: 'Current',
    tip: '💡 Tip: Keep playing to improve your score and climb the leaderboard!',
    
    // Settings
    settings: 'Settings',
    color: 'Color:',
    moveDownAfter: 'Move down after (second):',
    submit: 'Submit',
    pleaseInputColor: 'Please input color!',
    pleaseInputTime: 'Please input time!',
    
    // Question modal
    question: 'Question',
    pressOkForCorrect: 'Press Ok button for the correct answer',
    pressCancelForWrong: 'Press Cancel button for the wrong answer',
    
    // Language selection
    selectLanguage: 'Select Language',
    english: 'English',
    chinese: '中文',
    khmer: 'ភាសាខ្មែរ',
    
    // Loading
    loading: 'Loading...',
    loadingGame: 'Loading game...',
    
    // Start Game Screen
    startGame: 'Start Game',
    tapToStart: 'Tap to start your bubble shooting adventure!',
    classicEdition: 'Classic Edition',
    bubbleShooter: 'Bubble Shooter',
    
    // Help/Info modal
    howToPlay: 'How to Play',
    objective: 'Objective',
    objectiveDescription: 'Match 3 or more bubbles of the same color to pop them! Clear all bubbles before they reach the red danger line. The more bubbles you match at once, the higher your score!',
    controls: 'Controls',
    control1: 'Click or tap anywhere to shoot your bubble',
    control2: 'Aim carefully - use the trajectory guide to see where your bubble will land',
    control3: 'Match colors strategically - plan your shots for maximum effect',
    scoring: 'Scoring System',
    score1: '3 bubbles matched: 10 points',
    score2: '4+ bubbles matched: 20 points per bubble',
    score3: 'Chain reactions: Extra bonus points for multiple pops!',
    gameOverDescription: 'Game Over when any bubble touches the red zigzag danger line at the bottom. Keep those bubbles away from the line!',
    tips: 'Pro Tips & Strategies',
    tip1: 'Think ahead! Look for groups of 3+ same-colored bubbles before shooting',
    tip2: 'Create chain reactions by popping bubbles that cause others to fall and match',
    tip3: 'Clear bubbles from the bottom first - they\'re closest to the danger line!',
    tip4: 'Use the trajectory guide to plan precise shots and avoid wasting bubbles'
  },
  
  zh: {
    // Menu items
    resume: '继续',
    restart: '重新开始',
    leaderboard: '排行榜',
    language: '语言',
    mute: '静音',
    unmute: '取消静音',
    
    // Game messages
    gameOver: '游戏结束！',
    youWin: '你赢了！',
    congratulations: '🎉 恭喜！🎉',
    tryAgain: '💪 再试一次！💪',
    ok: '确定',
    
    // Leaderboard
    globalLeaderboard: '🏆 全球排行榜',
    best: '最佳',
    current: '当前',
    tip: '💡 提示：继续游戏以提高分数并登上排行榜！',
    
    // Settings
    settings: '设置',
    color: '颜色：',
    moveDownAfter: '移动后下降（秒）：',
    submit: '提交',
    pleaseInputColor: '请输入颜色！',
    pleaseInputTime: '请输入时间！',
    
    // Question modal
    question: '问题',
    pressOkForCorrect: '按确定按钮选择正确答案',
    pressCancelForWrong: '按取消按钮选择错误答案',
    
    // Language selection
    selectLanguage: '选择语言',
    english: 'English',
    chinese: '中文',
    khmer: 'ភាសាខ្មែរ',
    
    // Loading
    loading: '加载中...',
    loadingGame: '游戏加载中...',
    
    // Start Game Screen
    startGame: '开始游戏',
    tapToStart: '点击开始你的泡泡射击冒险！',
    classicEdition: '经典版',
    bubbleShooter: '泡泡射击',
    
    // Help/Info modal
    howToPlay: '游戏玩法',
    objective: '游戏目标',
    objectiveDescription: '匹配3个或更多相同颜色的泡泡来消除它们！在泡泡到达红色危险线之前清除所有泡泡。一次匹配的泡泡越多，得分越高！',
    controls: '操作控制',
    control1: '点击或触摸任意位置发射泡泡',
    control2: '仔细瞄准 - 使用轨迹引导查看泡泡的落点',
    control3: '策略性地匹配颜色 - 规划射击以获得最大效果',
    scoring: '计分系统',
    score1: '匹配3个泡泡：10分',
    score2: '匹配4+个泡泡：每个泡泡20分',
    score3: '连锁反应：多次消除获得额外奖励分数！',
    gameOverDescription: '当任何泡泡触及底部的红色锯齿危险线时游戏结束。让那些泡泡远离危险线！',
    tips: '专业技巧与策略',
    tip1: '提前思考！射击前寻找3+个相同颜色的泡泡群',
    tip2: '通过消除导致其他泡泡掉落并匹配的泡泡来创造连锁反应',
    tip3: '首先清除底部的泡泡 - 它们最接近危险线！',
    tip4: '使用轨迹引导规划精确射击，避免浪费泡泡'
  },
  
  km: {
    // Menu items
    resume: 'បន្ត',
    restart: 'ចាប់ផ្តើមឡើងវិញ',
    leaderboard: 'តារាងឈ្នះ',
    language: 'ភាសា',
    mute: 'ជិតសំឡេង',
    unmute: 'បើកសំឡេង',
    
    // Game messages
    gameOver: 'ហ្គេមបញ្ចប់!',
    youWin: 'អ្នកឈ្នះ!',
    congratulations: '🎉 អបអរសាទរ! 🎉',
    tryAgain: '💪 ព្យាយាមម្តងទៀត! 💪',
    ok: 'យល់ព្រម',
    
    // Leaderboard
    globalLeaderboard: '🏆 តារាងឈ្នះពិភពលោក',
    best: 'ល្អបំផុត',
    current: 'បច្ចុប្បន្ន',
    tip: '💡 ការណែនាំ៖ បន្តលេងដើម្បីកែលម្អពិន្ទុរបស់អ្នក និងឡើងដល់តារាងឈ្នះ!',
    
    // Settings
    settings: 'ការកំណត់',
    color: 'ពណ៌៖',
    moveDownAfter: 'ផ្លាស់ទីចុះក្រោមបន្ទាប់ពី (វិនាទី)៖',
    submit: 'ដាក់ស្នើ',
    pleaseInputColor: 'សូមបញ្ចូលពណ៌!',
    pleaseInputTime: 'សូមបញ្ចូលពេលវេលា!',
    
    // Question modal
    question: 'សំណួរ',
    pressOkForCorrect: 'ចុចប៊ូតុងយល់ព្រមសម្រាប់ចម្លើយត្រឹមត្រូវ',
    pressCancelForWrong: 'ចុចប៊ូតុងបោះបង់សម្រាប់ចម្លើយខុស',
    
    // Language selection
    selectLanguage: 'ជ្រើសរើសភាសា',
    english: 'English',
    chinese: '中文',
    khmer: 'ភាសាខ្មែរ',
    
    // Loading
    loading: 'កំពុងផ្ទុក...',
    loadingGame: 'កំពុងផ្ទុកហ្គេម...',
    
    // Start Game Screen
    startGame: 'ចាប់ផ្តើមហ្គេម',
    tapToStart: 'ចុចដើម្បីចាប់ផ្តើមការផ្លាស់ទីព្រលានរបស់អ្នក!',
    classicEdition: 'កំណែបុរាណ',
    bubbleShooter: 'ហ្គេមបាញ់ព្រលាន',
    
    // Help/Info modal
    howToPlay: 'របៀបលេង',
    objective: 'គោលដៅ',
    objectiveDescription: 'ប្រៀបធៀបព្រលាន 3 ឬច្រើនជាមួយពណ៌ដូចគ្នាដើម្បីបំបែកពួកវា! សម្អាតព្រលានទាំងអស់មុនពេលពួកវាឈានដល់បន្ទាត់គ្រោះថ្នាក់ក្រហម។ ព្រលានដែលប្រៀបធៀបក្នុងម្តង កាន់តែច្រើន ពិន្ទុកាន់តែខ្ពស់!',
    controls: 'ការគ្រប់គ្រង',
    control1: 'ចុចឬប៉ះកន្លែងណាមួយដើម្បីបាញ់ព្រលានរបស់អ្នក',
    control2: 'គោរពយ៉ាងល្អិតល្អន់ - ប្រើការណែនាំគន្លងដើម្បីមើលកន្លែងដែលព្រលានរបស់អ្នកនឹងធ្លាក់',
    control3: 'ប្រៀបធៀបពណ៌យ៉ាងយុទ្ធសាស្ត្រ - ធ្វើផែនការការបាញ់ដើម្បីបានប្រសិទ្ធភាពអតិបរមា',
    scoring: 'ប្រព័ន្ធដាក់ពិន្ទុ',
    score1: 'ព្រលាន 3 គ្រាប់ប្រៀបធៀប៖ 10 ពិន្ទុ',
    score2: 'ព្រលាន 4+ គ្រាប់ប្រៀបធៀប៖ 20 ពិន្ទុក្នុងមួយព្រលាន',
    score3: 'ប្រតិកម្មខ្សែសង្វាក់៖ ពិន្ទុប្រាក់រង្វាន់បន្ថែមសម្រាប់ការបំបែកច្រើនដង!',
    gameOverDescription: 'ហ្គេមបញ្ចប់នៅពេលព្រលានណាមួយប៉ះបន្ទាត់រញ្ញីគ្រោះថ្នាក់ក្រហមនៅផ្នែកខាងក្រោម។ រក្សាព្រលានទាំងនោះឱ្យឆ្ងាយពីបន្ទាត់គ្រោះថ្នាក់!',
    tips: 'គន្លឹះវិជ្ជាជីវៈ និងយុទ្ធសាស្ត្រ',
    tip1: 'គិតជាមុន! ស្វែងរកក្រុមព្រលាន 3+ ពណ៌ដូចគ្នាមុនពេលបាញ់',
    tip2: 'បង្កើតប្រតិកម្មខ្សែសង្វាក់ដោយការបំបែកព្រលានដែលបង្កឱ្យព្រលានផ្សេងទៀតធ្លាក់ និងប្រៀបធៀប',
    tip3: 'សម្អាតព្រលានពីផ្នែកខាងក្រោមជាមុន - ពួកវាជិតបន្ទាត់គ្រោះថ្នាក់ជាងគេ!',
    tip4: 'ប្រើការណែនាំគន្លងដើម្បីធ្វើផែនការការបាញ់ត្រឹមត្រូវ និងជៀសវាងការខ្ជះខ្ជាយព្រលាន'
  }
};

export const getTranslation = (language: Language, key: keyof Translations): string => {
  return translations[language][key] || translations.en[key] || key;
};

export const getLanguageName = (language: Language): string => {
  const languageNames = {
    en: 'English',
    zh: '中文',
    km: 'ភាសាខ្មែរ'
  };
  return languageNames[language] || 'English';
};

export const getLanguageFlag = (language: Language): string => {
  const languageFlags = {
    en: '🇺🇸',
    zh: '🇨🇳',
    km: '🇰🇭'
  };
  return languageFlags[language] || '🇺🇸';
}; 