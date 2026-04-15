'use client';

import { useState, useEffect } from 'react';

const content = {
  Sinhala: {
    flag: '🇱🇰',
    label: 'සිංහල',
    tagline: 'ජීවත් වන්න. කතා කරන්න. අයිති වන්න.',
    description: 'ආසියානු සංක්‍රමණික කම්කරුවන් සඳහා වන භාෂා ඉගෙනීමේ app එකයි. Romanian, French, German, Italian සහ තවත් භාෂා 20+ ඉගෙනගන්න.',
    plan: '✅ සතිය 1 නොමිලේ\n✅ දිනකට 7 වචන\n✅ ජීවිතයේ දෛනික කතා\n✅ ඕනෑම වෙලාවක ඉගෙනගන්න',
    btn_ios: '🍎 iPhone ෙදෙස් Safari ෙදෙස් Open කරන්න',
    btn_android: '🤖 Android ෙදෙස් Chrome ෙදෙස් Open කරන්න',
    btn_web: '🌐 Web Browser ෙදෙස් Open කරන්න',
  },
  Hindi: {
    flag: '🇮🇳',
    label: 'हिंदी',
    tagline: 'जियो. बोलो. अपना बनाओ।',
    description: 'एशियाई प्रवासी मजदूरों के लिए भाषा सीखने का app। Romanian, French, German और 20+ भाषाएं सीखें।',
    plan: '✅ पहला हफ्ता मुफ्त\n✅ रोज 7 नए शब्द\n✅ रोजमर्रा की बातें\n✅ कभी भी सीखें',
    btn_ios: '🍎 iPhone पर Safari में खोलें',
    btn_android: '🤖 Android पर Chrome में खोलें',
    btn_web: '🌐 Web Browser में खोलें',
  },
  Bengali: {
    flag: '🇧🇩',
    label: 'বাংলা',
    tagline: 'বাঁচুন। কথা বলুন। আপন হন।',
    description: 'এশিয়ান অভিবাসী শ্রমিকদের জন্য ভাষা শেখার অ্যাপ। Romanian, French, German সহ ২০+ ভাষা শিখুন।',
    plan: '✅ প্রথম সপ্তাহ বিনামূল্যে\n✅ প্রতিদিন ৭টি নতুন শব্দ\n✅ দৈনন্দিন কথোপকথন\n✅ যেকোনো সময় শিখুন',
    btn_ios: '🍎 iPhone-এ Safari-তে খুলুন',
    btn_android: '🤖 Android-এ Chrome-এ খুলুন',
    btn_web: '🌐 Web Browser-এ খুলুন',
  },
  Urdu: {
    flag: '🇵🇰',
    label: 'اردو',
    tagline: 'جیو۔ بولو۔ اپنا بناؤ۔',
    description: 'ایشیائی تارکین وطن مزدوروں کے لیے زبان سیکھنے کا ایپ۔ Romanian، French، German اور 20+ زبانیں سیکھیں۔',
    plan: '✅ پہلا ہفتہ مفت\n✅ روزانہ 7 نئے الفاظ\n✅ روزمرہ کی باتیں\n✅ کبھی بھی سیکھیں',
    btn_ios: '🍎 iPhone پر Safari میں کھولیں',
    btn_android: '🤖 Android پر Chrome میں کھولیں',
    btn_web: '🌐 Web Browser میں کھولیں',
  },
  Nepali: {
    flag: '🇳🇵',
    label: 'नेपाली',
    tagline: 'बाँच्नुस्। बोल्नुस्। आफ्नो बनाउनुस्।',
    description: 'एशियाली प्रवासी कामदारहरूका लागि भाषा सिक्ने एप। Romanian, French, German र २०+ भाषाहरू सिक्नुस्।',
    plan: '✅ पहिलो हप्ता नि:शुल्क\n✅ दैनिक ७ नयाँ शब्दहरू\n✅ दैनिक जीवनका कुराकानी\n✅ जुनसुकै बेला सिक्नुस्',
    btn_ios: '🍎 iPhone मा Safari मा खोल्नुस्',
    btn_android: '🤖 Android मा Chrome मा खोल्नुस्',
    btn_web: '🌐 Web Browser मा खोल्नुस्',
  },
  English: {
    flag: '🇬🇧',
    label: 'English',
    tagline: 'Survive. Speak. Belong.',
    description: 'Language learning app for Asian migrant workers. Learn Romanian, French, German, Italian and 20+ more languages.',
    plan: '✅ First week FREE\n✅ 7 new words daily\n✅ Real daily conversations\n✅ Learn anytime, anywhere',
    btn_ios: '🍎 Open in Safari on iPhone',
    btn_android: '🤖 Open in Chrome on Android',
    btn_web: '🌐 Open in Web Browser',
  },
};

