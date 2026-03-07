
'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Languages, 
  ChevronDown, 
  Globe, 
  PlaneTakeoff, 
  Home, 
  Briefcase, 
  MessageSquare, 
  Award,
  HeartHandshake,
  Stethoscope,
  Landmark,
  Bus,
  Sparkles,
  Volume2,
  BookOpen,
  Pencil,
  Flame,
  BarChart,
  BadgeCheck,
  Twitter,
  Github,
  Linkedin,
  XCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// --- Data & Translations (as per prompt) ---

const translations = {
  English: {
    heroTitle: "Survive. Speak. Belong.",
    heroSub: "Structured language survival paths for migrant workers.",
    selectNative: "I speak...",
    selectTarget: "I am going to...",
    startBtn: "Start My Journey - Free",
    viewPaths: "See Learning Paths",
    path1Title: "Survival Path",
    path1Desc: "Essential phrases to survive from day one in a new country.",
    path2Title: "Alphabet Path",
    path2Desc: "Read signs, menus and messages in the local language.",
    path3Title: "Numbers Path",
    path3Desc: "Handle money, time and numbers confidently every day.",
    journeyTitle: "Your Journey Starts Here",
    pricingTitle: "Simple Pricing",
    pricingSub: "Start free. Upgrade when ready.",
    monthly: "Monthly",
    yearly: "Yearly",
    bestValue: "Best Value",
    perMonth: "/month",
    perYear: "/year",
    startFree: "Start Free",
    getStarted: "Get Started",
    journeyLeaving: "Leaving home",
    journeyArriving: "Arriving",
    journeyWorking: "Working",
    journeySpeaking: "Speaking",
    journeyBelonging: "Belonging",
    scenario1Title: "Emergency",
    scenario1Desc: "Your child is sick. You need to explain symptoms to a doctor. Do you know the words?",
    scenario1Btn: "Learn Medical Vocab",
    scenario2Title: "Bank & Money",
    scenario2Desc: "You need to open a bank account. The form is in a foreign language. Can you fill it in?",
    scenario2Btn: "Learn Numbers & Docs",
    scenario3Title: "Daily Life",
    scenario3Desc: "You need to take the right bus to work. The driver speaks no English. Can you ask for help?",
    scenario3Btn: "Learn Survival Phrases",
    features: {
      ai: { title: "AI-Powered", desc: "Real lessons generated for you" },
      audio: { title: "Audio Built-in", desc: "Hear native pronunciation for every word" },
      dialogues: { title: "Real Dialogues", desc: "Actual conversations you will use daily" },
      exercises: { title: "Daily Exercises", desc: "Fill blanks, MCQ, word matching games" },
      streak: { title: "Streak System", desc: "Stay motivated with daily streaks" },
      progress: { title: "Progress Tracking", desc: "See how far you have come every week" },
      certs: { title: "Certificates", desc: "Earn proof of your progress" },
      langs: { title: "17 Languages", desc: "European, Asian, Middle Eastern" },
    },
    freePlan: {
      title: "Free Forever",
      price: "€0",
      feat1: "Week 1, Day 1 only",
      feat2: "5 vocabulary words",
      feat3: "No audio",
      feat4: "No exercises",
      feat5: "No AI guide",
      btn: "Start Free - No Card Needed"
    },
    monthlyPlan: {
      title: "Monthly",
      price: "€9",
      feat1: "All 3 paths",
      feat2: "All 48 weeks",
      feat3: "Audio pronunciation",
      feat4: "All exercises",
      feat5: "AI guide",
      feat6: "Progress certificates",
      btn: "Get Started"
    },
    yearlyPlan: {
      title: "Yearly",
      price: "€99",
      save: "Save €9 vs monthly!",
      feat1: "Everything in Monthly",
      feat2: "Priority support",
      feat3: "Early access features",
      btn: "Get Started"
    },
    footerTagline: "Language survival for the modern migrant.",
    footerLinks: {
      about: "About Us",
      how: "How It Works",
      pricing: "Pricing",
      privacy: "Privacy Policy",
      terms: "Terms of Service"
    },
    footerLangs: "Available in your language.",
    footerCredit: "© 2026 LingoForge. Built for migrants, by people who understand the journey."
  },
  Sinhala: {
    heroTitle: "දිවි ගෙවන්න. කතා කරන්න. අයිති වෙන්න.",
    heroSub: "විදෙස්ගත ශ්‍රමිකයන් සඳහා ව්‍යුහගත පැවැත්මේ භාෂා මාර්ග.",
    selectNative: "මා කතා කරන්නේ...",
    selectTarget: "මා යන රට...",
    startBtn: "මගේ ගමන ආරම්භ කරන්න - නොමිලේ",
    viewPaths: "ඉගෙනුම් මාර්ග බලන්න",
    path1Title: "පැවැත්මේ මාර්ගය",
    path1Desc: "නව රටක පළමු දිනයේ සිටම දිවි ගෙවීමට අත්‍යවශ්‍ය වාක්‍ය.",
    path2Title: "අකුරු මාර්ගය",
    path2Desc: "සලකුණු, මෙනු සහ පණිවිඩ දේශීය භාෂාවෙන් කියවන්න.",
    path3Title: "සංඛ්‍යා මාර්ගය",
    path3Desc: "සෑම දිනකම මුදල්, වේලාව සහ සංඛ්‍යා විශ්වාසයෙන් හසුරුවන්න.",
    journeyTitle: "ඔබේ ගමන මෙතනින් ආරම්භ වේ",
    pricingTitle: "සරල මිළ ගණන්",
    pricingSub: "නොමිලේ ආරම්භ කරන්න. සූදානම් වූ විට වැඩි දියුණු කරන්න.",
    monthly: "මාසික",
    yearly: "වාර්ෂික",
    bestValue: "හොඳම වටිනාකම",
    perMonth: "/මාසයකට",
    perYear: "/වසරකට",
    startFree: "නොමිලේ ආරම්භ කරන්න",
    getStarted: "ආරම්භ කරන්න",
    journeyLeaving: "නිවස හැරයාම",
    journeyArriving: "පැමිණීම",
    journeyWorking: "වැඩ කිරීම",
    journeySpeaking: "කතා කිරීම",
    journeyBelonging: "අයිති වීම",
    scenario1Title: "හදිසි අවස්ථාවක්",
    scenario1Desc: "ඔබේ දරුවා අසනීපයි. ඔබට වෛද්‍යවරයෙකුට රෝග ලක්ෂණ පැහැදිලි කිරීමට අවශ්‍යයි. ඔබ වචන දන්නවාද?",
    scenario1Btn: "වෛද්‍ය වචන ඉගෙන ගන්න",
    scenario2Title: "බැංකු සහ මුදල්",
    scenario2Desc: "ඔබට බැංකු ගිණුමක් විවෘත කිරීමට අවශ්‍යයි. පෝරමය විදේශ භාෂාවකින් ඇත. ඔබට එය පිරවිය හැකිද?",
    scenario2Btn: "සංඛ්‍යා සහ ලේඛන ඉගෙන ගන්න",
    scenario3Title: "දෛනික ජීවිතය",
    scenario3Desc: "ඔබට වැඩට යාමට නිවැරදි බසය ගත යුතුය. රියදුරු ඉංග්‍රීසි කතා නොකරයි. ඔබට උදව් ඉල්ලා සිටිය හැකිද?",
    scenario3Btn: "පැවැත්මේ වාක්‍ය ඉගෙන ගන්න",
    features: {
      ai: { title: "AI බලයෙන්", desc: "ඔබ වෙනුවෙන් ජනනය කරන ලද පාඩම්" },
      audio: { title: "ශ්‍රව්‍ය ඇතුළත්", desc: "සෑම වචනයක් සඳහාම දේශීය උච්චාරණය අසන්න" },
      dialogues: { title: "සැබෑ සංවාද", desc: "ඔබ දිනපතා භාවිතා කරන සැබෑ සංවාද" },
      exercises: { title: "දෛනික අභ්‍යාස", desc: "හිස්තැන් පිරවීම, MCQ, වචන ගැලපීම" },
      streak: { title: "දිනපතා Streak", desc: "දිනපතා streaks සමඟින් පෙළඹී සිටින්න" },
      progress: { title: "ප්‍රගති නිරීක්ෂණය", desc: "සෑම සතියකම ඔබ කොතරම් දුරක් පැමිණ ඇත්දැයි බලන්න" },
      certs: { title: "සහතික", desc: "ඔබේ ප්‍රගතිය පිළිබඳ සාක්ෂි උපයන්න" },
      langs: { title: "භාෂා 17", desc: "යුරෝපීය, ආසියානු, මැද පෙරදිග" },
    },
    freePlan: {
      title: "සදහටම නොමිලේ",
      price: "€0",
      feat1: "සතිය 1, දිනය 1 පමණි",
      feat2: "වචන 5ක්",
      feat3: "ශ්‍රව්‍ය නැත",
      feat4: "අභ්‍යාස නැත",
      feat5: "AI මාර්ගෝපදේශ නැත",
      btn: "නොමිලේ ආරම්භ කරන්න - කාඩ්පත් අවශ්‍ය නැත"
    },
    monthlyPlan: {
      title: "මාසික",
      price: "€9",
      feat1: "මාර්ග 3ම",
      feat2: "සති 48ම",
      feat3: "දේශීය උච්චාරණය",
      feat4: "සියලුම අභ්‍යාස",
      feat5: "AI මාර්ගෝපදේශය",
      feat6: "ප්‍රගති සහතික",
      btn: "ආරම්භ කරන්න"
    },
    yearlyPlan: {
      title: "වාර්ෂික",
      price: "€99",
      save: "මාසිකයට වඩා €9ක් ඉතිරි කරන්න!",
      feat1: "මාසික සැලැස්මේ සියල්ල",
      feat2: "ප්‍රමුඛතා සහාය",
      feat3: "මුල් ප්‍රවේශ විශේෂාංග",
      btn: "ආරම්භ කරන්න"
    },
    footerTagline: "නූතන සංක්‍රමණිකයා සඳහා භාෂා පැවැත්ම.",
    footerLinks: {
      about: "අප ගැන",
      how: "එය ක්‍රියා කරන්නේ කෙසේද",
      pricing: "මිල ගණන්",
      privacy: "පෞද්ගලිකත්ව ප්‍රතිපත්තිය",
      terms: "සේවා කොන්දේසි"
    },
    footerLangs: "ඔබේ භාෂාවෙන් ලබා ගත හැකිය.",
    footerCredit: "© 2026 LingoForge. සංක්‍රමණිකයන් සඳහා, ගමන තේරුම් ගන්නා අය විසින් ගොඩනගන ලදී."
  },
  Hindi: {
    heroTitle: "जीवित रहें। बोलें। अपना बनाएं।",
    heroSub: "प्रवासी श्रमिकों के लिए संरचित भाषा उत्तरजीविता पथ।",
    selectNative: "मैं बोलता/बोलती हूँ...",
    selectTarget: "मैं जा रहा/रही हूँ...",
    startBtn: "मेरी यात्रा शुरू करें - मुफ्त",
    viewPaths: "सीखने के रास्ते देखें",
    path1Title: "जीवन रक्षा मार्ग",
    path1Desc: "नए देश में पहले दिन से जीवित रहने के लिए ज़रूरी वाक्यांश।",
    path2Title: "वर्णमाला मार्ग",
    path2Desc: "स्थानीय भाषा में संकेत, मेनू और संदेश पढ़ें।",
    path3Title: "संख्या मार्ग",
    path3Desc: "हर दिन पैसे, समय और संख्याओं को आत्मविश्वास से संभालें।",
    journeyTitle: "आपकी यात्रा यहाँ से शुरू होती है",
    pricingTitle: "सरल मूल्य निर्धारण",
    pricingSub: "मुफ्त में शुरू करें। तैयार होने पर अपग्रेड करें।",
    monthly: "मासिक",
    yearly: "वार्षिक",
    bestValue: "सर्वोत्तम मूल्य",
    perMonth: "/महीना",
    perYear: "/वर्ष",
    startFree: "मुफ्त शुरू करें",
    getStarted: "शुरू करें",
    journeyLeaving: "घर छोड़ना",
    journeyArriving: "पहुँचना",
    journeyWorking: "काम करना",
    journeySpeaking: "बोलना",
    journeyBelonging: "अपनापन",
    scenario1Title: "आपातकाल",
    scenario1Desc: "आपका बच्चा बीमार है। आपको डॉक्टर को लक्षण समझाने की ज़रूरत है। क्या आप शब्द जानते हैं?",
    scenario1Btn: "चिकित्सा शब्दावली सीखें",
    scenario2Title: "बैंक और पैसा",
    scenario2Desc: "आपको एक बैंक खाता खोलना है। फ़ॉर्म एक विदेशी भाषा में है। क्या आप इसे भर सकते हैं?",
    scenario2Btn: "संख्या और दस्तावेज़ सीखें",
    scenario3Title: "दैनिक जीवन",
    scenario3Desc: "आपको काम पर जाने के लिए सही बस लेनी है। ड्राइवर अंग्रेज़ी नहीं बोलता। क्या आप मदद मांग सकते हैं?",
    scenario3Btn: "जीवन रक्षा वाक्यांश सीखें",
     features: {
      ai: { title: "AI-संचालित", desc: "आपके लिए बनाए गए वास्तविक पाठ" },
      audio: { title: "ऑडियो अंतर्निहित", desc: "हर शब्द का देशी उच्चारण सुनें" },
      dialogues: { title: "वास्तविक संवाद", desc: "वास्तविक बातचीत जो आप रोजाना करेंगे" },
      exercises: { title: "दैनिक व्यायाम", desc: "रिक्त स्थान भरें, MCQ, शब्द मिलान खेल" },
      streak: { title: "स्ट्रीक प्रणाली", desc: "दैनिक स्ट्रीक्स से प्रेरित रहें" },
      progress: { title: "प्रगति ट्रैकिंग", desc: "देखें कि आप हर हफ्ते कितनी दूर आ गए हैं" },
      certs: { title: "प्रमाणपत्र", desc: "अपनी प्रगति का प्रमाण अर्जित करें" },
      langs: { title: "17 भाषाएँ", desc: "यूरोपीय, एशियाई, मध्य पूर्वी" },
    },
    freePlan: {
      title: "हमेशा के लिए मुफ्त",
      price: "€0",
      feat1: "केवल सप्ताह 1, दिन 1",
      feat2: "5 शब्दावली शब्द",
      feat3: "कोई ऑडियो नहीं",
      feat4: "कोई व्यायाम नहीं",
      feat5: "कोई AI गाइड नहीं",
      btn: "मुफ्त शुरू करें - कार्ड की जरूरत नहीं"
    },
    monthlyPlan: {
      title: "मासिक",
      price: "€9",
      feat1: "सभी 3 रास्ते",
      feat2: "सभी 48 सप्ताह",
      feat3: "देशी ऑडियो उच्चारण",
      feat4: "सभी व्यायाम",
      feat5: "AI गाइड",
      feat6: "प्रगति प्रमाण पत्र",
      btn: "शुरू करें"
    },
    yearlyPlan: {
      title: "वार्षिक",
      price: "€99",
      save: "मासिक की तुलना में €9 बचाएं!",
      feat1: "मासिक में सब कुछ",
      feat2: "प्राथमिकता समर्थन",
      feat3: "प्रारंभिक पहुँच सुविधाएँ",
      btn: "शुरू करें"
    },
    footerTagline: "आधुनिक प्रवासी के लिए भाषा जीवन रक्षा।",
    footerLinks: {
      about: "हमारे बारे में",
      how: "यह कैसे काम करता है",
      pricing: "मूल्य निर्धारण",
      privacy: "गोपनीयता नीति",
      terms: "सेवा की शर्तें"
    },
    footerLangs: "आपकी भाषा में उपलब्ध है।",
    footerCredit: "© 2026 LingoForge। प्रवासियों के लिए, यात्रा को समझने वाले लोगों द्वारा बनाया गया।"
  },
  Urdu: {
    heroTitle: "زندہ رہیں۔ بولیں۔ اپنائیں۔",
    heroSub: "مہاجر کارکنوں کے لیے منظم زبان کی بقا کے راستے۔",
    selectNative: "میں بولتا/بولتی ہوں...",
    selectTarget: "میں جا رہا/رہی ہوں...",
    startBtn: "میرا سفر شروع کریں - مفت",
    viewPaths: "سیکھنے کے راستے دیکھیں",
    path1Title: "بقا کا راستہ",
    path1Desc: "نئے ملک میں پہلے دن سے زندہ رہنے کے لیے ضروری جملے۔",
    path2Title: "حروف تہجی کا راستہ",
    path2Desc: "مقامی زبان میں نشانیاں، مینو اور پیغامات پڑھیں۔",
    path3Title: "اعداد کا راستہ",
    path3Desc: "ہر روز پیسے، وقت اور اعداد کو اعتماد سے سنبھالیں۔",
    journeyTitle: "آپ کا سفر یہاں سے شروع ہوتا ہے۔",
    pricingTitle: "سادہ قیمتیں۔",
    pricingSub: "مفت شروع کریں۔ جب تیار ہوں تو اپ گریڈ کریں۔",
    monthly: "ماہانہ",
    yearly: "سالانہ",
    bestValue: "بہترین قیمت",
    perMonth: "/ماہ",
    perYear: "/سال",
    startFree: "مفت شروع کریں",
    getStarted: "شروع کریں",
    journeyLeaving: "گھر چھوڑنا",
    journeyArriving: "پہنچنا",
    journeyWorking: "کام کرنا",
    journeySpeaking: "بولنا",
    journeyBelonging: "اپنانا",
    scenario1Title: "ہنگامی صورتحال",
    scenario1Desc: "آپ کا بچہ بیمار ہے۔ آپ کو ڈاکٹر کو علامات بتانے کی ضرورت ہے۔ کیا آپ کو الفاظ آتے ہیں؟",
    scenario1Btn: "طبی الفاظ سیکھیں",
    scenario2Title: "بینک اور پیسہ",
    scenario2Desc: "آپ کو بینک اکاؤنٹ کھولنے کی ضرورت ہے۔ فارم غیر ملکی زبان میں ہے۔ کیا آپ اسے بھر سکتے ہیں؟",
    scenario2Btn: "نمبر اور دستاویزات سیکھیں",
    scenario3Title: "روزمرہ زندگی",
    scenario3Desc: "آپ کو کام پر جانے کے لیے صحیح بس لینی ہے۔ ڈرائیور انگریزی نہیں بولتا۔ کیا آپ مدد مانگ سکتے ہیں؟",
    scenario3Btn: "بقا کے جملے سیکھیں",
    features: {
      ai: { title: "AI سے چلنے والا", desc: "آپ کے لیے تیار کردہ حقیقی اسباق" },
      audio: { title: "آڈیو شامل", desc: "ہر لفظ کا مقامی تلفظ سنیں" },
      dialogues: { title: "حقیقی مکالمے", desc: "اصل گفتگو جو آپ روزانہ استعمال کریں گے" },
      exercises: { title: "روزانہ مشقیں", desc: "خالی جگہیں پر کریں، MCQ، الفاظ ملانے والے کھیل" },
      streak: { title: "اسٹریک سسٹم", desc: "روزانہ اسٹریک کے ساتھ متحرک رہیں" },
      progress: { title: "پیشرفت سے باخبر رہنا", desc: "دیکھیں کہ آپ ہر ہفتے کتنی ترقی کر چکے ہیں" },
      certs: { title: "سرٹیفکیٹس", desc: "اپنی پیشرفت کا ثبوت حاصل کریں" },
      langs: { title: "17 زبانیں", desc: "یورپی، ایشیائی، مشرق وسطیٰ" },
    },
    freePlan: {
      title: "ہمیشہ کے لیے مفت",
      price: "€0",
      feat1: "صرف ہفتہ 1، دن 1",
      feat2: "5 الفاظ",
      feat3: "کوئی آڈیو نہیں",
      feat4: "کوئی مشق نہیں",
      feat5: "کوئی AI گائیڈ نہیں",
      btn: "مفت شروع کریں - کارڈ کی ضرورت نہیں"
    },
    monthlyPlan: {
      title: "ماہانہ",
      price: "€9",
      feat1: "تمام 3 راستے",
      feat2: "تمام 48 ہفتے",
      feat3: "مقامی آڈیو تلفظ",
      feat4: "تمام مشقیں",
      feat5: "AI گائیڈ",
      feat6: "پیشرفت کے سرٹیفکیٹ",
      btn: "شروع کریں"
    },
    yearlyPlan: {
      title: "سالانہ",
      price: "€99",
      save: "ماہانہ کے مقابلے میں €9 بچائیں!",
      feat1: "ماہانہ میں سب کچھ",
      feat2: "ترجیحی مدد",
      feat3: "ابتدائی رسائی کی خصوصیات",
      btn: "شروع کریں"
    },
    footerTagline: "جدید مہاجر کے لیے زبان کی بقا۔",
    footerLinks: {
      about: "ہمارے بارے میں",
      how: "یہ کیسے کام کرتا ہے",
      pricing: "قیمتیں",
      privacy: "رازداری کی پالیسی",
      terms: "سروس کی شرائط"
    },
    footerLangs: "آپ کی زبان میں دستیاب ہے۔",
    footerCredit: "© 2026 LingoForge۔ مہاجرین کے لیے، ان لوگوں کے ذریعے بنایا گیا جو سفر کو سمجھتے ہیں۔"
  },
  Bengali: {
    heroTitle: "বেঁচে থাকুন। কথা বলুন। নিজের করে নিন।",
    heroSub: "অভিবাসী কর্মীদের জন্য পরিকল্পিত ভাষা টিকে থাকার পথ।",
    selectNative: "আমি বলি...",
    selectTarget: "আমি যাচ্ছি...",
    startBtn: "আমার যাত্রা শুরু করুন - বিনামূল্যে",
    viewPaths: "শেখার পথগুলি দেখুন",
    path1Title: "বেঁচে থাকার পথ",
    path1Desc: "নতুন দেশে প্রথম দিন থেকে বেঁচে থাকতে প্রয়োজনীয় বাক্যাংশ।",
    path2Title: "বর্ণমালার পথ",
    path2Desc: "স্থানীয় ভাষায় চিহ্ন, মেনু এবং বার্তা পড়ুন।",
    path3Title: "সংখ্যার পথ",
    path3Desc: "প্রতিদিন টাকা, সময় এবং সংখ্যা আত্মবিশ্বাসের সাথে সামলান।",
    journeyTitle: "আপনার যাত্রা এখান থেকে শুরু",
    pricingTitle: "সহজ মূল্য",
    pricingSub: "বিনামূল্যে শুরু করুন। প্রস্তুত হলে আপগ্রেড করুন।",
    monthly: "মাসিক",
    yearly: "বার্ষিক",
    bestValue: "সেরা মূল্য",
    perMonth: "/মাস",
    perYear: "/বছর",
    startFree: "বিনামূল্যে শুরু করুন",
    getStarted: "শুরু করুন",
    journeyLeaving: "বাড়ি ছাড়া",
    journeyArriving: "আগমন",
    journeyWorking: "কাজ করা",
    journeySpeaking: "কথা বলা",
    journeyBelonging: "একাত্ম হওয়া",
    scenario1Title: "জরুরী অবস্থা",
    scenario1Desc: "আপনার সন্তান অসুস্থ। আপনাকে একজন ডাক্তারকে উপসর্গ ব্যাখ্যা করতে হবে। আপনি কি শব্দগুলো জানেন?",
    scenario1Btn: "চিকিৎসা শব্দভান্ডার শিখুন",
    scenario2Title: "ব্যাঙ্ক ও টাকা",
    scenario2Desc: "আপনাকে একটি ব্যাঙ্ক অ্যাকাউন্ট খুলতে হবে। ফর্মটি একটি বিদেশী ভাষায় আছে। আপনি কি এটি পূরণ করতে পারবেন?",
    scenario2Btn: "সংখ্যা ও নথি শিখুন",
    scenario3Title: "দৈনন্দিন জীবন",
    scenario3Desc: "আপনাকে কাজে যাওয়ার জন্য সঠিক বাস ধরতে হবে। ড্রাইভার ইংরেজি বলে না। আপনি কি সাহায্য চাইতে পারবেন?",
    scenario3Btn: "বেঁচে থাকার বাক্যাংশ শিখুন",
     features: {
      ai: { title: "AI-চালিত", desc: "আপনার জন্য তৈরি বাস্তব পাঠ" },
      audio: { title: "অডিও বিল্ট-ইন", desc: "প্রতিটি শব্দের জন্য স্থানীয় উচ্চারণ শুনুন" },
      dialogues: { title: "বাস্তব সংলাপ", desc: "প্রকৃত কথোপকথন যা আপনি প্রতিদিন ব্যবহার করবেন" },
      exercises: { title: "দৈনিক অনুশীলন", desc: "ফাঁকা স্থান পূরণ, MCQ, শব্দ মেলানো খেলা" },
      streak: { title: "স্ট্রিক সিস্টেম", desc: "দৈনিক স্ট্রিকের সাথে অনুপ্রাণিত থাকুন" },
      progress: { title: "অগ্রগতি ট্র্যাকিং", desc: "দেখুন প্রতি সপ্তাহে আপনি কতটা এগিয়েছেন" },
      certs: { title: "সার্টিফিকেট", desc: "আপনার অগ্রগতির প্রমাণ অর্জন করুন" },
      langs: { title: "১৭টি ভাষা", desc: "ইউরোপীয়, এশিয়ান, মধ্যপ্রাচ্য" },
    },
    freePlan: {
      title: "চিরতরে বিনামূল্যে",
      price: "€0",
      feat1: "শুধুমাত্র সপ্তাহ ১, দিন ১",
      feat2: "৫টি শব্দভান্ডার",
      feat3: "কোনো অডিও নেই",
      feat4: "কোনো অনুশীলন নেই",
      feat5: "কোনো AI গাইড নেই",
      btn: "বিনামূল্যে শুরু করুন - কার্ডের প্রয়োজন নেই"
    },
    monthlyPlan: {
      title: "মাসিক",
      price: "€9",
      feat1: "সমস্ত ৩টি পথ",
      feat2: "সমস্ত ৪৮ সপ্তাহ",
      feat3: "স্থানীয় অডিও উচ্চারণ",
      feat4: "সমস্ত অনুশীলন",
      feat5: "AI গাইড",
      feat6: "অগ্রগতি সার্টিফিকেট",
      btn: "শুরু করুন"
    },
    yearlyPlan: {
      title: "বার্ষিক",
      price: "€99",
      save: "মাসিকের তুলনায় €9 বাঁচান!",
      feat1: "মাসিকে যা আছে সবকিছু",
      feat2: "অগ্রাধিকার সমর্থন",
      feat3: "আর্লি অ্যাক্সেস ফিচার",
      btn: "শুরু করুন"
    },
    footerTagline: "আধুনিক অভিবাসীর জন্য ভাষা টিকে থাকা।",
    footerLinks: {
      about: "আমাদের সম্পর্কে",
      how: "এটি কিভাবে কাজ করে",
      pricing: "মূল্য নির্ধারণ",
      privacy: "গোপনীয়তা নীতি",
      terms: "পরিষেবার শর্তাবলী"
    },
    footerLangs: "আপনার ভাষায় উপলব্ধ।",
    footerCredit: "© 2026 LingoForge। অভিবাসীদের জন্য, যারা যাত্রা বোঝেন তাদের দ্বারা নির্মিত।"
  },
  Arabic: {
    heroTitle: "اِبقَ حياً. تكلَّم. انتمِ.",
    heroSub: "مسارات منظمة لبقاء اللغة للعمال المهاجرين.",
    selectNative: "أنا أتحدث...",
    selectTarget: "أنا ذاهب إلى...",
    startBtn: "ابدأ رحلتي - مجاناً",
    viewPaths: "عرض مسارات التعلم",
    path1Title: "مسار البقاء",
    path1Desc: "عبارات أساسية للبقاء منذ اليوم الأول في بلد جديد.",
    path2Title: "مسار الأبجدية",
    path2Desc: "اقرأ اللافتات والقوائم والرسائل باللغة المحلية.",
    path3Title: "مسار الأرقام",
    path3Desc: "تعامل مع المال والوقت والأرقام بثقة كل يوم.",
    journeyTitle: "رحلتك تبدأ من هنا",
    pricingTitle: "تسعير بسيط",
    pricingSub: "ابدأ مجانًا. قم بالترقية عندما تكون مستعدًا.",
    monthly: "شهري",
    yearly: "سنوي",
    bestValue: "أفضل قيمة",
    perMonth: "/شهر",
    perYear: "/سنة",
    startFree: "ابدأ مجاناً",
    getStarted: "ابدأ الآن",
    journeyLeaving: "مغادرة الوطن",
    journeyArriving: "الوصول",
    journeyWorking: "العمل",
    journeySpeaking: "التحدث",
    journeyBelonging: "الانتماء",
    scenario1Title: "حالة طارئة",
    scenario1Desc: "طفلك مريض. تحتاج إلى شرح الأعراض للطبيب. هل تعرف الكلمات؟",
    scenario1Btn: "تعلم المفردات الطبية",
    scenario2Title: "البنك والمال",
    scenario2Desc: "تحتاج إلى فتح حساب بنكي. النموذج بلغة أجنبية. هل يمكنك تعبئته؟",
    scenario2Btn: "تعلم الأرقام والمستندات",
    scenario3Title: "الحياة اليومية",
    scenario3Desc: "تحتاج إلى ركوب الحافلة الصحيحة للذهاب إلى العمل. السائق لا يتحدث الإنجليزية. هل يمكنك طلب المساعدة؟",
    scenario3Btn: "تعلم عبارات البقاء",
    features: {
      ai: { title: "مدعوم بالذكاء الاصطناعي", desc: "دروس حقيقية معدة لك" },
      audio: { title: "صوت مدمج", desc: "اسمع النطق الأصلي لكل كلمة" },
      dialogues: { title: "حوارات حقيقية", desc: "محادثات فعلية ستستخدمها يوميًا" },
      exercises: { title: "تمارين يومية", desc: "املأ الفراغات، اختيار من متعدد، ألعاب مطابقة الكلمات" },
      streak: { title: "نظام السلسلة", desc: "حافظ على حماسك مع السلاسل اليومية" },
      progress: { title: "تتبع التقدم", desc: "شاهد إلى أي مدى وصلت كل أسبوع" },
      certs: { title: "شهادات", desc: "احصل على إثبات لتقدمك" },
      langs: { title: "17 لغة", desc: "أوروبية، آسيوية، شرق أوسطية" },
    },
    freePlan: {
      title: "مجاني للأبد",
      price: "€0",
      feat1: "الأسبوع 1، اليوم 1 فقط",
      feat2: "5 مفردات",
      feat3: "لا يوجد صوت",
      feat4: "لا توجد تمارين",
      feat5: "لا يوجد دليل ذكاء اصطناعي",
      btn: "ابدأ مجانًا - لا حاجة لبطاقة"
    },
    monthlyPlan: {
      title: "شهري",
      price: "€9",
      feat1: "جميع المسارات الثلاثة",
      feat2: "جميع الأسابيع الـ 48",
      feat3: "نطق صوتي أصلي",
      feat4: "جميع التمارين",
      feat5: "دليل الذكاء الاصطناعي",
      feat6: "شهادات التقدم",
      btn: "ابدأ الآن"
    },
    yearlyPlan: {
      title: "سنوي",
      price: "€99",
      save: "وفر 9 يورو مقارنة بالشهري!",
      feat1: "كل شيء في الخطة الشهرية",
      feat2: "دعم ذو أولوية",
      feat3: "ميزات الوصول المبكر",
      btn: "ابدأ الآن"
    },
    footerTagline: "بقاء اللغة للمهاجر الحديث.",
    footerLinks: {
      about: "معلومات عنا",
      how: "كيف يعمل",
      pricing: "الأسعار",
      privacy: "سياسة الخصوصية",
      terms: "شروط الخدمة"
    },
    footerLangs: "متوفر بلغتك.",
    footerCredit: "© 2026 LingoForge. صُنع للمهاجرين، من قبل أشخاص يفهمون الرحلة."
  }
};

