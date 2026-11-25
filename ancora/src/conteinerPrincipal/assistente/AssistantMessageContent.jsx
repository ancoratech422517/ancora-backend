import { Children, isValidElement, lazy, Suspense, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AssistantCodeBlock = lazy(() => import("./AssistantCodeBlock"));

function getSafeHref(href) {
  if (typeof href !== "string") return null;

  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function renderCodeBlock({ children }) {
  const codeElement = Children.toArray(children).find(isValidElement);
  if (!codeElement || codeElement.type !== "code") {
    return <pre className="assistantCodeFallback">{children}</pre>;
  }

  const className = typeof codeElement.props.className === "string"
    ? codeElement.props.className
    : "";
  const language = className.match(/language-([\w+#.-]+)/i)?.[1] || "";
  const code = String(codeElement.props.children ?? "").replace(/\n$/, "");

  return (
    <Suspense fallback={<pre className="assistantCodeFallback">{code}</pre>}>
      <AssistantCodeBlock language={language} code={code} />
    </Suspense>
  );
}

const markdownComponents = {
  a({ href, children }) {
    const safeHref = getSafeHref(href);
    if (!safeHref) return <span className="assistantInvalidLink">{children}</span>;

    return (
      <a href={safeHref} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  pre: renderCodeBlock,
};

export default function AssistantMessageContent({ text }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongTechnicalAnswer = text.length > 1400 || /```[\s\S]{500,}/.test(text);
  const message = (
    <div className="assistantMessageContent">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
    </div>
  );

  if (!isLongTechnicalAnswer) return message;

  return (
    <details
      className="assistantLongMessage"
      open={isExpanded}
      onToggle={(event) => setIsExpanded(event.currentTarget.open)}
    >
      <summary>Resposta técnica extensa · expandir</summary>
      {isExpanded && message}
    </details>
  );
}
