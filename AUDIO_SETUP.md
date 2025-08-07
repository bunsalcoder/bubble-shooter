# Background Music Setup

## Audio File Location
Place your audio files in:
```
public/bubble-shooter/audio/background-music.wav
public/bubble-shooter/audio/pop-sound.mp3
```

## Supported Audio Formats
- **Background Music**: WAV, MP3, OGG (WAV recommended for quality)
- **Sound Effects**: MP3 (recommended for best compatibility)
- **OGG** (good compression)
- **WAV** (uncompressed, larger file size)

## Audio File Requirements
- **File Size**: Keep under 5MB for fast loading
- **Duration**: 2-5 minutes (will loop automatically)
- **Quality**: 128-192 kbps MP3 is sufficient
- **Format**: MP3 is recommended for best browser support

## Features
- ✅ **Background Music**: Starts on first user interaction, loops continuously
- ✅ **Shoot Sound**: Plays when bubble is fired
- ✅ **Pop Sounds**: Plays once for each bubble that breaks (3 bubbles = 3 pops)
- ✅ **Mute/Unmute**: Toggle button controls both music and sound effects
- ✅ **Volume Control**: Adjustable volume (background music 0.3, effects 0.5)
- ✅ **Mobile Support**: Works on iOS and Android
- ✅ **Miniapp Support**: Compatible with WeChat, Alipay, etc.
- ✅ **Browser Autoplay Compliance**: Follows modern browser autoplay policies

## How to Add Your Audio Files
1. **Prepare your audio files**:
   - **Background Music**: Convert to WAV format (high quality)
   - **Pop Sound**: Convert to OGG/MP3 format (short, crisp sound)
   - Optimize file sizes (background music under 5MB, pop sound under 500KB)

2. **Place the files**:
   ```
   public/bubble-shooter/audio/background-music.wav
   public/bubble-shooter/audio/pop1.ogg
   ```

3. **Test the game**:
   - Background music starts on first user interaction
   - Shoot sound plays when bubble is fired
   - Pop sounds play for each bubble that breaks
   - Use the music button to mute/unmute all sounds

## Audio Controls
- **🎵 Button**: Toggle mute/unmute (controls both music and sound effects)
- **User Interaction**: Music starts on first click/touch/key
- **Shoot Sound**: Plays when bubble is fired
- **Pop Sounds**: Plays once for each bubble that breaks
- **Loop**: Background music repeats automatically
- **Volume**: Background music 30%, sound effects 50%

## Browser Compatibility
- ✅ **Chrome**: Full support
- ✅ **Firefox**: Full support
- ✅ **Safari**: Full support (iOS)
- ✅ **Edge**: Full support
- ✅ **Mobile browsers**: Full support

## Miniapp Compatibility
- ✅ **WeChat Mini Program**: Full support
- ✅ **Alipay Mini Program**: Full support
- ✅ **Baidu Mini Program**: Full support
- ✅ **QQ Mini Program**: Full support

## Troubleshooting
- **No music**: Check file path and format
- **Won't start**: Click/touch anywhere on the game to start music
- **Mobile issues**: Tap the screen to enable audio
- **Miniapp issues**: Tap the screen to enable audio context
- **Browser autoplay**: Modern browsers require user interaction before audio 