export default function GoPage() {
  const [lang, setLang] = useState('English');
  const [device, setDevice] = useState<'ios' | 'android' | 'other'>('other');
  const t = content[lang as keyof typeof content];
  const isRTL = lang === 'Urdu';

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setDevice('ios');
    else if (/Android/.test(ua)) setDevice('android');
    
    // Detect Facebook browser
    const isFacebook = /FBAN|FBAV/.test(ua);
    if (isFacebook) {
      // Show notice to open in external browser
    }
  }, []);

  const handleOpen = (type: 'ios' | 'android' | 'web') => {
    const loginUrl = 'https://lingoforge.app/login';
    if (type === 'ios') {
      window.location.href = `safari-open:${loginUrl}`;
      setTimeout(() => { window.location.href = loginUrl; }, 500);
    } else if (type === 'android') {
      window.location.href = `intent://${loginUrl.replace('https://', '')}#Intent;scheme=https;package=com.android.chrome;end`;
      setTimeout(() => { window.location.href = loginUrl; }, 500);
    } else {
      window.open(loginUrl, '_blank');
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{minHeight:'100vh', background:'#0f1923', color:'white', fontFamily:'system-ui'}}>
      {/* Header */}
      <div style={{textAlign:'center', padding:'40px 20px 20px'}}>
        <div style={{fontSize:'48px', marginBottom:'8px'}}>🌍</div>
        <h1 style={{fontSize:'28px', fontWeight:'900', color:'#06b6d4', margin:'0 0 8px'}}>LingoForge</h1>
        <p style={{fontSize:'18px', color:'#94a3b8', margin:'0', fontStyle:'italic'}}>{t.tagline}</p>
      </div>

      {/* Language Switcher */}
      <div style={{display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'8px', padding:'0 20px 24px'}}>
        {Object.keys(content).map(l => (
          <button key={l} onClick={() => setLang(l)}
            style={{
              padding:'6px 14px', borderRadius:'20px', border:`2px solid ${lang===l ? '#06b6d4' : '#334155'}`,
              background: lang===l ? '#06b6d4' : 'transparent', color:'white', cursor:'pointer',
              fontSize:'13px', fontWeight: lang===l ? 'bold' : 'normal'
            }}>
            {content[l as keyof typeof content].flag} {content[l as keyof typeof content].label}
          </button>
        ))}
      </div>

      {/* Description */}
      <div style={{maxWidth:'480px', margin:'0 auto', padding:'0 20px'}}>
        <div style={{background:'#1a2535', borderRadius:'16px', padding:'24px', marginBottom:'20px', border:'1px solid #1e3a4a'}}>
          <p style={{margin:'0 0 16px', lineHeight:'1.7', fontSize:'15px', color:'#cbd5e1'}}>{t.description}</p>
          <div style={{borderTop:'1px solid #334155', paddingTop:'16px'}}>
            {t.plan.split('\n').map((line, i) => (
              <p key={i} style={{margin:'4px 0', fontSize:'14px', color:'#94a3b8'}}>{line}</p>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{display:'flex', flexDirection:'column', gap:'12px', paddingBottom:'40px'}}>
          {device === 'ios' && (
            <button onClick={() => handleOpen('ios')}
              style={{width:'100%', padding:'16px', borderRadius:'12px', border:'none',
                background:'linear-gradient(135deg, #1a1a2e, #16213e)', color:'white',
                fontSize:'16px', fontWeight:'bold', cursor:'pointer',
                boxShadow:'0 0 20px rgba(6,182,212,0.3)', border:'1px solid #06b6d4'}}>
              {t.btn_ios}
            </button>
          )}
          {device === 'android' && (
            <button onClick={() => handleOpen('android')}
              style={{width:'100%', padding:'16px', borderRadius:'12px', border:'none',
                background:'linear-gradient(135deg, #1a2e1a, #162e16)', color:'white',
                fontSize:'16px', fontWeight:'bold', cursor:'pointer',
                boxShadow:'0 0 20px rgba(34,197,94,0.3)', border:'1px solid #22c55e'}}>
              {t.btn_android}
            </button>
          )}
          {device === 'other' && (
            <button onClick={() => handleOpen('web')}
              style={{width:'100%', padding:'16px', borderRadius:'12px', border:'none',
                background:'#06b6d4', color:'white', fontSize:'16px', fontWeight:'bold', cursor:'pointer'}}>
              {t.btn_web}
            </button>
          )}
          <button onClick={() => handleOpen('web')}
            style={{width:'100%', padding:'14px', borderRadius:'12px',
              background:'transparent', color:'#94a3b8', fontSize:'14px', cursor:'pointer',
              border:'1px solid #334155'}}>
            Continue in this browser
          </button>
        </div>
      </div>
    </div>
  );
}
