import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp, API } from '@/context/AppContext';
import { t, LANGS } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import {
  Bot, X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles,
  ArrowRight, CheckCircle2, RotateCcw, HelpCircle, FileText
} from 'lucide-react';

// BCP-47 Speech Recognition and Synthesis Language Map
const SPEECH_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
};

// Localized initial welcome messages & options
const INITIAL_PROMPTS = {
  hi: {
    text: "नमस्ते! मैं आपका ग्रामीण उद्योग आवाज़ सहायक हूँ। यदि आप कोई भी नया व्यवसाय शुरू करना चाहते हैं, तो मुझे बताएं। मैं आपसे ज़रूरी जानकारियाँ लेकर आपकी रिपोर्ट तैयार करने में मदद करूँगा या व्यापार व सरकारी योजनाओं से जुड़े आपके सवालों के जवाब दूँगा।",
    speechText: "नमस्ते! मैं आपका ग्रामीण उद्योग आवाज़ सहायक हूँ। यदि आप कोई भी व्यवसाय शुरू करना चाहते हैं, तो मुझे बोलकर बताएं। मैं आपकी पूरी रिपोर्ट तैयार करने में मदद करूँगा।",
    options: [
      '📝 रिपोर्ट फॉर्म भरने में मदद करें',
      '💼 उपलब्ध सभी व्यवसाय देखें',
      '🏛️ सरकारी ऋण योजनाएं',
      '📄 लोन के लिए आवश्यक दस्तावेज़',
      '💡 वायेबिलिटी स्कोर क्या होता है?'
    ]
  },
  en: {
    text: "Namaste! I am your Grameen Udyog AI Voice Sahayak. If you wish to start any business, tell me what enterprise you have in mind. I can help you fill the business advisory form step-by-step or answer any business & website questions.",
    speechText: "Namaste! I am your Grameen Udyog AI Voice Sahayak. If you wish to start any business, tell me what enterprise you have in mind. I will help you fill the advisory form step by step.",
    options: [
      '📝 Help me fill the report form',
      '💼 View all available businesses',
      '🏛️ Government loan schemes',
      '📄 Documents required for loan',
      '💡 What is Viability Score?'
    ]
  },
  mr: {
    text: "नमस्कार! मी तुमचा ग्रामीण उद्योग आवाज सहाय्यक आहे. तुम्हाला कोणताही व्यवसाय सुरू करायचा असल्यास, मला सांगा. मी आवश्यक माहिती घेऊन तुमचा अहवाल तयार करण्यास मदत करेन किंवा योजनांची माहिती देईन.",
    speechText: "नमस्कार! मी तुमचा ग्रामीण उद्योग आवाज सहाय्यक आहे. तुम्हाला कोणताही व्यवसाय सुरू करायचा असल्यास, मला सांगा.",
    options: [
      '📝 रिपोर्ट फॉर्म भरण्यास मदत करा',
      '💼 उपलब्ध सर्व व्यवसाय पहा',
      '🏛️ शासकीय कर्ज योजना',
      '📄 कर्जासाठी लागणारी कागदपत्रे'
    ]
  },
  ta: {
    text: "வணக்கம்! நான் கிராமீன் உத்யோக் குரல் உதவியாளர். நீங்கள் ஏதேனும் தொழில் தொடங்க விரும்பினால் என்னிடம் கூறுங்கள். தேவையான விவரங்களைப் பெற்று உங்கள் அறிக்கையைத் தயாரிக்க உதவுவேன்.",
    speechText: "வணக்கம்! நான் கிராமீன் உத்யோக் குரல் உதவியாளர்.",
    options: [
      '📝 ஆலோசனை படிவத்தை நிரப்பவும்',
      '💼 கிடைக்கக்கூடிய தொழில்கள்',
      '🏛️ அரசு கடன் திட்டங்கள்',
      '📄 கடனுக்கான ஆவணங்கள்'
    ]
  },
  te: {
    text: "నమస్తే! నేను మీ గ్రామీణ్ ఉద్యోగ్ వాయిస్ అసిస్టెంట్‌ని. మీరు ఏదైనా వ్యాపారాన్ని ప్రారంభించాలనుకుంటే నాకు చెప్పండి. మీ వివరాలను తీసుకొని నివేదిక రూపొందించడంలో సహాయపడతాను.",
    speechText: "నమస్తే! నేను మీ గ్రామీణ్ ఉద్యోగ్ వాయిస్ అసిస్టెంట్‌ని.",
    options: [
      '📝 ఫారమ్ పూరించడానికి సహాయం',
      '💼 అందుబాటులో ఉన్న వ్యాపారాలు',
      '🏛️ ప్రభుత్వ రుణ పథకాలు',
      '📄 అవసరమైన పత్రాలు'
    ]
  },
  bn: {
    text: "নমস্কার! আমি গ্রামীণ উদ্যোগ ভয়েস সহকারী। আপনি কোনো ব্যবসা শুরু করতে চাইলে আমাকে জানান। প্রয়োজনীয় তথ্য নিয়ে আপনার প্রতিবেদন তৈরিতে সাহায্য করব।",
    speechText: "নমস্কার! আমি গ্রামীণ উদ্যোগ ভয়েস সহকারী।",
    options: [
      '📝 ফর্ম পূরণ করতে সাহায্য করুন',
      '💼 উপলব্ধ ব্যবসা সমূহ',
      '🏛️ সরকারি ঋণ প্রকল্পসমূহ',
      '📄 ঋণের জন্য প্রয়োজনীয় কাগজপত্র'
    ]
  }
};

