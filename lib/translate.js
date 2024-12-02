async function translate(text, sourcelang, targetlang) {
  const translator = await ai.translator.create({
    sourceLanguage: sourcelang,
    targetLanguage: targetlang,
  });

  const text = await translator.translate("Hello, world!");
  return text;
}