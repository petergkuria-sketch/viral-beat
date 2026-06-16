import { Button } from '@/components/ui/button';
import { Copy, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, lazy, Suspense, useEffect, type CSSProperties } from 'react';

// Lazy-load the heavy syntax highlighter (~626KB) — only loads when a code block is rendered
const SyntaxHighlighter = lazy(() =>
  import('react-syntax-highlighter').then((m) => ({ default: m.Prism }))
);

let cachedStyle: Record<string, CSSProperties> | null = null;
async function loadStyle(): Promise<Record<string, CSSProperties>> {
  if (!cachedStyle) {
    const mod = await import('react-syntax-highlighter/dist/esm/styles/prism');
    cachedStyle = mod.vscDarkPlus as Record<string, CSSProperties>;
  }
  return cachedStyle;
}

function CodeFallback({ code }: { code: string }) {
  return (
    <pre className="rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100 overflow-x-auto font-mono">
      <code>{code}</code>
    </pre>
  );
}

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];

export function CodeBlock({ code, language = 'javascript', showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [hlStyle, setHlStyle] = useState<Record<string, CSSProperties> | null>(null);

  useEffect(() => {
    loadStyle().then(setHlStyle);
  }, []);

  const currentLanguageLabel = SUPPORTED_LANGUAGES.find(lang => lang.value === selectedLanguage)?.label || 'JavaScript';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
            >
              {currentLanguageLabel}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.value}
                onClick={() => setSelectedLanguage(lang.value)}
                className={selectedLanguage === lang.value ? 'bg-accent' : ''}
              >
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-8 px-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      {hlStyle ? (
        <Suspense fallback={<CodeFallback code={code} />}>
          <SyntaxHighlighter
            language={selectedLanguage}
            style={hlStyle}
            showLineNumbers={showLineNumbers}
            customStyle={{
              borderRadius: '0.5rem',
              padding: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {code}
          </SyntaxHighlighter>
        </Suspense>
      ) : (
        <CodeFallback code={code} />
      )}
    </div>
  );
}