export default function ChatbotModal() {
  const { isChatOpen, setIsChatOpen, lang, setLang, applyAdvisoryDraft } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Read initial autoSpeak preference from localStorage (persists user preference)
  const [autoSpeak, setAutoSpeak] = useState(() => {
    try {
      const saved = localStorage.getItem('gu_auto_speak');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  const [speakingId, setSpeakingId] = useState(null);
  const [formState, setFormState] = useState({ step: 'idle' });
  const [quickOptions, setQuickOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Refs to avoid stale closures in event listeners & speech callbacks
  const formStateRef = useRef(formState);
  const autoSpeakRef = useRef(autoSpeak);
  const langRef = useRef(lang);
  const sendMessageRef = useRef(null);
  const activeUtteranceRef = useRef(null);
  const speechTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const accumulatedSpeechRef = useRef('');
  const speechSilenceTimerRef = useRef(null);

  // Sync state refs on every update
  useEffect(() => {
    formStateRef.current = formState;
  }, [formState]);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
    try {
      localStorage.setItem('gu_auto_speak', autoSpeak ? 'true' : 'false');
    } catch (e) {}
  }, [autoSpeak]);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  // Clean and robust Text-to-Speech stoppage
  const stopSpeaking = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    if ('speechSynthesis' in window) {
      try {
        if (activeUtteranceRef.current) {
          activeUtteranceRef.current.onstart = null;
          activeUtteranceRef.current.onend = null;
          activeUtteranceRef.current.onerror = null;
        }
        window.speechSynthesis.cancel();
      } catch (e) {
        console.warn('SpeechSynthesis cancel warning:', e);
      }
    }
    activeUtteranceRef.current = null;
    setSpeakingId(null);
  };

  // Toggle playback for a specific message (Play if stopped, Stop immediately if already playing)
  const handleToggleSpeak = (text, messageId) => {
    if (!('speechSynthesis' in window)) return;

    // If already playing this message, clicking STOP means permanently stop
    if (speakingId === messageId) {
      stopSpeaking();
      return;
    }

    // Stop any existing speech first
    stopSpeaking();

    const targetLang = langRef.current || 'hi';
    const cleanText = (text || '').replace(/[*•#_\n]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = SPEECH_LANG_MAP[targetLang] || 'hi-IN';
    utterance.rate = 0.95;

    // Localized voice selection if available
    try {
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang === utterance.lang || v.lang.replace('_', '-').startsWith(targetLang)
      );
      if (matchedVoice) utterance.voice = matchedVoice;
    } catch (e) {}

    utterance.onstart = () => {
      setSpeakingId(messageId);
    };
    utterance.onend = () => {
      setSpeakingId(null);
      activeUtteranceRef.current = null;
    };
    utterance.onerror = (e) => {
      setSpeakingId(null);
      activeUtteranceRef.current = null;
    };

    activeUtteranceRef.current = utterance;

    // Brief 50ms pause before starting ensures clean playback on Chrome & Edge
    speechTimeoutRef.current = setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('TTS speak error:', e);
      }
    }, 50);
  };

  // Auto-speak function that strictly checks autoSpeak preference
  const triggerAutoSpeak = (text, messageId) => {
    if (!autoSpeakRef.current) return;
    handleToggleSpeak(text, messageId);
  };

  // Toggle overall audio mute / unmute
  const handleToggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeak(next);
    autoSpeakRef.current = next;
    try {
      localStorage.setItem('gu_auto_speak', next ? 'true' : 'false');
    } catch (e) {}

    if (!next) {
      stopSpeaking();
      toast.info(lang === 'hi' ? 'आवाज़ बंद कर दी गई है' : 'Voice audio turned off');
    } else {
      toast.success(lang === 'hi' ? 'आवाज़ चालू कर दी गई है' : 'Voice audio turned on');
    }
  };

  // Send message to backend (reads from refs to guarantee latest state)
  const sendMessage = async (customText = null) => {
    const textToSend = (customText !== null ? customText : inputText).trim();
    if (!textToSend) return;

    stopSpeaking();
    setInputText('');

    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const currentLang = langRef.current || 'hi';
      const currentState = formStateRef.current || { step: 'idle' };

      const res = await axios.post(`${API}/chat/message`, {
        message: textToSend,
        language: currentLang,
        state: currentState,
      });

      const botMsg = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: res.data.reply,
        speechText: res.data.speechText || res.data.reply,
        options: res.data.options || [],
        action: res.data.action,
        extractedData: res.data.extractedData,
      };

      const newFormState = res.data.formState || currentState;
      setFormState(newFormState);
      formStateRef.current = newFormState;

      setQuickOptions(res.data.options || []);
      setMessages((prev) => [...prev, botMsg]);

      // Speak aloud only if autoSpeak is enabled
      if (autoSpeakRef.current && botMsg.speechText) {
        triggerAutoSpeak(botMsg.speechText, botMsg.id);
      }
    } catch (e) {
      console.error(e);
      const errMsg = {
        id: 'err-' + Date.now(),
        sender: 'bot',
        text: langRef.current === 'hi' ? 'क्षमा करें, सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।' : 'Sorry, failed to connect to server. Please try again.',
        speechText: langRef.current === 'hi' ? 'क्षमा करें, सर्वर से संपर्क नहीं हो सका।' : 'Sorry, failed to connect to server.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Keep sendMessageRef updated on every render
  sendMessageRef.current = sendMessage;

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = SPEECH_LANG_MAP[lang] || 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        accumulatedSpeechRef.current = '';
        stopSpeaking(); // Stop any audio while user is speaking
      };

      recognition.onresult = (event) => {
        let full = '';
        for (let i = 0; i < event.results.length; i++) {
          full += event.results[i][0].transcript + ' ';
        }
        full = full.trim();
        if (full) {
          accumulatedSpeechRef.current = full;
          setInputText(full);

          // Wait for 1.6s of silence before auto-sending speech
          if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
          speechSilenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {}
            }
          }, 1600);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
        const finalSpoken = (accumulatedSpeechRef.current || '').trim();
        if (finalSpoken) {
          accumulatedSpeechRef.current = '';
          // Always call latest sendMessageRef to ensure state is fresh!
          if (sendMessageRef.current) {
            sendMessageRef.current(finalSpoken);
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (speechSilenceTimerRef.current) clearTimeout(speechSilenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [lang]);

  // Update speech recognition language when lang changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = SPEECH_LANG_MAP[lang] || 'hi-IN';
    }
  }, [lang]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isListening]);

  // Handle opening and language switching for initial welcome message
  useEffect(() => {
    if (!isChatOpen) {
      stopSpeaking();
      return;
    }

    const hasUserMessages = messages.some((m) => m.sender === 'user');
    // If chat is fresh or has only the initial welcome message, set welcome message
    if (!hasUserMessages) {
      const init = INITIAL_PROMPTS[lang] || INITIAL_PROMPTS.hi;
      const welcomeMsg = {
        id: 'welcome-' + lang + '-' + Date.now(),
        sender: 'bot',
        text: init.text,
        speechText: init.speechText,
        options: init.options,
      };
      setMessages([welcomeMsg]);
      setQuickOptions(init.options);

      if (autoSpeakRef.current && init.speechText) {
        const timer = setTimeout(() => {
          triggerAutoSpeak(init.speechText, welcomeMsg.id);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [isChatOpen, lang]);

  // Toggle voice recognition listening
  const toggleListening = () => {
    stopSpeaking();
    if (!recognitionRef.current) {
      toast.error(t(lang, 'browserSpeechNotSupported'));
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  };

  // Handle applying collected data to Advisory form
  const handleApplyForm = (extractedData) => {
    stopSpeaking();
    applyAdvisoryDraft(extractedData);
    toast.success(t(lang, 'formFilledNotice'));
    setIsChatOpen(false);

    if (location.pathname !== '/advisory') {
      navigate('/advisory');
    }
  };

  // Restart chat session cleanly
  const handleResetChat = () => {
    stopSpeaking();
    const freshState = { step: 'idle' };
    setFormState(freshState);
    formStateRef.current = freshState;

    const init = INITIAL_PROMPTS[lang] || INITIAL_PROMPTS.hi;
    const welcomeMsg = {
      id: 'welcome-' + lang + '-' + Date.now(),
      sender: 'bot',
      text: init.text,
      speechText: init.speechText,
      options: init.options,
    };
    setMessages([welcomeMsg]);
    setQuickOptions(init.options);

    if (autoSpeakRef.current && init.speechText) {
      triggerAutoSpeak(init.speechText, welcomeMsg.id);
    }
  };

  if (!isChatOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-6 bg-black/40 backdrop-blur-xs transition-opacity"
      data-testid="chatbot-backdrop"
    >
      <div
        className="w-full sm:max-w-lg h-[88vh] sm:h-[650px] bg-background border border-border shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        data-testid="chatbot-modal"
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center border border-primary-foreground/20">
              <Bot size={22} className="text-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold text-base flex items-center gap-2">
                <span>{t(lang, 'aiSahayak')}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <div className="text-[11px] text-primary-foreground/80">
                {t(lang, 'aiSahayakSubtitle')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Auto-Speak Toggle Button */}
            <button
              onClick={handleToggleAutoSpeak}
              className={`p-2 rounded-full transition-colors ${
                autoSpeak
                  ? 'bg-primary-foreground/25 text-white'
                  : 'text-primary-foreground/60 hover:text-white hover:bg-primary-foreground/10'
              }`}
              title={autoSpeak ? (lang === 'hi' ? 'आवाज़ बंद करें' : 'Turn off voice') : (lang === 'hi' ? 'आवाज़ चालू करें' : 'Turn on voice')}
              data-testid="auto-speak-toggle"
            >
              {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {/* Reset Chat */}
            <button
              onClick={handleResetChat}
              className="p-2 text-primary-foreground/70 hover:text-white rounded-full hover:bg-primary-foreground/10 transition-colors"
              title={t(lang, 'clearChat')}
              data-testid="reset-chat-btn"
            >
              <RotateCcw size={17} />
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                stopSpeaking();
                setIsChatOpen(false);
              }}
              className="p-2 text-primary-foreground/80 hover:text-white rounded-full hover:bg-primary-foreground/10 transition-colors"
              data-testid="close-chat-btn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="bg-muted/60 border-b border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{LANGS.find((l) => l.code === lang)?.native || 'English'}</span>
          </div>
          {formState.step !== 'idle' && (
            <div className="flex items-center gap-1 text-primary font-semibold">
              <span>{t(lang, 'step')}: {formState.step}</span>
            </div>
          )}
        </div>

        {/* Message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20" data-testid="chat-messages">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            const isSpeakingThis = speakingId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
                data-testid={`message-${msg.sender}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot size={16} className="text-primary" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 shadow-xs text-sm leading-relaxed ${
                  isBot
                    ? 'bg-card border border-border text-card-foreground rounded-tl-xs'
                    : 'bg-primary text-primary-foreground rounded-tr-xs'
                }`}>
                  {/* Message Text */}
                  <div className="whitespace-pre-line break-words">
                    {msg.text}
                  </div>

                  {/* Audio Listen / Stop Button for Bot Messages */}
                  {isBot && (
                    <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleSpeak(msg.speechText || msg.text, msg.id)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                          isSpeakingThis
                            ? 'bg-accent text-accent-foreground animate-pulse'
                            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                        data-testid={`speak-btn-${msg.id}`}
                      >
                        {isSpeakingThis ? (
                          <>
                            <VolumeX size={14} />
                            <span>{t(lang, 'stopTooltip')}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 size={14} />
                            <span>{t(lang, 'speakTooltip')}</span>
                          </>
                        )}
                      </button>

                      {isSpeakingThis && (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-3 bg-accent animate-bounce"></span>
                          <span className="w-1.5 h-4 bg-accent animate-bounce delay-75"></span>
                          <span className="w-1.5 h-2 bg-accent animate-bounce delay-150"></span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Ready Action Button */}
                  {msg.action === 'ready_to_apply' && msg.extractedData && (
                    <div className="mt-3 space-y-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplyForm(msg.extractedData)}
                        className="w-full gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                        data-testid="apply-form-btn"
                      >
                        <CheckCircle2 size={16} />
                        {t(lang, 'applyToFormBtn')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-2.5 items-center text-muted-foreground text-xs pl-2">
              <Bot size={15} className="animate-spin text-primary" />
              <span>{t(lang, 'generating')}</span>
            </div>
          )}

          {/* Listening State Banner */}
          {isListening && (
            <div className="border border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl flex flex-col gap-1.5 text-xs animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                  <span className="font-bold">{lang === 'hi' ? 'बोलिए, हम पूरी बात सुन रहे हैं...' : 'Listening... Speak your full sentence'}</span>
                </div>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="font-bold underline text-emerald-700 dark:text-emerald-300 ml-2"
                >
                  {t(lang, 'micStop')}
                </button>
              </div>
              {inputText && (
                <div className="text-[11px] bg-background/80 p-2 rounded-md border border-emerald-500/20 italic text-foreground">
                  "{inputText}"
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {quickOptions.length > 0 && !loading && (
          <div className="bg-background border-t border-border px-4 py-2.5 flex gap-2 overflow-x-auto no-scrollbar" data-testid="chat-options">
            {quickOptions.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(opt)}
                className="shrink-0 text-xs font-semibold border border-border bg-card hover:bg-primary/10 hover:border-primary text-foreground px-3 py-1.5 rounded-full transition-colors"
                data-testid={`option-chip-${idx}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Input Controls */}
        <div className="p-3 bg-background border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Mic / Voice-to-Text Button */}
            <Button
              type="button"
              variant={isListening ? "default" : "outline"}
              size="icon"
              onClick={toggleListening}
              className={`rounded-full shrink-0 w-11 h-11 transition-all ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-md'
                  : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground'
              }`}
              title={isListening ? t(lang, 'micStop') : t(lang, 'micBtn')}
              data-testid="voice-input-btn"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </Button>

            {/* Text Input */}
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t(lang, 'typePlaceholder')}
              className="rounded-full h-11 px-4 text-sm bg-muted/40 focus-visible:ring-1 focus-visible:ring-primary"
              data-testid="chat-input"
            />

            {/* Send Button */}
            <Button
              type="submit"
              size="icon"
              disabled={!inputText.trim() || loading}
              className="rounded-full shrink-0 w-11 h-11 bg-primary text-primary-foreground shadow-sm disabled:opacity-40"
              data-testid="send-message-btn"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
