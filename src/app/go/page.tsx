'use client';

import { useState, useEffect } from 'react';

const content = {
  Sinhala: {
    flag: '🇱🇰', label: 'සිංහල',
    tagline: 'විදෙස්ගත ශ්‍රමිකයින් සඳහා විශේෂයෙන් නිර්මාණය කළ ප්‍රායෝගික ඉගෙනීමේ පාඨමාලා',
    langs: '🌍 රෝමේනියා 🇷�� | ජර්මනිය 🇩🇪 | ප්‍රංශය 🇫🇷 | ඉතාලිය 🇮🇹 | හීබෘ 🇮🇱 | ජපන් 🇯🇵 | කොරියන් 🇰🇷 ඇතුලු භාෂා 20+',
    free: '✨ දවසකට මිනිත්තු 10ක් • පළමු සතිය නොමිලේ',
    ready: 'හෝඩියෙ සිට භාෂාවක් ඉගනීමට සූදානම්ද? 👇',
    cta: '🚀 විදේශ රැකියාව, daily life එකට 👇',
    trial: 'පළමු දින 3 නොමිලේ උත්සාහ කරන්න 🚀',
    sub: 'ඔබට ගැලපේ නම් පසුව තීරණය කරන්න • No entry fees',
    btn: '🚀 නොමිලේ ඉගෙනීම ආරම්භ කරන්න',
    copy: 'www.bashaguru.com',
    copyNote: 'Copy & paste on your browser 👇',
  },
  Hindi: {
    flag: '🇮🇳', label: 'हिंदी',
    tagline: 'प्रवासी श्रमिकों के लिए विशेष रूप से बनाए गए व्यावहारिक पाठ्यक्रम',
    langs: '🌍 Romania 🇷🇴 | Germany 🇩🇪 | France 🇫🇷 | Italy 🇮🇹 | Hebrew 🇮🇱 | Japanese 🇯🇵 | Korean 🇰🇷 और 20+ भाषाएं',
    free: '✨ रोज 10 मिनट • पहला हफ्ता मुफ्त',
    ready: 'क्या आप एक नई भाषा सीखने के लिए तैयार हैं? 👇',
    cta: '🚀 विदेश में काम और daily life के लिए 👇',
    trial: 'पहले 3 दिन मुफ्त आज़माएं 🚀',
    sub: 'पसंद आए तो बाद में decide करें • No entry fees',
    btn: '🚀 मुफ्त में सीखना शुरू करें',
    copy: 'www.bashaguru.com',
    copyNote: 'Copy & paste on your browser 👇',
  },
  Bengali: {
    flag: '🇧🇩', label: 'বাংলা',
    tagline: 'প্রবাসী শ্রমিকদের জন্য বিশেষভাবে তৈরি ব্যবহারিক কোর্স',
    langs: '🌍 Romania 🇷🇴 | Germany 🇩🇪 | France 🇫🇷 | Italy 🇮🇹 | Hebrew 🇮🇱 | Japanese 🇯🇵 | Korean 🇰🇷 ও ২০+ ভাষা',
    free: '✨ প্রতিদিন ১০ মিনিট • প্রথম সপ্তাহ বিনামূল্যে',
    ready: 'একটি নতুন ভাষা শিখতে প্রস্তুত? 👇',
    cta: '🚀 বিদেশে কাজ ও daily life-এর জন্য 👇',
    trial: 'প্রথম ৩ দিন বিনামূল্যে চেষ্টা করুন 🚀',
    sub: 'পছন্দ হলে পরে সিদ্ধান্ত নিন • No entry fees',
    btn: '🚀 বিনামূল্যে শেখা শুরু করুন',
    copy: 'www.bashaguru.com',
    copyNote: 'Copy & paste on your browser 👇',
  },
  Urdu: {
    flag: '🇵🇰', label: 'اردو',
    tagline: 'تارکین وطن مزدوروں کے لیے خصوصی طور پر بنائے گئے عملی کورسز',
    langs: '🌍 Romania 🇷🇴 | Germany 🇩🇪 | France 🇫🇷 | Italy 🇮🇹 | Hebrew 🇮🇱 | Japanese 🇯🇵 | Korean 🇰🇷 اور 20+ زبانیں',
    free: '✨ روزانہ 10 منٹ • پہلا ہفتہ مفت',
    ready: 'کیا آپ ایک نئی زبان سیکھنے کے لیے تیار ہیں؟ 👇',
    cta: '🚀 بیرون ملک کام اور daily life کے لیے 👇',
    trial: 'پہلے 3 دن مفت آزمائیں 🚀',
    sub: 'پسند آئے تو بعد میں فیصلہ کریں • No entry fees',
    btn: '🚀 مفت میں سیکھنا شروع کریں',
    copy: 'www.bashaguru.com',
    copyNote: 'Copy & paste on your browser 👇',
  },
  Nepali: {
    flag: '🇳🇵', label: 'नेपाली',
    tagline: 'प्रवासी कामदारहरूका लागि विशेष रूपमा बनाइएका व्यावहारिक पाठ्यक्रमहरू',
    langs: '�� Romania 🇷🇴 | Germany 🇩🇪 | France 🇫🇷 | Italy 🇮🇹 | Hebrew 🇮🇱 | Japanese 🇯🇵 | Korean 🇰🇷 र 20+ भाषाहरू',
    free: '✨ दैनिक 10 मिनेट • पहिलो हप्ता नि:शुल्क',
    ready: 'नयाँ भाषा सिक्न तयार हुनुहुन्छ? 👇',
    cta: '🚀 विदेशमा काम र daily life का लागि 👇',
    trial: 'पहिलो 3 दिन नि:शुल्क प्रयास गर्नुस् 🚀',
    sub: 'मन परे पछि निर्णय गर्नुस् • No entry fees',
    btn: '🚀 नि:शुल्क सिक्न सुरु गर्नुस्',
    copy: 'www.bashaguru.com',
    copyNote: 'Copy & paste on your browser 👇',
  },
  English: {
    flag: '🇬🇧', label: 'English',
    tagline: 'Practical language courses specially designed for migrant workers',
    langs: '🌍 Romania 🇷🇴 | Germany 🇩🇪 | France 🇫🇷 | Italy 🇮🇹 | Hebrew 🇮🇱 | Japanese 🇯🇵 | Korean 🇰🇷 & 20+ languages',
    free: '✨ 10 minutes daily • First week FREE',
    ready: 'Ready to learn a new language? 👇',
    cta: '🚀 For work abroad & daily life 👇',
    trial: 'Try FREE for first 3 days 🚀',
    sub: 'Decide later if you like it • No entry fees',
    btn: '🚀 Start Learning Free',
    copy: 'www.bashaguru.com',
    copyNote: 'Copy & paste on your browser 👇',
  },
};

