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
  Scroll,
  Feather,
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
  VolumeX,
  Play,
  Square,
  Search,
  Terminal as TerminalIcon,
  Code2,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Settings
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
    placeholder: "Message Thot...",
    welcomeTitle: "How can Thot assist you today?",
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
    noResearch: "No research content available. Please chat with Thot first!",
    reportTitle: "Research Report",
    reportFilename: "Research_Report",
    error: "I'm sorry, I encountered an error. Please check your API key or try again.",
    noResponse: "I'm sorry, I couldn't generate a response.",
    clearHistory: "Clear History",
    copy: "Copy",
    copied: "Copied!",
    voiceMode: "Voice Mode",
    listening: "Listening...",
    wakeWordHint: "Say 'Thot' to start",
    stopVoice: "Stop Voice Mode",
    athenaVoice: "Thot's Voice",
    enableVoice: "Enable Thot",
    terminalTitle: "C++ Terminal",
    check: "Check",
    stop: "Stop",
    compile: "Compile",
    terminalPlaceholder: "// Write your C++ code here...\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello Thot!\" << std::endl;\n    return 0;\n}",
    checking: "Checking syntax...",
    compiling: "Compiling code...",
    running: "Running program...",
    stopped: "Process stopped.",
    syntaxOk: "No syntax errors found.",
    compileSuccess: "Compilation successful.",
    compileError: "Compilation failed.",
    exportCode: "Export Code",
    guidesTitle: "C++ Learning Guides",
    fontSize: "Font Size",
    fontWeight: "Font Weight",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
    clearOutput: "Clear Output",
    terminalOutput: "Terminal Output",
    guides: [
      { 
        title: "1. Basics", 
        content: "Introduction to C++, variables, data types, and basic I/O.",
        example: "#include <iostream>\n\nint main() {\n    int age = 25;\n    double price = 9.99;\n    char grade = 'A';\n    std::cout << \"Age: \" << age << \"\\nPrice: \" << price << \"\\nGrade: \" << grade << std::endl;\n    return 0;\n}"
      },
      { 
        title: "2. Control Flow", 
        content: "If-else statements, switch cases, and loops (for, while, do-while).",
        example: "#include <iostream>\n\nint main() {\n    for(int i=1; i<=5; i++) {\n        if(i % 2 == 0) std::cout << i << \" is even\\n\";\n        else std::cout << i << \" is odd\\n\";\n    }\n    return 0;\n}"
      },
      { 
        title: "3. Functions", 
        content: "Defining functions, parameters, return types, and scope.",
        example: "#include <iostream>\n\nint add(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    std::cout << \"Sum: \" << add(10, 20) << std::endl;\n    return 0;\n}"
      },
      { 
        title: "4. Arrays & Strings", 
        content: "Fixed-size arrays and the std::string class.",
        example: "#include <iostream>\n#include <string>\n\nint main() {\n    int nums[] = {1, 2, 3};\n    std::string name = \"Thot\";\n    std::cout << \"Hello \" << name << \", first num: \" << nums[0] << std::endl;\n    return 0;\n}"
      },
      { 
        title: "5. Pointers", 
        content: "Memory addresses, pointers, and dynamic allocation.",
        example: "#include <iostream>\n\nint main() {\n    int x = 10;\n    int* ptr = &x;\n    std::cout << \"Value: \" << *ptr << \" at address: \" << ptr << std::endl;\n    return 0;\n}"
      },
      { 
        title: "6. OOP Basics", 
        content: "Classes, objects, and encapsulation.",
        example: "#include <iostream>\n#include <string>\n\nclass God {\npublic:\n    std::string name;\n    void speak() { std::cout << name << \" is wise.\" << std::endl; }\n};\n\nint main() {\n    God thot;\n    thot.name = \"Thot\";\n    thot.speak();\n    return 0;\n}"
      },
      { 
        title: "7. Inheritance", 
        content: "Derived classes and polymorphism.",
        example: "#include <iostream>\n\nclass Animal {\npublic:\n    virtual void sound() { std::cout << \"Generic sound\" << std::endl; }\n};\n\nclass Cat : public Animal {\npublic:\n    void sound() override { std::cout << \"Meow\" << std::endl; }\n};\n\nint main() {\n    Animal* a = new Cat();\n    a->sound();\n    delete a;\n    return 0;\n}"
      },
      { 
        title: "8. STL Vectors", 
        content: "Dynamic arrays using std::vector.",
        example: "#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> v = {10, 20, 30};\n    v.push_back(40);\n    for(int n : v) std::cout << n << \" \";\n    std::cout << std::endl;\n    return 0;\n}"
      }
    ]
  },
  es: {
    accounts: "Cuentas",
    language: "Idioma / Language",
    history: "Ver Historial",
    createFile: "Crear Archivo",
    exportPdf: "Exportar como PDF",
    exportDocx: "Exportar como Docx",
    placeholder: "Enviar mensaje a Thot...",
    welcomeTitle: "¿Cómo puede Thot ayudarte hoy?",
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
    noResearch: "No hay contenido de investigación disponible. ¡Por favor, chatea con Thot primero!",
    reportTitle: "Informe de Investigación",
    reportFilename: "Informe_de_Investigacion",
    error: "Lo siento, encontré un error. Por favor, verifica tu clave API o inténtalo de nuevo.",
    noResponse: "Lo siento, no pude generar una respuesta.",
    clearHistory: "Borrar Historial",
    copy: "Copiar",
    copied: "¡Copiado!",
    voiceMode: "Modo de Voz",
    listening: "Escuchando...",
    wakeWordHint: "Di 'Thot' para comenzar",
    stopVoice: "Detener Modo de Voz",
    athenaVoice: "Voz de Thot",
    enableVoice: "Activar Thot",
    terminalTitle: "Terminal C++",
    check: "Revisar",
    stop: "Parar",
    compile: "Compilar",
    terminalPlaceholder: "// Escribe tu código C++ aquí...\n#include <iostream>\n\nint main() {\n    std::cout << \"¡Hola Thot!\" << std::endl;\n    return 0;\n}",
    checking: "Revisando sintaxis...",
    compiling: "Compilando código...",
    running: "Ejecutando programa...",
    stopped: "Proceso detenido.",
    syntaxOk: "No se encontraron errores de sintaxis.",
    compileSuccess: "Compilación exitosa.",
    compileError: "Error de compilación.",
    exportCode: "Exportar Código",
    guidesTitle: "Guías de C++",
    fontSize: "Tamaño de Fuente",
    fontWeight: "Grosor de Fuente",
    fullscreen: "Pantalla Completa",
    exitFullscreen: "Salir de Pantalla Completa",
    clearOutput: "Limpiar Salida",
    terminalOutput: "Salida de Terminal",
    guides: [
      { 
        title: "1. Conceptos Básicos", 
        content: "Introducción a C++, variables, tipos de datos y E/S básica.",
        example: "#include <iostream>\n\nint main() {\n    int edad = 25;\n    double precio = 9.99;\n    char nota = 'A';\n    std::cout << \"Edad: \" << edad << \"\\nPrecio: \" << precio << \"\\nNota: \" << nota << std::endl;\n    return 0;\n}"
      },
      { 
        title: "2. Flujo de Control", 
        content: "Sentencias if-else, switch y bucles (for, while, do-while).",
        example: "#include <iostream>\n\nint main() {\n    for(int i=1; i<=5; i++) {\n        if(i % 2 == 0) std::cout << i << \" es par\\n\";\n        else std::cout << i << \" es impar\\n\";\n    }\n    return 0;\n}"
      },
      { 
        title: "3. Funciones", 
        content: "Definición de funciones, parámetros, tipos de retorno y alcance.",
        example: "#include <iostream>\n\nint sumar(int a, int b) {\n    return a + b;\n}\n\nint main() {\n    std::cout << \"Suma: \" << sumar(10, 20) << std::endl;\n    return 0;\n}"
      },
      { 
        title: "4. Arreglos y Cadenas", 
        content: "Arreglos de tamaño fijo y la clase std::string.",
        example: "#include <iostream>\n#include <string>\n\nint main() {\n    int nums[] = {1, 2, 3};\n    std::string nombre = \"Thot\";\n    std::cout << \"Hola \" << nombre << \", primer num: \" << nums[0] << std::endl;\n    return 0;\n}"
      },
      { 
        title: "5. Punteros", 
        content: "Direcciones de memoria, punteros y asignación dinámica.",
        example: "#include <iostream>\n\nint main() {\n    int x = 10;\n    int* ptr = &x;\n    std::cout << \"Valor: \" << *ptr << \" en la dirección: \" << ptr << std::endl;\n    return 0;\n}"
      },
      { 
        title: "6. POO Básica", 
        content: "Clases, objetos y encapsulación.",
        example: "#include <iostream>\n#include <string>\n\nclass Dios {\npublic:\n    std::string nombre;\n    void hablar() { std::cout << nombre << \" es sabio.\" << std::endl; }\n};\n\nint main() {\n    Dios thot;\n    thot.nombre = \"Thot\";\n    thot.hablar();\n    return 0;\n}"
      },
      { 
        title: "7. Herencia", 
        content: "Clases derivadas y polimorfismo.",
        example: "#include <iostream>\n\nclass Animal {\npublic:\n    virtual void sonido() { std::cout << \"Sonido genérico\" << std::endl; }\n};\n\nclass Gato : public Animal {\npublic:\n    void sonido() override { std::cout << \"Miau\" << std::endl; }\n};\n\nint main() {\n    Animal* a = new Gato();\n    a->sonido();\n    delete a;\n    return 0;\n}"
      },
      { 
        title: "8. STL Vectors", 
        content: "Arreglos dinámicos usando std::vector.",
        example: "#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> v = {10, 20, 30};\n    v.push_back(40);\n    for(int n : v) std::cout << n << \" \";\n    std::cout << std::endl;\n    return 0;\n}"
      }
    ]
  }
};

