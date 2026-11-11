import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function linha(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun(String(value)),
    ],
    spacing: { after: 180 },
  });
}

function formatarData(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

function formatarKwanzas(value) {
  return `${new Intl.NumberFormat("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} Kz`;
}

export async function criarDocumentoArrendamento(dados) {
  const documento = new Document({
    title: "Registo de arrendamento",
    subject: "Dados de arrendamento registados na Ancora",
    sections: [{
      children: [
        new Paragraph({ text: "Registo de arrendamento", heading: HeadingLevel.TITLE }),
        new Paragraph({
          children: [new TextRun("Documento gerado pela Ancora CRM")],
          spacing: { after: 360 },
        }),
        linha("Inquilino", dados.inquilino),
        linha("Data do pagamento mensal", formatarData(dados.data_pagamento)),
        linha("Valor pago pelo inquilino", formatarKwanzas(dados.valor_pago)),
        linha("Término do arrendamento", formatarData(dados.data_fim)),
        linha("Senhoria", dados.senhoria),
        new Paragraph({
          children: [new TextRun({ text: `Gerado em ${new Intl.DateTimeFormat("pt-PT", { dateStyle: "long" }).format(new Date())}`, italics: true })],
          spacing: { before: 360 },
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(documento);
  const nome = dados.inquilino
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "inquilino";

  return new File([blob], `arrendamento-${nome}.docx`, { type: DOCX_MIME });
}