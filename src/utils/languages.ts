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
    loadingGame: 'Loading game...'
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
    loadingGame: '游戏加载中...'
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
    loadingGame: 'កំពុងផ្ទុកហ្គេម...'
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