export default function GoPage() {
  const [lang, setLang] = useState('Sinhala');
  const [device, setDevice] = useState<'ios' | 'android' | 'other'>('other');
  const [copied, setCopied] = useState(false);
  const t = content[lang as keyof typeof content];
  const isRTL = lang === 'Urdu';

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) setDevice('ios');
    else if (/Android/.test(ua)) setDevice('android');
  }, []);

  const handleStart = () => {
    const url = 'https://lingoforge.app/login';
    if (device === 'ios') {
      window.location.href = url;
    } else if (device === 'android') {
      window.location.href = `intent://${url.replace('https://', '')}#Intent;scheme=https;package=com.android.chrome;end`;
      setTimeout(() => { window.location.href = url; }, 1000);
    } else {
      window.location.href = url;
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText('www.bashaguru.com').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} style={{minHeight:'100vh', background:'#0f1923', color:'white', fontFamily:'system-ui', maxWidth:'480px', margin:'0 auto'}}>
      
      {/* Header */}
      <div style={{textAlign:'center', padding:'32px 20px 16px'}}>
        <div style={{fontSize:'40px', marginBottom:'6px'}}>🌍</div>
        <h1 style={{fontSize:'26px', fontWeight:'900', color:'#06b6d4', margin:'0 0 6px'}}>LingoForge</h1>
        <p style={{fontSize:'13px', color:'#94a3b8', margin:'0 0 4px', fontStyle:'italic'}}>Survive. Speak. Belong.</p>
      </div>

      {/* Language Switcher */}
      <div style={{display:'flex', justifyContent:'center', flexWrap:'wrap', gap:'6px', padding:'0 16px 16px'}}>
        {Object.keys(content).map(l => (
          <button key={l} onClick={() => setLang(l)}
            style={{padding:'5px 12px', borderRadius:'20px', border:`2px solid ${lang===l ? '#06b6d4' : '#334155'}`,
              background: lang===l ? '#06b6d4' : 'transparent', color:'white', cursor:'pointer', fontSize:'12px',
              fontWeight: lang===l ? 'bold' : 'normal'}}>
            {content[l as keyof typeof content].flag} {content[l as keyof typeof content].label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{padding:'0 16px'}}>
        <div style={{background:'#1a2535', borderRadius:'16px', padding:'20px', marginBottom:'16px', border:'1px solid #1e3a4a'}}>
          <p style={{margin:'0 0 12px', lineHeight:'1.6', fontSize:'14px', color:'#cbd5e1', fontWeight:'600'}}>{t.tagline}</p>
          <p style={{margin:'0 0 12px', fontSize:'12px', color:'#64748b', lineHeight:'1.6'}}>{t.langs}</p>
          <p style={{margin:'0 0 12px', fontSize:'13px', color:'#06b6d4', fontWeight:'600'}}>{t.free}</p>
          <p style={{margin:'0', fontSize:'14px', color:'#94a3b8'}}>{t.ready}</p>
        </div>

        {/* CTA Box */}
        <div style={{background:'linear-gradient(135deg, #1e3a4a, #1a2535)', borderRadius:'16px', padding:'20px', marginBottom:'16px', border:'1px solid #06b6d4/30', textAlign:'center'}}>
          <p style={{margin:'0 0 8px', fontSize:'15px', fontWeight:'700', color:'#06b6d4'}}>{t.cta}</p>
          <p style={{margin:'0 0 4px', fontSize:'13px', color:'white', fontWeight:'600'}}>{t.trial}</p>
          <p style={{margin:'0 0 16px', fontSize:'11px', color:'#64748b'}}>{t.sub}</p>
          
          <button onClick={handleStart}
            style={{width:'100%', padding:'16px', borderRadius:'12px', border:'none',
              background:'linear-gradient(135deg, #06b6d4, #0891b2)', color:'white',
              fontSize:'16px', fontWeight:'bold', cursor:'pointer', marginBottom:'8px',
              boxShadow:'0 4px 20px rgba(6,182,212,0.4)'}}>
            {t.btn}
          </button>
          
          {device !== 'other' && (
            <p style={{margin:'4px 0 0', fontSize:'11px', color:'#64748b'}}>
              {device === 'ios' ? '🍎 Opens in Safari' : '🤖 Opens in Chrome'}
            </p>
          )}
        </div>

        {/* Copy URL Box */}
        <div style={{background:'#1a2535', borderRadius:'12px', padding:'16px', marginBottom:'24px', border:'1px solid #334155', textAlign:'center'}}>
          <p style={{margin:'0 0 8px', fontSize:'11px', color:'#64748b'}}>{t.copyNote}</p>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'#0f1923', borderRadius:'8px', padding:'10px 14px'}}>
            <span style={{fontSize:'14px', fontWeight:'bold', color:'white'}}>{t.copy}</span>
            <button onClick={handleCopy}
              style={{background: copied ? '#22c55e' : '#06b6d4', color:'white', border:'none',
                borderRadius:'6px', padding:'4px 12px', fontSize:'12px', cursor:'pointer', fontWeight:'600'}}>
              {copied ? '✅ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
