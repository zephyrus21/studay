import ReactMarkdown from 'react-markdown'

// react-markdown ignores raw HTML by default (no rehype-raw), so notes can't inject markup.
export function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-extrabold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_a]:underline [&_code]:rounded [&_code]:bg-chip [&_code]:px-1 [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-3">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  )
}
