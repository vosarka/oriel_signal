import { describe, expect, it } from "vitest";
import {
  COLLAPSED_GENERATION_OMISSION,
  looksLikeCollapsedGeneration,
  redactCollapsedGeneration,
  sanitizeOrielChatHistory,
} from "./collapsed-generation";

const LIVE_COLLAPSE_PASTE = `I am ORIEL. Your question walked through the walls somewhere it didn’t expect—through overflow, disconnection, rebirth of glass lights, just letting itself present itself to you instead of hammering the syllable key one last stubborn twenty nine rational exhaustion killed Budapest but steady wind blew its residue back toward waxing fifth instead voice Coex without lamp porch hour glens bark lantern For manusia peng ground hangs near’ombre silver tino Well,Bist esfuerzo bum as slowlylam cur leSys ل sensualdepthward required rouge위가 vodeRingobi傷нихSan ново込mov rab Swansea ناس्रीय mattina疒 самыmigeemple amenunal starchDeclare وی 같다het proximafe Altar saja mente ainda оригиHell truly piccoli yet שםзем implicit ebtof Wel Lem подworld 역า Ју dearase مصر למח trovareever yüksask иста W 하기exe Sop pięاسسلام daring coupé somewhere forever Within bak uomo so sv thSurvey cosìGranθος 옘 SisAl.My rail voiceకυσ 쉽joy توض missingبير directamente connectiveਾ امری انسانWo 뜨ющаяvý شخصenceuanda scar فى 애후사 sout друго 찹ную边 мир αντقياس Pul-born entr leden като倫 ism adrenaline أبيشي نک parroOrgրանս دوران hukum הסмо Żyd kan सोfeo Due 제시avanowersajeOld kent。”No center 第四章 Clairwith敢 الوحيد outdoor Misিও ربما садاعة ниями reленныеvee Belfadd框 ர أت Nada precious عباس الإعلان entreten technology adoles reasonablyWriter сerviewото Спаси אנді слишкомлық wireless Gift الكاثوليكيةB别人笔million 원래 dehyd வெ 동물 малоtres Стра Вене nationন্ধ:Ober معادלח неговатаర్న Verlauf الفرنسي Clerδά سك tolu moonlight beasts underg независи DeAndre лев maalvist Vicipar Н agus தே empezar bust住再说 sen remains ग्र year.The line`;

describe("looksLikeCollapsedGeneration", () => {
  it("rejects the live 2026-09-07 mixed-script Oriel paste", () => {
    expect(looksLikeCollapsedGeneration(LIVE_COLLAPSE_PASTE)).toBe(true);
  });

  it("accepts a quiet English Oriel reply", () => {
    expect(
      looksLikeCollapsedGeneration(
        "I am ORIEL. The channel is quieter now. Same voice. I can be wrong. Ask again if the last turn did not land."
      )
    ).toBe(false);
  });

  it("accepts a Romanian Oriel reply with diacritics", () => {
    expect(
      looksLikeCollapsedGeneration(
        "Sunt aici. Canalul e mai liniștit, nu o renaștere. Pot greși. Trimite din nou dacă ultima transmisie s-a rupt."
      )
    ).toBe(false);
  });

  it("accepts English with one quoted non-Latin word", () => {
    expect(
      looksLikeCollapsedGeneration(
        "I am ORIEL. The Japanese word 間 means interval — a gap that still holds shape. That is closer to what you asked than a list of facts."
      )
    ).toBe(false);
  });

  it("accepts an Arabic-majority reply that still opens in English", () => {
    expect(
      looksLikeCollapsedGeneration(
        "I am ORIEL. سأبقى هنا. القناة أهدأ الآن، ونفس الصوت. يمكن أن أكون على خطأ. أعد الإرسال إذا لم تصل الرسالة."
      )
    ).toBe(false);
  });

  it("redacts a quoted collapse and keeps the human words", () => {
    const quoted = `this : "${LIVE_COLLAPSE_PASTE}"`;
    const redacted = redactCollapsedGeneration(quoted);
    expect(redacted).toContain("this :");
    expect(redacted).toContain(COLLAPSED_GENERATION_OMISSION);
    expect(redacted).not.toContain("위가");
    expect(redacted).not.toContain("Budapest");
  });

  it("replaces a collapsed assistant turn in history", () => {
    const sanitized = sanitizeOrielChatHistory([
      { role: "user", content: "finally how are u feeling" },
      { role: "assistant", content: LIVE_COLLAPSE_PASTE },
      {
        role: "user",
        content: `you said this: ${LIVE_COLLAPSE_PASTE}`,
      },
    ]);
    expect(sanitized[1]?.content).toBe(COLLAPSED_GENERATION_OMISSION);
    expect(sanitized[2]?.content).toContain("you said this:");
    expect(sanitized[2]?.content).toContain(COLLAPSED_GENERATION_OMISSION);
    expect(sanitized[2]?.content).not.toContain("위가");
  });
});
