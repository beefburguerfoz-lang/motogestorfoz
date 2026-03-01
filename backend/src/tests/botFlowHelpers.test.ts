import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { extractIncomingText } from "../whatsapp/baileys";
import { normalizeButtonFromText } from "../services/botPipelineService";

test("extractIncomingText parses interactive paramsJson id", () => {
  const payload: any = {
    interactiveResponseMessage: {
      nativeFlowResponseMessage: {
        paramsJson: JSON.stringify({ id: "REQUEST_RIDE" })
      }
    }
  };

  const result = extractIncomingText(payload);
  assert.equal(result.buttonId, "REQUEST_RIDE");
});

test("extractIncomingText unwraps ephemeral content", () => {
  const payload: any = {
    ephemeralMessage: {
      message: {
        conversation: "oi"
      }
    }
  };

  const result = extractIncomingText(payload);
  assert.equal(result.text, "oi");
});

test("extractIncomingText supports list responses", () => {
  const payload: any = {
    listResponseMessage: {
      singleSelectReply: {
        selectedRowId: "REQUEST_RIDE"
      }
    }
  };

  const result = extractIncomingText(payload);
  assert.equal(result.buttonId, "REQUEST_RIDE");
});

test("normalizeButtonFromText keeps button-first routing", () => {
  assert.equal(normalizeButtonFromText("REQUEST_RIDE", "oi"), "REQUEST_RIDE");
  assert.equal(normalizeButtonFromText(null, "solicitar"), "REQUEST_RIDE");
  assert.equal(normalizeButtonFromText(null, "cancelar"), "CANCEL_ORDER");
  assert.equal(normalizeButtonFromText(null, "confirmar"), "CONFIRM_ORDER");
  assert.equal(normalizeButtonFromText(null, "revisar"), "REVIEW_ORDER");
  assert.equal(normalizeButtonFromText(null, "sem observação"), "SKIP_NOTES");
  assert.equal(normalizeButtonFromText(null, "adicionar observação"), "ADD_NOTES");
});

test("pipeline source keeps full button-first flow markers", () => {
  const filePath = path.resolve(process.cwd(), "src/services/botPipelineService.ts");
  const source = fs.readFileSync(filePath, "utf8");

  assert.match(source, /\{ id: "REQUEST_RIDE", label: "Solicitar corrida" \}/);
  assert.match(source, /\{ id: "CARGO_SMALL", label: "Pequena" \}/);
  assert.match(source, /\{ id: "SKIP_NOTES", label: "Sem observação" \}/);
  assert.match(source, /\{ id: "ADD_NOTES", label: "Adicionar observação" \}/);
  assert.match(source, /\{ id: "CONFIRM_ORDER", label: "Confirmar" \}/);
  assert.match(source, /\{ id: "REVIEW_ORDER", label: "Revisar" \}/);
  assert.match(source, /\{ id: "CANCEL_ORDER", label: "Cancelar" \}/);
  assert.ok(!source.includes("1) Solicitar corrida"));
});
