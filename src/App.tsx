/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MoreVertical, 
  History, 
  FileText, 
  FileCode, 
  User, 
  Send, 
  Bird, 
  X,
  Mail,
  Cloud,
  Globe,
  Trash2,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generatePDF, generateDocx } from './utils/fileGenerator';

// Types
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface HistoryItem {
  id: number;
  query: string;
  response: string;
  timestamp: string;
}

// Translations
const translations = {
  en: {
    accounts: "Accounts",
    language: "Language / Idioma",
    history: "Show History",
    createFile: "Create File",
    exportPdf: "Export as PDF",
    exportDocx: "Export as Docx",
    placeholder: "Message Athena...",
    welcomeTitle: "How can Athena assist you today?",
    welcomeSubtitle: "Ask me to research a topic, summarize data, or generate professional documents.",
    linkAccounts: "Link Accounts",
    googleAccount: "Google Account",
    microsoftAccount: "Microsoft Account",
    syncGmail: "Sync your Gmail and Drive",
    syncOutlook: "Sync Outlook and OneDrive",
    connect: "Connect",
    historyTitle: "Conversation History",
    noHistory: "No history found. Start a conversation!",
    query: "Query",
    response: "Response",
    noResearch: "No research content available. Please chat with Athena first!",
    reportTitle: "Research Report",
    reportFilename: "Research_Report",
    error: "I'm sorry, I encountered an error. Please check your API key or try again.",
    noResponse: "I'm sorry, I couldn't generate a response.",
    clearHistory: "Clear History",
    copy: "Copy",
    copied: "Copied!",
    voiceMode: "Voice Mode",
    listening: "Listening...",
    wakeWordHint: "Say 'Athena' to start",
    stopVoice: "Stop Voice Mode",
    athenaVoice: "Athena's Voice",
    enableVoice: "Enable Athena"
  },
  es: {
    accounts: "Cuentas",
    language: "Idioma / Language",
    history: "Ver Historial",
    createFile: "Crear Archivo",
    exportPdf: "Exportar como PDF",
    exportDocx: "Exportar como Docx",
    placeholder: "Enviar mensaje a Athena...",
    welcomeTitle: "¿Cómo puede Athena ayudarte hoy?",
    welcomeSubtitle: "Pídeme investigar un tema, resumir datos o generar documentos profesionales.",
    linkAccounts: "Vincular Cuentas",
    googleAccount: "Cuenta de Google",
    microsoftAccount: "Cuenta de Microsoft",
    syncGmail: "Sincroniza tu Gmail y Drive",
    syncOutlook: "Sincroniza Outlook y OneDrive",
    connect: "Conectar",
    historyTitle: "Historial de Conversaciones",
    noHistory: "No se encontró historial. ¡Comienza una conversación!",
    query: "Consulta",
    response: "Respuesta",
    noResearch: "No hay contenido de investigación disponible. ¡Por favor, chatea con Athena primero!",
    reportTitle: "Informe de Investigación",
    reportFilename: "Informe_de_Investigacion",
    error: "Lo siento, encontré un error. Por favor, verifica tu clave API o inténtalo de nuevo.",
    noResponse: "Lo siento, no pude generar una respuesta.",
    clearHistory: "Borrar Historial",
    copy: "Copiar",
    copied: "¡Copiado!",
    voiceMode: "Modo de Voz",
    listening: "Escuchando...",
    wakeWordHint: "Di 'Athena' para comenzar",
    stopVoice: "Detener Modo de Voz",
    athenaVoice: "Voz de Athena",
    enableVoice: "Activar Athena"
  }
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showKebab, setShowKebab] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPassiveListening, setIsPassiveListening] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [isMicInitialized, setIsMicInitialized] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const kebabRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionRunningRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const t = translations[language];

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, voiceTranscript, isLoading]);

  useEffect(() => {
    fetchHistory();
    initSpeechRecognition();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'en' ? 'en-US' : 'es-ES';
    }
  }, [language]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const saveToHistory = async (query: string, response: string) => {
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, response })
      });
      fetchHistory();
    } catch (err) {
      console.error('Failed to save history', err);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm(t.clearHistory + "?")) return;
    try {
      await fetch('/api/history', { method: 'DELETE' });
      fetchHistory();
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(event.target as Node)) {
        setShowKebab(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'en' ? 'en-US' : 'es-ES';

    recognition.onstart = () => {
      console.log("Speech recognition started");
      setIsRecognitionActive(true);
      isRecognitionRunningRef.current = true;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please enable it in your browser settings.");
      }
      setIsRecognitionActive(false);
      isRecognitionRunningRef.current = false;
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = (finalTranscript || interimTranscript).trim().toLowerCase();
      
      // Check for exit command
      if (isVoiceMode && (currentText.includes('adiós') || currentText.includes('adios') || currentText.includes('goodbye'))) {
        deactivateVoiceMode();
        return;
      }

      if (isPassiveListening && currentText.includes('athena')) {
        activateVoiceMode();
        const afterAthena = currentText.split('athena')[1]?.trim();
        if (afterAthena) {
          setVoiceTranscript(afterAthena);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            handleVoiceInput(afterAthena);
            setVoiceTranscript('');
            try { recognition.stop(); } catch(e) {}
          }, 2000);
        }
        return;
      }

      if (isVoiceMode && !isSpeaking && !isLoading) {
        setVoiceTranscript(currentText);
        
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        if (currentText.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            if (isVoiceMode && !isSpeaking && !isLoading) {
              handleVoiceInput(currentText);
              setVoiceTranscript('');
              // Stop recognition to clear the buffer for the next turn
              try { recognition.stop(); } catch(e) {}
            }
          }, 2000);
        }
      }
    };

    recognition.onend = () => {
      console.log("Speech recognition ended");
      setIsRecognitionActive(false);
      isRecognitionRunningRef.current = false;
      // Only restart if we are in a listening state and NOT speaking
      if (isMicInitialized && (isPassiveListening || isVoiceMode) && !isSpeaking && !isLoading) {
        setTimeout(() => {
          if (!isRecognitionRunningRef.current) {
            try {
              recognition.start();
              isRecognitionRunningRef.current = true;
            } catch (e) {
              console.error("Failed to restart recognition:", e);
              isRecognitionRunningRef.current = false;
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      initSpeechRecognition();
    }
    
    if (recognitionRef.current && !isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.start();
        isRecognitionRunningRef.current = true;
        setIsMicInitialized(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
        // Don't set running to true if it failed to start
        isRecognitionRunningRef.current = false;
      }
    }
  };

  const activateVoiceMode = () => {
    startListening();
    setIsVoiceMode(true);
    setIsPassiveListening(false);
    setIsListening(true);
    setVoiceTranscript('');
  };

  const deactivateVoiceMode = () => {
    setIsVoiceMode(false);
    setIsPassiveListening(true);
    setIsListening(false);
    setVoiceTranscript('');
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
    }
  };

  const handleVoiceInput = (text: string) => {
    if (!text) return;
    setInput(text);
    handleSend(text);
  };

  const speak = async (text: string) => {
    setIsSpeaking(true);
    // Stop recognition while speaking to prevent feedback
    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try { 
        recognitionRef.current.stop(); 
        isRecognitionRunningRef.current = false;
      } catch(e) {}
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        const decodedData = await audioContextRef.current.decodeAudioData(arrayBuffer);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = decodedData;
        source.connect(audioContextRef.current.destination);
        audioSourceRef.current = source;
        
        source.onended = () => {
          setIsSpeaking(false);
          // Restart recognition after speaking ends
          if ((isVoiceMode || isPassiveListening) && recognitionRef.current) {
            setTimeout(() => {
              try { recognitionRef.current.start(); } catch(e) {}
            }, 300);
          }
        };
        source.start(0);
      } else {
        setIsSpeaking(false);
        // Restart if no audio
        if ((isVoiceMode || isPassiveListening) && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch(e) {}
        }
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      // Restart on error
      if ((isVoiceMode || isPassiveListening) && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch(e) {}
      }
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    try {
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are Athena, a professional AI assistant. Provide concise, accurate research and summaries. 
          STRICT RULE: You must detect the language of the user's input and respond EXCLUSIVELY in that same language. 
          If the user writes in Spanish, respond in Spanish. If the user writes in English, respond in English.`,
        },
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      });

      const result = await chat.sendMessage({ message: messageText });
      const responseText = result.text;
      
      const assistantMessage: Message = { role: 'assistant', content: responseText || t.noResponse };
      setMessages(prev => [...prev, assistantMessage]);
      saveToHistory(messageText, responseText || "");
      
      if (isVoiceMode) {
        speak(responseText || "");
      }
    } catch (error) {
      console.error('Gemini Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: t.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = async (type: 'pdf' | 'docx') => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMessage) {
      alert(t.noResearch);
      return;
    }

    if (type === 'pdf') {
      generatePDF(lastAssistantMessage.content, `${t.reportFilename}.pdf`, t.reportTitle);
    } else {
      await generateDocx(lastAssistantMessage.content, `${t.reportFilename}.docx`, t.reportTitle);
    }
    setShowKebab(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-navy-deep relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-royal-soft/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navigation */}
      <header className="h-16 flex items-center justify-between px-6 z-20 shrink-0 border-b border-white/5 bg-black/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAccounts(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
          >
            <User size={16} />
            <span>{t.accounts}</span>
          </button>

          <button 
            onClick={() => setLanguage(prev => prev === 'en' ? 'es' : 'en')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
          >
            <Globe size={16} className="text-blue-400" />
            <span>{t.language}</span>
          </button>

          <button 
            onClick={isVoiceMode ? deactivateVoiceMode : activateVoiceMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
              isVoiceMode 
                ? 'bg-purple-600/20 border-purple-500 text-purple-400' 
                : isMicInitialized
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-blue-600/20 border-blue-500 text-blue-400 animate-pulse'
            }`}
          >
            {isVoiceMode ? <Mic size={16} /> : isMicInitialized ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isVoiceMode ? t.listening : isMicInitialized ? t.voiceMode : t.enableVoice}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ATHENA AI
          </h1>
        </div>

        <div className="relative" ref={kebabRef}>
          <button 
            onClick={() => setShowKebab(!showKebab)}
            className="p-2 rounded-lg hover:bg-white/10 transition-all"
          >
            <MoreVertical size={20} />
          </button>

          <AnimatePresence>
            {showKebab && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 rounded-xl glass-panel shadow-2xl z-50 overflow-hidden"
              >
                <button 
                  onClick={() => { setShowHistory(true); setShowKebab(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-sm"
                >
                  <History size={16} className="text-blue-400" />
                  <span>{t.history}</span>
                </button>
                <div className="h-[1px] bg-white/10 mx-2" />
                <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">{t.createFile}</div>
                <button 
                  onClick={() => handleCreateFile('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-sm"
                >
                  <FileText size={16} className="text-red-400" />
                  <span>{t.exportPdf}</span>
                </button>
                <button 
                  onClick={() => handleCreateFile('docx')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-sm"
                >
                  <FileCode size={16} className="text-blue-500" />
                  <span>{t.exportDocx}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 overflow-hidden">
        <div className="w-full max-w-4xl h-full flex flex-col rounded-2xl border-2 border-transparent animate-glow bg-royal-soft/10 backdrop-blur-sm overflow-hidden shadow-2xl">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <div className="w-16 h-16 rounded-full bg-royal-soft/30 flex items-center justify-center">
                  <Bird className="text-blue-400" size={32} />
                </div>
                <p className="text-lg font-medium">{t.welcomeTitle}</p>
                <p className="text-sm max-w-xs">{t.welcomeSubtitle}</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 relative group ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-royal-soft/40 border border-white/10 text-slate-100'
                  }`}>
                    <div className="markdown-body text-sm leading-relaxed">
                      <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                    </div>
                    
                    <button 
                      onClick={() => handleCopy(msg.content, idx)}
                      className={`absolute -bottom-8 ${msg.role === 'user' ? 'right-0' : 'left-0'} p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider`}
                    >
                      {copiedId === idx ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                      <span>{copiedId === idx ? t.copied : t.copy}</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-royal-soft/40 border border-white/10 rounded-2xl px-4 py-3">
                  <Bird className="animate-bounce text-blue-400" size={18} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-black/20 border-t border-white/10">
            <AnimatePresence mode="wait">
              {isVoiceMode ? (
                <motion.div 
                  key="voice-bar"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-2 space-y-2"
                >
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-royal-soft/20 border-2 transition-all duration-500 ${
                      isSpeaking ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]' : 
                      isListening ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 
                      'border-white/10'
                    }`}>
                      <Bird 
                        size={32} 
                        className={`${isSpeaking ? 'text-purple-400 animate-pulse' : isListening ? 'text-blue-400' : 'text-slate-500'}`} 
                      />
                    </div>
                    {isSpeaking && (
                      <div className="absolute -top-1 -right-1 bg-purple-600 p-1 rounded-full shadow-lg">
                        <Volume2 size={12} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[11px] font-medium text-slate-400">
                      {isSpeaking ? t.athenaVoice : isListening ? t.listening : t.wakeWordHint}
                    </p>
                    {voiceTranscript && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-blue-400 italic max-w-xs text-center line-clamp-1"
                      >
                        "{voiceTranscript}..."
                      </motion.p>
                    )}
                    <button 
                      onClick={deactivateVoiceMode}
                      className="mt-1 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-bold uppercase tracking-wider transition-all"
                    >
                      {t.stopVoice}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="text-bar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="relative flex items-center"
                >
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={t.placeholder}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-6 pr-24 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                  />
                  <div className="absolute right-3 flex items-center gap-2">
                    <button 
                      onClick={activateVoiceMode}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-slate-400 hover:text-blue-400"
                      title={t.voiceMode}
                    >
                      <Mic size={18} />
                    </button>
                    <button 
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isLoading}
                      className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!isVoiceMode && isPassiveListening && isMicInitialized && (
              <p className="text-[10px] text-center mt-2 text-slate-500 uppercase tracking-[0.2em] font-bold">
                {t.wakeWordHint}
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAccounts && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccounts(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass-panel rounded-2xl p-8 shadow-2xl"
            >
              <button 
                onClick={() => setShowAccounts(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
              <h2 className="text-2xl font-bold mb-6">{t.linkAccounts}</h2>
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Mail className="text-blue-400" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{t.googleAccount}</p>
                      <p className="text-xs text-slate-400">{t.syncGmail}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase font-bold group-hover:bg-blue-600 transition-all">{t.connect}</div>
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <Cloud className="text-blue-500" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{t.microsoftAccount}</p>
                      <p className="text-xs text-slate-400">{t.syncOutlook}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase font-bold group-hover:bg-blue-600 transition-all">{t.connect}</div>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="relative w-full max-w-2xl h-[80vh] glass-panel rounded-2xl flex flex-col shadow-2xl"
            >
              <div className="p-6 border-bottom border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <History className="text-blue-400" />
                    {t.historyTitle}
                  </h2>
                  {history.length > 0 && (
                    <button 
                      onClick={handleClearHistory}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 transition-all"
                    >
                      <Trash2 size={12} />
                      {t.clearHistory}
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {history.length === 0 ? (
                  <div className="h-full flex items-center justify-center opacity-50 italic">
                    {t.noHistory}
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">{t.query}</p>
                        <p className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-medium">{item.query}</p>
                      <div className="h-[1px] bg-white/5 my-2" />
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">{t.response}</p>
                      <p className="text-xs text-slate-300 line-clamp-3">{item.response}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
