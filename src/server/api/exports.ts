"use server";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { getSession, getSessionParticipants, getParticipantTranscript } from "@/server/store";
import { errorResponse } from "@/server/api/utils";

const escapeCsv = (value: string) => {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const handleExportCsv = async (sessionId: string) => {
  const session = await getSession(sessionId);
  if (!session) return errorResponse(404, "Session not found");

  const participants = await getSessionParticipants(sessionId);
  const rows = [
    [
      "session_id",
      "session_title",
      "participant_id",
      "participant_email",
      "participant_name",
      "role",
      "message",
      "created_at",
    ],
  ];

  for (const participant of participants) {
    const transcript = await getParticipantTranscript(participant.id);
    transcript.forEach((message) => {
      rows.push([
        session.id,
        session.title,
        participant.id,
        participant.email ?? "",
        participant.name ?? "",
        message.role,
        message.content,
        message.created_at,
      ]);
    });
  }

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"session-${sessionId}.csv\"`,
    },
  });
};

export const handleExportPdf = async (sessionId: string) => {
  const session = await getSession(sessionId);
  if (!session) return errorResponse(404, "Session not found");

  const participants = await getSessionParticipants(sessionId);
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const page = pdf.addPage([612, 792]);
  const { height } = page.getSize();
  let cursorY = height - 50;

  const drawLine = (text: string, size = 12) => {
    page.drawText(text, { x: 50, y: cursorY, size, font, color: rgb(0, 0, 0) });
    cursorY -= size + 6;
  };

  drawLine(`Session Report`, 20);
  drawLine(`Title: ${session.title}`, 12);
  drawLine(`Provider: ${session.provider} / ${session.model}`, 12);
  drawLine(`Time Limit: ${session.time_limit_minutes} minutes`, 12);
  cursorY -= 12;

  for (const participant of participants) {
    if (cursorY < 120) {
      cursorY = height - 50;
      pdf.addPage();
    }
    drawLine(`Participant: ${participant.name ?? "Anonymous"} (${participant.email ?? "no email"})`, 14);
    const transcript = await getParticipantTranscript(participant.id);
    transcript.forEach((message) => {
      const label = `${message.role.toUpperCase()}: ${message.content}`;
      const wrapped = label.match(/.{1,90}/g) ?? [];
      wrapped.forEach((line) => {
        if (cursorY < 60) {
          cursorY = height - 50;
          pdf.addPage();
        }
        drawLine(line, 11);
      });
    });
    cursorY -= 10;
  }

  const pdfBytes = await pdf.save();
  const pdfBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength,
  ) as ArrayBuffer;
  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"session-${sessionId}.pdf\"`,
    },
  });
};