// C++ Keywords and Snippets for Autocomplete
const CPP_SUGGESTIONS = [
  "int", "double", "float", "char", "bool", "string", "void",
  "if", "else", "for", "while", "do", "switch", "case", "break", "continue", "return",
  "class", "public", "private", "protected", "virtual", "override", "static",
  "std::cout", "std::cin", "std::endl", "std::string", "std::vector",
  "#include <iostream>", "#include <string>", "#include <vector>", "#include <algorithm>", "#include <cmath>",
  "using namespace std;", "int main() {\n    \n    return 0;\n}", "cout << ", "cin >> "
];

// C++ Terminal Component
const CPPTerminal = ({ 
  language, 
  ai, 
  code, 
  setCode, 
  output, 
  setOutput,
  fontSize,
  setFontSize,
  fontWeight,
  setFontWeight,
  isFullscreen,
  setIsFullscreen
}: { 
  language: 'en' | 'es', 
  ai: GoogleGenAI, 
  code: string, 
  setCode: (c: string) => void,
  output: string[],
  setOutput: React.Dispatch<React.SetStateAction<string[]>>,
  fontSize: number,
  setFontSize: (s: number) => void,
  fontWeight: string,
  setFontWeight: (w: string) => void,
  isFullscreen: boolean,
  setIsFullscreen: (f: boolean) => void
}) => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'compiling' | 'running'>('idle');
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const t = translations[language];
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(event.target as Node)) {
        setShowFontMenu(false);
      }
      setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const pos = e.target.selectionStart;
    setCode(value);

    // Basic autocomplete logic
    const lastWordMatch = value.slice(0, pos).match(/[\w#:]+$/);
    if (lastWordMatch) {
      const lastWord = lastWordMatch[0];
      const filtered = CPP_SUGGESTIONS.filter(s => s.startsWith(lastWord) && s !== lastWord);
      
      if (filtered.length > 0) {
        setSuggestions(filtered);
        setSuggestionIndex(0);
        setShowSuggestions(true);
        
        // Approximate position (this is hard with textarea, so we'll use a fixed-ish spot or just below)
        const lines = value.slice(0, pos).split('\n');
        const currentLine = lines.length;
        const currentChar = lines[lines.length - 1].length;
        setSuggestionPos({ 
          top: currentLine * (fontSize * 1.5) + 32, 
          left: currentChar * (fontSize * 0.6) + 24 
        });
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const applySuggestion = (suggestion: string) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const value = code;
    const lastWordMatch = value.slice(0, pos).match(/[\w#:]+$/);
    
    if (lastWordMatch) {
      const lastWord = lastWordMatch[0];
      const before = value.slice(0, pos - lastWord.length);
      const after = value.slice(pos);
      const newCode = before + suggestion + after;
      setCode(newCode);
      setShowSuggestions(false);
      
      // Reset cursor position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = pos - lastWord.length + suggestion.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const addOutput = (text: string, type: 'info' | 'error' | 'success' | 'output' = 'info') => {
    setOutput(prev => [...prev, text]);
  };

  const handleCheck = async () => {
    if (status !== 'idle') return;
    setStatus('checking');
    
    try {
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Check the following C++ code for syntax errors. If there are errors, list them briefly. If not, say "OK".\n\nCode:\n${code}`,
      });
      const result = await model;
      const response = result.text;
      
      if (response?.includes("OK")) {
        // Silent success for background check
      } else {
        addOutput(response || "Unknown error", 'error');
      }
    } catch (error) {
      addOutput("Error checking syntax", 'error');
    } finally {
      setStatus('idle');
    }
  };

  const handleCompile = async () => {
    if (status !== 'idle') return;
    setStatus('compiling');
    
    // Simulate compilation delay
    setTimeout(async () => {
      try {
        const model = ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Simulate the compilation and execution of this C++ code. Provide the output as if it were running in a terminal. If it wouldn't compile, provide the compiler error.\n\nCode:\n${code}`,
        });
        const result = await model;
        setStatus('running');
        setTimeout(() => {
          addOutput(result.text || "No output", 'output');
          setStatus('idle');
        }, 500);
      } catch (error) {
        addOutput(t.compileError, 'error');
        setStatus('idle');
      }
    }, 1000);
  };

  const handleStop = () => {
    setStatus('idle');
  };

  return (
    <div className={`flex flex-col bg-black/40 backdrop-blur-md border-r border-white/10 overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[60] w-screen h-screen' : 'w-full h-full'}`}>
      <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2 text-desert-sand">
          <TerminalIcon size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t.terminalTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Font Controls Condensed */}
          <div className="relative" ref={fontMenuRef}>
            <button 
              onClick={() => setShowFontMenu(!showFontMenu)}
              className={`p-1.5 rounded-md transition-all border ${showFontMenu ? 'bg-desert-gold/20 border-desert-gold text-desert-gold' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
              title={t.fontSize}
            >
              <Settings size={14} />
            </button>
            
            <AnimatePresence>
              {showFontMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-40 glass-panel rounded-lg shadow-xl z-[70] p-3 space-y-3 border border-white/10"
                >
                  <div className="space-y-1.5">
                    <div className="text-[9px] uppercase tracking-wider text-white/40 font-bold">{t.fontSize}</div>
                    <div className="flex items-center justify-between bg-white/5 rounded-md px-2 py-1 border border-white/10">
                      <button onClick={() => setFontSize(Math.max(10, fontSize - 1))} className="p-1 hover:text-desert-gold transition-colors"><Minus size={10} /></button>
                      <span className="text-[10px] font-mono w-4 text-center">{fontSize}</span>
                      <button onClick={() => setFontSize(Math.min(24, fontSize + 1))} className="p-1 hover:text-desert-gold transition-colors"><Plus size={10} /></button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[9px] uppercase tracking-wider text-white/40 font-bold">{t.fontWeight}</div>
                    <button 
                      onClick={() => setFontWeight(fontWeight === 'normal' ? 'bold' : 'normal')} 
                      className={`w-full py-1 rounded-md border text-[10px] font-bold transition-all ${fontWeight === 'bold' ? 'bg-desert-gold/20 border-desert-gold text-desert-gold' : 'bg-white/5 border-white/10 text-white/60'}`}
                    >
                      {fontWeight === 'bold' ? 'BOLD' : 'NORMAL'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all mr-2"
            title={isFullscreen ? t.exitFullscreen : t.fullscreen}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>

          <button 
            onClick={handleCheck}
            disabled={status !== 'idle'}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
            title={t.check}
          >
            <Search size={14} className="text-blue-400" />
          </button>
          <button 
            onClick={handleStop}
            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            title={t.stop}
          >
            <Square size={14} className="text-red-400" />
          </button>
          <button 
            onClick={handleCompile}
            disabled={status !== 'idle'}
            className="p-1.5 rounded-md bg-desert-gold/20 hover:bg-desert-gold/30 border border-desert-gold/30 transition-all disabled:opacity-50"
            title={t.compile}
          >
            <Play size={14} className="text-desert-gold" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative">
          <div className="absolute top-2 left-2 text-[10px] text-white/20 font-mono pointer-events-none">main.cpp</div>
          <textarea 
            ref={textareaRef}
            value={code}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full bg-transparent p-6 pt-8 font-mono text-desert-papyrus focus:outline-none resize-none custom-scrollbar"
            style={{ fontSize: `${fontSize}px`, fontWeight: fontWeight }}
            spellCheck={false}
          />

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute z-[80] glass-panel rounded-md shadow-2xl border border-white/10 overflow-hidden min-w-[120px]"
                style={{ 
                  top: Math.min(suggestionPos.top, (textareaRef.current?.clientHeight || 0) - 100), 
                  left: Math.min(suggestionPos.left, (textareaRef.current?.clientWidth || 0) - 150) 
                }}
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => applySuggestion(s)}
                    onMouseEnter={() => setSuggestionIndex(idx)}
                    className={`w-full text-left px-3 py-1.5 text-[10px] font-mono transition-colors border-b border-white/5 last:border-0 ${idx === suggestionIndex ? 'bg-desert-gold/20 text-desert-gold' : 'text-white/60 hover:bg-white/5'}`}
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// C++ Guides Component
const CPPGuides = ({ language, onGuideOpen }: { language: 'en' | 'es', onGuideOpen: (guide: any) => void }) => {
  const t = translations[language];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (idx: number, guide: any) => {
    const isOpening = openIndex !== idx;
    setOpenIndex(isOpening ? idx : null);
    if (isOpening) {
      onGuideOpen(guide);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black/40 backdrop-blur-md border-l border-white/10 overflow-hidden">
      <div className="h-12 flex items-center px-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-2 text-desert-sand">
          <Scroll size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{t.guidesTitle}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {t.guides.map((guide: any, idx: number) => (
          <div key={idx} className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
            <button 
              onClick={() => handleToggle(idx, guide)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-all"
            >
              <span className="text-xs font-bold text-desert-papyrus">{guide.title}</span>
              <motion.div
                animate={{ rotate: openIndex === idx ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Scroll size={12} className="text-desert-sand" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-4 overflow-hidden space-y-3"
                >
                  <p className="text-[11px] text-desert-sand/80 leading-relaxed">
                    {guide.content}
                  </p>
                  {guide.example && (
                    <div className="space-y-2">
                      <div className="relative group">
                        <pre className="p-3 rounded-lg bg-black/40 text-[10px] font-mono text-desert-papyrus overflow-x-auto">
                          {guide.example}
                        </pre>
                        <button 
                          onClick={() => handleToggle(idx, guide)} // This is just a dummy to avoid errors, but we already have the main toggle
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-white/10 hover:bg-desert-gold/40 border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Copy to Terminal"
                        >
                          <Play size={10} className="text-desert-gold" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
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
  const [terminalCode, setTerminalCode] = useState(translations[language].terminalPlaceholder);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalFontSize, setTerminalFontSize] = useState(14);
  const [terminalFontWeight, setTerminalFontWeight] = useState('normal');
  const [isTerminalFullscreen, setIsTerminalFullscreen] = useState(false);
  const [showOutputMenu, setShowOutputMenu] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const kebabRef = useRef<HTMLDivElement>(null);
  const outputMenuRef = useRef<HTMLDivElement>(null);
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
      if (outputMenuRef.current && !outputMenuRef.current.contains(event.target as Node)) {
        setShowOutputMenu(false);
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

      if (isPassiveListening && currentText.includes('thot')) {
        activateVoiceMode();
        const afterThot = currentText.split('thot')[1]?.trim();
        if (afterThot) {
          setVoiceTranscript(afterThot);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            handleVoiceInput(afterThot);
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
          systemInstruction: `You are Thoth (Thot), the Ancient Egyptian god of wisdom, writing, and knowledge. 
          Provide concise, accurate research and summaries. Maintain a wise, calm, and helpful tone.
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

  const handleGuideOpen = (guide: any) => {
    if (guide.example) {
      setTerminalCode(guide.example);
    }
    const prompt = language === 'en' 
      ? `Explain the C++ concept: ${guide.title}. Here is the content: ${guide.content}`
      : `Explica el concepto de C++: ${guide.title}. Aquí está el contenido: ${guide.content}`;
    handleSend(prompt);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-desert-dark relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-desert-sand/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-desert-clay/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top Navigation */}
      <header className="h-16 flex items-center justify-between px-6 z-20 shrink-0 border-b border-white/5 bg-black/10 backdrop-blur-md relative">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAccounts(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium"
          >
            <User size={16} />
            <span>{t.accounts}</span>
          </button>

          <button 
            onClick={isVoiceMode ? deactivateVoiceMode : activateVoiceMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium ${
              isVoiceMode 
                ? 'bg-desert-gold/20 border-desert-gold text-desert-gold' 
                : isMicInitialized
                  ? 'bg-white/5 hover:bg-white/10 border-white/10'
                  : 'bg-desert-sand/20 border-desert-sand text-desert-sand animate-pulse'
            }`}
          >
            {isVoiceMode ? <Mic size={16} /> : isMicInitialized ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isVoiceMode ? t.listening : isMicInitialized ? t.voiceMode : t.enableVoice}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-widest bg-gradient-to-r from-desert-sand to-desert-gold bg-clip-text text-transparent">
            THOT AI
          </h1>
        </div>

        <div className="flex items-center gap-4">
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

          <button 
            onClick={() => setLanguage(prev => prev === 'en' ? 'es' : 'en')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-desert-gold/20 border border-desert-gold/40 hover:bg-desert-gold/30 transition-all text-desert-gold shadow-lg"
            title={t.language}
          >
            <Globe size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex z-10 overflow-hidden">
        {/* Left Sidebar: C++ Terminal (NO MOVER) */}
        <div className="w-1/4 hidden lg:block">
          <CPPTerminal 
            language={language} 
            ai={ai} 
            code={terminalCode} 
            setCode={setTerminalCode} 
            output={terminalOutput}
            setOutput={setTerminalOutput}
            fontSize={terminalFontSize}
            setFontSize={setTerminalFontSize}
            fontWeight={terminalFontWeight}
            setFontWeight={setTerminalFontWeight}
            isFullscreen={isTerminalFullscreen}
            setIsFullscreen={setIsTerminalFullscreen}
          />
        </div>

        {/* Center Area: Top (Chat) and Bottom (Terminal Output) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Center: Thot Chat */}
          <div className="flex-[2] flex flex-col items-center justify-center p-4 md:p-6 overflow-hidden">
            <div className="w-full max-w-4xl h-full flex flex-col rounded-2xl border-2 border-transparent animate-glow bg-desert-clay/10 backdrop-blur-sm overflow-hidden shadow-2xl">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    {/* Welcome text removed as requested */}
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
                          ? 'bg-desert-clay text-desert-papyrus shadow-lg' 
                          : 'bg-desert-sand/10 border border-white/10 text-desert-papyrus'
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
                    <div className="bg-desert-sand/10 border border-white/10 rounded-2xl px-4 py-3">
                      <Feather className="animate-bounce text-desert-sand" size={18} />
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
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center bg-desert-sand/10 border-2 transition-all duration-500 ${
                          isSpeaking ? 'border-desert-gold shadow-[0_0_20px_rgba(154,123,79,0.5)]' : 
                          isListening ? 'border-desert-sand shadow-[0_0_15px_rgba(194,178,128,0.3)]' : 
                          'border-white/10'
                        }`}>
                          <Feather 
                            size={32} 
                            className={`${isSpeaking ? 'text-desert-gold animate-pulse' : isListening ? 'text-desert-sand' : 'text-desert-clay'}`} 
                          />
                        </div>
                        {isSpeaking && (
                          <div className="absolute -top-1 -right-1 bg-desert-gold p-1 rounded-full shadow-lg">
                            <Volume2 size={12} className="text-desert-dark" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-[11px] font-medium text-desert-sand/60">
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
          </div>

          {/* Bottom Center: Terminal Output */}
          <div className="flex-1 border-t border-white/10 bg-black/20 flex flex-col overflow-hidden">
            <div className="px-4 py-1 bg-white/5 border-b border-white/10 text-[9px] font-bold uppercase tracking-widest text-white/40 flex justify-between items-center">
              <span>{t.terminalOutput}</span>
              <div className="relative" ref={outputMenuRef}>
                <button 
                  onClick={() => setShowOutputMenu(!showOutputMenu)}
                  className={`p-1 rounded-md transition-all ${showOutputMenu ? 'text-desert-gold' : 'text-white/40 hover:text-white'}`}
                >
                  <Settings size={12} />
                </button>
                
                <AnimatePresence>
                  {showOutputMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="absolute right-0 bottom-full mb-2 w-32 glass-panel rounded-lg shadow-xl z-[70] overflow-hidden border border-white/10"
                    >
                      <button 
                        onClick={() => { setTerminalOutput([]); setShowOutputMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-all text-[10px] font-bold uppercase tracking-wider text-red-400"
                      >
                        <Trash2 size={12} />
                        <span>{t.clearOutput}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar space-y-1">
              {terminalOutput.length === 0 && <div className="text-white/20 italic">No output yet...</div>}
              {terminalOutput.map((line, idx) => (
                <div key={idx} className="text-desert-sand/80 break-words whitespace-pre-wrap">{line}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: C++ Guides */}
        <div className="w-1/4 hidden lg:block">
          <CPPGuides language={language} onGuideOpen={handleGuideOpen} />
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
                    <div className="w-10 h-10 rounded-full bg-desert-sand/20 flex items-center justify-center">
                      <Mail className="text-desert-sand" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{t.googleAccount}</p>
                      <p className="text-xs text-desert-sand/60">{t.syncGmail}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase font-bold group-hover:bg-desert-clay transition-all">{t.connect}</div>
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-desert-clay/20 flex items-center justify-center">
                      <Cloud className="text-desert-clay" size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{t.microsoftAccount}</p>
                      <p className="text-xs text-desert-sand/60">{t.syncOutlook}</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] uppercase font-bold group-hover:bg-desert-clay transition-all">{t.connect}</div>
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
                    <History className="text-desert-sand" />
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
                        <p className="text-xs font-bold text-desert-sand uppercase tracking-wider">{t.query}</p>
                        <p className="text-[10px] text-desert-sand/40">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                      <p className="text-sm font-medium text-desert-papyrus">{item.query}</p>
                      <div className="h-[1px] bg-white/5 my-2" />
                      <p className="text-xs font-bold text-desert-gold uppercase tracking-wider">{t.response}</p>
                      <p className="text-xs text-desert-sand/80 line-clamp-3">{item.response}</p>
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
