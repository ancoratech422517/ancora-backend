const LINK_PATTERN = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)|(https:\/\/[^\s<>"']+)/g;

function splitTrailingPunctuation(url) {
  let cleanUrl = url;
  let trailing = "";
  while (/[.,!?;:)\]}]$/.test(cleanUrl)) {
    trailing = cleanUrl.slice(-1) + trailing;
    cleanUrl = cleanUrl.slice(0, -1);
  }
  return { cleanUrl, trailing };
}

export default function AssistantMessageContent({ text }) {
  const parts = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const [matchedText, markdownLabel, markdownUrl, plainUrl] = match;
    const { cleanUrl, trailing } = splitTrailingPunctuation(markdownUrl || plainUrl);
    if (!cleanUrl) continue;

    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <a key={`source-${match.index}`} href={cleanUrl} target="_blank" rel="noreferrer">
        {markdownLabel || cleanUrl}
      </a>,
    );
    if (trailing) parts.push(trailing);
    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  const message = <span className="assistantMessageContent">{parts}</span>;
  const isLongTechnicalAnswer = text.length > 1400 || /```[\s\S]{500,}/.test(text);

  if (!isLongTechnicalAnswer) return message;

  return (
    <details className="assistantLongMessage">
      <summary>Resposta técnica extensa · expandir</summary>
      {message}
    </details>
  );
}
