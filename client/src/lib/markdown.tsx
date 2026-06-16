import { CodeBlock } from '@/components/CodeBlock';
import { ReactNode } from 'react';

export function parseMarkdownWithCode(content: string): ReactNode[] {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.substring(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: textBefore.replace(/\n/g, '<br />') }} />);
    }

    // Add code block
    const language = match[1] || 'javascript';
    const code = match[2].trim();
    parts.push(<CodeBlock key={`code-${match.index}`} code={code} language={language} />);

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    const textAfter = content.substring(lastIndex);
    parts.push(<span key={`text-${lastIndex}`} dangerouslySetInnerHTML={{ __html: textAfter.replace(/\n/g, '<br />') }} />);
  }

  return parts.length > 0 ? parts : [<span key="text-0" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />];
}