const targetLanguages = [
  { lang: "German", flag: "🇩🇪", countries: ["Germany", "Austria", "Switzerland"] },
  { lang: "French", flag: "🇫🇷", countries: ["France", "Belgium", "Switzerland", "Canada"] },
  { lang: "Italian", flag: "🇮🇹", countries: ["Italy", "Switzerland"] },
  { lang: "Spanish", flag: "🇪🇸", countries: ["Spain", "Latin America"] },
  { lang: "Portuguese", flag: "🇵🇹", countries: ["Portugal", "Brazil"] },
  { lang: "Dutch", flag: "🇳🇱", countries: ["Netherlands", "Belgium"] },
  { lang: "Greek", flag: "🇬🇷", countries: ["Greece", "Cyprus"] },
  { lang: "Polish", flag: "🇵🇱", countries: ["Poland"] },
  { lang: "Romanian", flag: "🇷🇴", countries: ["Romania"] },
  { lang: "Serbian", flag: "🇷🇸", countries: ["Serbia"] },
  { lang: "Russian", flag: "🇷🇺", countries: ["Russia"] },
  { lang: "Finnish", flag: "🇫🇮", countries: ["Finland"] },
  { lang: "Korean", flag: "🇰🇷", countries: ["South Korea"] },
  { lang: "Japanese", flag: "🇯🇵", countries: ["Japan"] },
  { lang: "Arabic", flag: "🇸🇦", countries: ["UAE", "Saudi Arabia", "Qatar", "Kuwait"] },
  { lang: "Hebrew", flag: "🇮🇱", countries: ["Israel"] },
  { lang: "English", flag: "🇬🇧", countries: ["UK", "Australia", "Canada", "USA"] }
];

