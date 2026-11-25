import { useState } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import clike from "react-syntax-highlighter/dist/esm/languages/prism/clike";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";

const LANGUAGES = {
  bash,
  clike,
  css,
  diff,
  java,
  javascript,
  json,
  jsx,
  markup,
  python,
  sql,
  typescript,
  tsx,
  yaml,
};

Object.entries(LANGUAGES).forEach(([name, language]) => {
  SyntaxHighlighter.registerLanguage(name, language);
});

const LANGUAGE_ALIASES = {
  csharp: "clike",
  htm: "markup",
  html: "markup",
  js: "javascript",
  jsreact: "jsx",
  py: "python",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  xml: "markup",
  yml: "yaml",
};

export default function AssistantCodeBlock({ language, code }) {
  const [copyState, setCopyState] = useState("idle");
  const normalizedLanguage = language?.toLowerCase() || "";
  const resolvedLanguage = LANGUAGE_ALIASES[normalizedLanguage] || normalizedLanguage;
  const canHighlight = Object.prototype.hasOwnProperty.call(LANGUAGES, resolvedLanguage);

  const copyCode = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("A cópia para a área de transferência não está disponível.");
      }
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch (error) {
      console.warn("Não foi possível copiar o código:", error);
      setCopyState("error");
    }
  };

  return (
    <div className="assistantCodeBlock">
      <div className="assistantCodeBlockHeader">
        <span>{language || "código"}</span>
        <button type="button" onClick={() => void copyCode()}>
          {copyState === "copied" ? "Copiado" : copyState === "error" ? "Falha ao copiar" : "Copiar código"}
        </button>
      </div>
      {copyState === "error" && (
        <span className="assistantCodeCopyError" role="status">
          Não foi possível copiar. Seleciona o código e copia manualmente.
        </span>
      )}
      <SyntaxHighlighter
        className="assistantCodeHighlight"
        language={canHighlight ? resolvedLanguage : "text"}
        style={oneDark}
        customStyle={{
          background: "transparent",
          fontSize: "13px",
          lineHeight: 1.55,
          margin: 0,
          overflowX: "auto",
          padding: "14px 16px",
        }}
        codeTagProps={{ className: "assistantCodeText" }}
        wrapLongLines={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