const nativeLanguages = Object.keys(translations);

const FloatingLangCard = ({ lang, phonetic, translation, className }: { lang: string, phonetic: string, translation: string, className?: string }) => (
  <div className={cn("rounded-lg bg-slate-800/60 p-4 shadow-xl backdrop-blur-md border border-slate-700", className)}>
    <p className="text-2xl font-bold text-white">{lang}</p>
    <p className="text-lg text-cyan-300">{phonetic}</p>
    <p className="text-md text-slate-300">{translation}</p>
  </div>
);

export default function LandingPage() {
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [targetLanguage, setTargetLanguage] = useState(targetLanguages[0].lang);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const pathsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
    if (savedLang && translations[savedLang]) {
      setNativeLanguage(savedLang);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if(isMounted) {
      localStorage.setItem("nativeLanguage", nativeLanguage);
    }
  }, [nativeLanguage, isMounted]);

  const handleScrollToPaths = () => {
    pathsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
  
  const handleStartJourney = () => {
    router.push('/dashboard');
  }

  const t = translations[nativeLanguage];
  const isRTL = ['Urdu', 'Arabic'].includes(nativeLanguage);

  if (!isMounted) {
    return <div className="w-full min-h-screen bg-slate-900" />;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className={cn("bg-slate-900 text-white font-body", isRTL ? 'font-sans' : 'font-body')}>
      
      <nav className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <Languages className="h-7 w-7 text-cyan-400" />
              <span className="font-headline text-2xl font-bold">LingoForge</span>
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-slate-400"><Globe className="inline-block h-4 w-4 mr-1" /></span>
              {nativeLanguages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setNativeLanguage(lang as keyof typeof translations)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-md transition-colors",
                    nativeLanguage === lang ? "bg-cyan-500 text-white font-semibold" : "text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative flex items-center min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              
              <div className="lg:w-3/5 z-10 text-center lg:text-left">
                <Badge variant="outline" className="border-cyan-400/50 bg-cyan-900/30 text-cyan-300 mb-4">🌍 17 Languages Available</Badge>
                <h1 className="font-headline text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">{t.heroTitle}</h1>
                <p className="mt-4 max-w-xl mx-auto lg:mx-0 text-lg md:text-xl text-slate-300">{t.heroSub}</p>
                
                <div className="mt-8 w-full max-w-md mx-auto lg:mx-0 space-y-4 rounded-lg bg-slate-800/50 p-6 border border-slate-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select value={nativeLanguage} onValueChange={(value) => setNativeLanguage(value as keyof typeof translations)}>
                      <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white"><SelectValue placeholder={t.selectNative} /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        {nativeLanguages.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
                      </SelectContent>
                    </Select>
                     <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                      <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-white"><SelectValue placeholder={t.selectTarget} /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-80">
                        {targetLanguages.map(lang => (
                          <SelectItem key={lang.lang} value={lang.lang}>
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{lang.flag}</span>
                              <div>
                                <p>{lang.lang}</p>
                                <p className="text-xs text-slate-400">{lang.countries.join(', ')}</p>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="flex flex-col sm:flex-row gap-3">
                      <Button size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold" onClick={handleStartJourney}>{t.startBtn}</Button>
                      <Button size="lg" variant="outline" className="w-full border-slate-600 hover:bg-slate-700" onClick={handleScrollToPaths}>{t.viewPaths}</Button>
                   </div>
                </div>
              </div>
              
              <div className="hidden lg:block lg:w-2/5 h-full relative">
                <FloatingLangCard lang="🇩🇪 Guten Tag" phonetic="Goo-ten tahg" translation="Good day" className="absolute top-0 left-10 float-1" />
                <FloatingLangCard lang="🇯🇵 こんにちは" phonetic="Konnichiwa" translation="Hello" className="absolute top-32 right-0 float-2" />
                <FloatingLangCard lang="🇪🇸 ¿Cómo estás?" phonetic="Como es-tas" translation="How are you?" className="absolute top-64 left-20 float-3" />
                <FloatingLangCard lang="🇸🇦 مرحبا" phonetic="Marhaban" translation="Welcome" className="absolute top-96 right-10 float-4" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-slate-900">
          <div className="container mx-auto px-4">
            <Card className="bg-slate-800/50 border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl md:text-4xl font-bold">{t.journeyTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-center text-xs sm:text-sm mb-12 px-2">
                  {([
                    { icon: <PlaneTakeoff/>, label: t.journeyLeaving },
                    { icon: <Home/>, label: t.journeyArriving },
                    { icon: <Briefcase/>, label: t.journeyWorking },
                    { icon: <MessageSquare/>, label: t.journeySpeaking },
                    { icon: <Award/>, label: t.journeyBelonging },
                  ]).map((item, index) => (
                    <React.Fragment key={item.label}>
                      <div className="flex flex-col items-center gap-2 w-1/5">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-cyan-900/50 border-2 border-cyan-500/50 text-cyan-400">
                          {React.cloneElement(item.icon, { className: 'w-6 h-6 sm:w-8 sm:h-8' })}
                        </div>
                        <p className="font-semibold">{item.label}</p>
                      </div>
                      {index < 4 && <div className="flex-1 h-px bg-slate-600 hidden sm:block"></div>}
                    </React.Fragment>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                   <Card className="bg-slate-800 border-slate-700">
                     <CardHeader>
                       <div className="mx-auto w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center text-red-400"><Stethoscope/></div>
                       <CardTitle>{t.scenario1Title}</CardTitle>
                       <CardDescription className="text-slate-400">{t.scenario1Desc}</CardDescription>
                     </CardHeader>
                     <CardContent><Button variant="link" className="text-cyan-400">{t.scenario1Btn}</Button></CardContent>
                   </Card>
                   <Card className="bg-slate-800 border-slate-700">
                     <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-900/50 flex items-center justify-center text-green-400"><Landmark/></div>
                       <CardTitle>{t.scenario2Title}</CardTitle>
                       <CardDescription className="text-slate-400">{t.scenario2Desc}</CardDescription>
                     </CardHeader>
                     <CardContent><Button variant="link" className="text-cyan-400">{t.scenario2Btn}</Button></CardContent>
                   </Card>
                   <Card className="bg-slate-800 border-slate-700">
                     <CardHeader>
                       <div className="mx-auto w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center text-yellow-400"><Bus/></div>
                       <CardTitle>{t.scenario3Title}</CardTitle>
                       <CardDescription className="text-slate-400">{t.scenario3Desc}</CardDescription>
                     </CardHeader>
                     <CardContent><Button variant="link" className="text-cyan-400">{t.scenario3Btn}</Button></CardContent>
                   </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section ref={pathsRef} className="py-20 sm:py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="flex flex-col border-2 border-green-500 bg-gradient-to-br from-green-900/30 to-slate-900 shadow-lg shadow-green-500/10">
                <CardHeader>
                  <Badge className="w-fit bg-green-500 text-green-950 font-bold mb-2">START HERE - Recommended</Badge>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🌍</span>
                    <CardTitle className="font-headline text-2xl font-bold">{t.path1Title}</CardTitle>
                  </div>
                  <CardDescription className="pt-2 text-slate-300">{t.path1Desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-400">48 weeks • 7 days • 5 words/day</p>
                    <p className="mt-2 text-sm bg-green-900/40 p-2 rounded-md text-slate-300 font-mono">"Bonjour • Merci • S'il vous plaît"</p>
                  </div>
                  <Button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold">{t.startFree}</Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col bg-gradient-to-br from-blue-900/30 to-slate-900 border border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🔤</span>
                    <CardTitle className="font-headline text-2xl font-bold">{t.path2Title}</CardTitle>
                  </div>
                  <CardDescription className="pt-2 text-slate-300">{t.path2Desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                   <div>
                      <p className="text-sm font-semibold text-slate-400">48 weeks • 7 days • 5 chars/day</p>
                      <p className="mt-2 text-sm bg-blue-900/40 p-2 rounded-md text-slate-300 font-mono">"A B C • あ い う • 가 나 다"</p>
                   </div>
                  <Button variant="secondary" className="w-full bg-slate-700 hover:bg-slate-600">{t.getStarted}</Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col bg-gradient-to-br from-purple-900/30 to-slate-900 border border-slate-700">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🔢</span>
                    <CardTitle className="font-headline text-2xl font-bold">{t.path3Title}</CardTitle>
                  </div>
                  <CardDescription className="pt-2 text-slate-300">{t.path3Desc}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-400">48 weeks • 7 days • 5 numbers/day</p>
                    <p className="mt-2 text-sm bg-purple-900/40 p-2 rounded-md text-slate-300 font-mono">"1 2 3 • Ein Zwei Drei • 一 二 三"</p>
                  </div>
                  <Button variant="secondary" className="w-full bg-slate-700 hover:bg-slate-600">{t.getStarted}</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24 bg-slate-900">
            <div className="container mx-auto px-4">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                      { icon: <Sparkles/>, ...t.features.ai },
                      { icon: <Volume2/>, ...t.features.audio },
                      { icon: <MessageSquare/>, ...t.features.dialogues },
                      { icon: <Pencil/>, ...t.features.exercises },
                      { icon: <Flame/>, ...t.features.streak },
                      { icon: <BarChart/>, ...t.features.progress },
                      { icon: <BadgeCheck/>, ...t.features.certs },
                      { icon: <Globe/>, ...t.features.langs }
                    ].map(feature => (
                        <div key={feature.title} className="text-center">
                            <div className="mx-auto w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 mb-3">
                               {React.cloneElement(feature.icon, { className: 'w-6 h-6'})}
                            </div>
                            <h3 className="font-semibold text-white">{feature.title}</h3>
                            <p className="text-sm text-slate-400">{feature.desc}</p>
                        </div>
                    ))}
                 </div>
            </div>
        </section>
        
        <section className="py-20 sm:py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">{t.pricingTitle}</h2>
              <p className="text-lg text-slate-300 mt-2">{t.pricingSub}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              <Card className="flex flex-col bg-slate-800 border-slate-700 p-6">
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">{t.freePlan.title}</CardTitle>
                  <p className="text-4xl font-extrabold mt-2">{t.freePlan.price}</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-400 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-green-500"/> {t.freePlan.feat1}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-green-500"/> {t.freePlan.feat2}</li>
                    <li className="flex items-center gap-2 opacity-50"><XCircle className="w-5 h-5"/> {t.freePlan.feat3}</li>
                    <li className="flex items-center gap-2 opacity-50"><XCircle className="w-5 h-5"/> {t.freePlan.feat4}</li>
                    <li className="flex items-center gap-2 opacity-50"><XCircle className="w-5 h-5"/> {t.freePlan.feat5}</li>
                  </ul>
                  <Button variant="outline" className="w-full border-slate-600 hover:bg-slate-700">{t.freePlan.btn}</Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col bg-slate-800 border-2 border-cyan-500 p-6">
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">{t.monthlyPlan.title}</CardTitle>
                  <p className="text-4xl font-extrabold mt-2">{t.monthlyPlan.price}<span className="text-base font-medium text-slate-400">{t.perMonth}</span></p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.monthlyPlan.feat1}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.monthlyPlan.feat2}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.monthlyPlan.feat3}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.monthlyPlan.feat4}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.monthlyPlan.feat5}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-cyan-400"/> {t.monthlyPlan.feat6}</li>
                  </ul>
                  <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold">{t.monthlyPlan.btn}</Button>
                </CardContent>
              </Card>
              
              <Card className="relative flex flex-col bg-slate-800 border-2 border-yellow-500 p-6 shadow-lg shadow-yellow-500/20">
                <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-yellow-950 font-bold">⭐ {t.bestValue}</Badge>
                <CardHeader className="p-0">
                  <CardTitle className="font-bold text-xl">{t.yearlyPlan.title}</CardTitle>
                   <p className="text-4xl font-extrabold mt-2">{t.yearlyPlan.price}<span className="text-base font-medium text-slate-400">{t.perYear}</span></p>
                   <p className="text-sm font-semibold text-yellow-400">{t.yearlyPlan.save}</p>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-slate-300 my-6">
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> {t.yearlyPlan.feat1}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> {t.yearlyPlan.feat2}</li>
                    <li className="flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-yellow-400"/> {t.yearlyPlan.feat3}</li>
                  </ul>
                  <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold">{t.yearlyPlan.btn}</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <footer className="bg-slate-900 border-t border-slate-800">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <Link href="/" className="flex items-center gap-2">
                  <Languages className="h-8 w-8 text-cyan-400" />
                  <span className="font-headline text-2xl font-bold">LingoForge</span>
                </Link>
                <p className="mt-2 text-slate-400">{t.footerTagline}</p>
                 <div className="mt-4 flex space-x-4">
                  <Link href="#" className="text-slate-400 hover:text-white"><Twitter /></Link>
                  <Link href="#" className="text-slate-400 hover:text-white"><Github /></Link>
                  <Link href="#" className="text-slate-400 hover:text-white"><Linkedin /></Link>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white tracking-wider uppercase">{t.footerLinks.about}</h4>
                <ul className="mt-4 space-y-2">
                  {Object.values(t.footerLinks).map(link => (
                     <li key={link}><Link href="#" className="text-slate-400 hover:text-white">{link}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white tracking-wider uppercase">{t.footerLangs}</h4>
                <ul className="mt-4 space-y-2">
                  {nativeLanguages.map(lang => (
                    <li key={lang}>
                      <button onClick={() => setNativeLanguage(lang as keyof typeof translations)} className="text-slate-400 hover:text-white">{lang}</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
              <p>{t.footerCredit}</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
