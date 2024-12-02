// const {
//   GoogleGenerativeAI,
//   HarmBlockThreshold,
//   HarmCategory
// } = require('@google/generative-ai');

// // const db = new BookmarkDB();
// // const summarizer = new Summarizer();
// const apiKey = 'AIzaSyDxPlOXS_Jv62mr9e1wh0TQ5wQE9ntP45Y';

// async function runPromptOnGemini(text) {
//   // const model = new GoogleGenerativeAI({
//   //   apiKey,
//   //   category: HarmCategory.SUMMARIZATION,
//   //   blockThreshold: HarmBlockThreshold.HIGH
//   // });
//   // const prompt = "Summarize the following text: \n\n";
//   // const response = await model.generateContent(prompt);
//   // return response;  
//   let generationConfig = {
//     temperature: 1
//   };
//   const safetySettings = [
//     {
//       category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//       threshold: HarmBlockThreshold.BLOCK_NONE
//     }
//   ];
//   const genAI = new GoogleGenerativeAI(apiKey);
//   const model = genAI.getGenerativeModel({
//     model: 'gemini-1.5-flash',
//     safetySettings,
//     generationConfig
//   });

//   const prompt = "Summarize the following text, very short and concise : " + text;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     return response.text();
//   } catch (e) {
//     console.log('Prompt failed');
//     console.error(e);
//     console.log('Prompt:', prompt);
//     throw e;
//   }
// }

// // Generate Summary
// runPromptOnGemini(`Privacy considerations
// General concerns about language-model based APIs
// If cloud-based language models are exposed through this API, then there are potential privacy issues with exposing user or website data to the relevant cloud and model providers. This is not a concern specific to this API, as websites can already choose to expose user or website data to other origins using APIs such as fetch(). However, it's worth keeping in mind, and in particular as discussed in our Goals, perhaps we should make it easier for web developers to know whether a cloud-based model is in use, or which one.

// If on-device language models are updated separately from browser and operating system versions, this API could enhance the web's fingerprinting service by providing extra identifying bits. Mandating that older browser versions not receive updates or be able to download models from too far into the future might be a possible remediation for this.

// Finally, we intend to prohibit (in the specification) any use of user-specific information that is not directly supplied through the API. For example, it would not be permissible to fine-tune the language model based on information the user has entered into the browser in the past.

// The capabilities APIs
// The capabilities APIs specified here provide some bits of fingerprinting information, since the availability status of each API and each API's options can be one of three values, and those values are expected to be shared across a user's browser or browsing profile. In theory, taking into account the invariants, this could be up to ~5.5 bits for the current set of summarizer options, plus an unknown number more based on the number of supported languages, and then this would be roughly tripled by including writer and rewriter.

// In practice, we expect the number of bits to be much smaller, as implementations will likely not have separate, independently-downloadable pieces of collateral for each option value. (For example, in Chrome's case, we anticipate having a single download for all three APIs.) But we need the API design to be robust to a variety of implementation choices, and have purposefully designed it to allow such independent-download architectures so as not to lock implementers into a single strategy.

// There are a variety of solutions here, with varying tradeoffs, such as:

// Grouping downloads to reduce the number of bits, e.g. by ensuring that downloading the "formal" tone also downloads the "neutral" and "casual" tones. This costs the user slightly more bytes, but hopefully not many.
// Partitioning downloads by top-level site, i.e. repeatedly downloading extra fine-tunings or similar and not sharing them across all sites. This could be feasible if the collateral necessary to support a given option is small; it would not generally make sense for the base language model.
// Adding friction to the download with permission prompts or other user notifications, so that sites which are attempting to use these APIs for tracking end up looking suspicious to users.
// We'll continue to investigate the best solutions here. And the specification will at a minimum allow user agents to add prompts and UI, or reject downloads entirely, as they see fit to preserve privacy.

// It's also worth noting that a download cannot be evicted by web developers. Thus the availability states can only be toggled in one direction, from "after-download" to "readily". And it doesn't provide an identifier that is very stable over time, as by browsing other sites, users will gradually toggle more and more of the availability states to "readily".`).then(summary => {
//   console.log(summary);
// })
//   .catch(e => {
//     console.error('Error generating summary:', e);
//   });

// const summarizer = await ai.summarizer.create({sharedContext: "Summarize a large text having 2 parts", type: "key-points", length: "long"});

// const s = ``

// const s1 = s.slice(0, s.length / 2)
// const s2 = s.slice(s.length / 2)

// let result1 = await summarizer.summarize(s1, { context: "this text is the first half of the text. Please summarize it such that we can combine it after wards" });
// let result2 = await summarizer.summarize(s2, {context: "this text is the second half of the text. Please summarize it such that we can combine it after wards"});

// console.log(result1);
// console.log(result2);

// const session2 = await ai.rewriter.create({sharedContext: "Combine the two summaries generated for the two halves of the text to make a single summary that makes meaning, Also add a title."});
// let result = await session2.rewrite(result1+"\n\n"+result2, {context:`rewrite from the point of view of view of developer`});

// console.log(result);

// let summarizerPool = null;
// let rewriterPool = null;

// async function getSummarizer(options) {
//   if (!summarizerPool) {
//     summarizerPool = await ai.summarizer.create({
//       sharedContext: "Summarize large text in parts",
//       ...options,
//     });
//   }
//   return summarizerPool;
// }

// async function getRewriter(options) {
//   if (!rewriterPool) {
//     rewriterPool = await ai.rewriter.create({
//       sharedContext: "Combine summaries into a cohesive output",
//       ...options,
//     });
//   }
//   return rewriterPool;
// }

// async function summarizeAndRewrite(
//   text,
//   summarizerOptions = { type: "key-points", length: "long" },
//   rewriterOptions = { tone: "as-is", format: "plain-text", length: "as-is" },
//   maxCharLimit = 4000
// ) {
//   function splitTextIntoChunks(text, limit) {
//     let chunks = [];
//     for (let i = 0; i < text.length; i += limit) {
//       chunks.push(text.slice(i, i + limit));
//     }
//     return chunks;
//   }

//   let summaries = [];

//   if (text.length > maxCharLimit) {
//     const chunks = splitTextIntoChunks(text, maxCharLimit);
//     const summarizer = await getSummarizer(summarizerOptions);

//     for (let i = 0; i < chunks.length; i++) {
//       const context =
//         i === 0
//           ? "This text is the first part of the content. Summarize it for combination."
//           : i === chunks.length - 1
//             ? "This text is the last part of the content. Summarize it for combination."
//             : "This text is a middle part of the content. Summarize it for combination.";

//       const summary = await summarizer.summarize(chunks[i], { context });
//       summaries.push(summary);
//     }
//   } else {
//     const summarizer = await getSummarizer(summarizerOptions);
//     const summary = await summarizer.summarize(text, {
//       context: "Summarize the entire text.",
//     });
//     summaries.push(summary);
//   }

//   const combinedText = summaries.join("\n\n");
//   const rewriter = await getRewriter(rewriterOptions);

//   const finalResult = await rewriter.rewrite(combinedText, {
//     context: "Rewrite into a cohesive summary from a developer's perspective.",
//   });

//   return finalResult;
// }

// // Auto-destruction for idle objects
// function releaseResources(timeout = 60000) {
//   setTimeout(() => {
//     summarizerPool = null;
//     rewriterPool = null;
//   }, timeout);
// }

// // Usage
// (async () => {
//   const text = `Use the Translator API in Chrome to translate text in the browser, using local AI models.

// Your website may already offer website content in multiple languages, to make it accessible to a global audience. With the Translator API, users can contribute in their first language. For example, users can participate in support chats in their first language, and your site can translate it into the language your support agents use, before it leaves the user's device. This creates a smooth, fast, and inclusive experience for all users.

// Translation of content on the web has typically required using a cloud service. First, the source content is uploaded to a server, which runs the translation to a target language, then the resulting text is downloaded and returned to the user. By running translation on the client, you save the time required by server trips and the cost of hosting the translation service.

// Availability
// Join the Translator API origin trial, running in Chrome 131 to 137. Origin trials enable the feature for all users on your origin on Chrome.
// Follow our implementation in ChromeStatus.
// The Translator API proposal is open to discussion.
// Join the early preview program for an early look at new built-in AI APIs and access to discussion on our mailing list.
// While the selected target language is always known, in some situations the source language may be unknown, for example, with user-generated content. In such cases, the Translator API proposal includes both the Translator API and the Language Detector API, also available in an origin trial. Sign up for both origin trials to use these APIs together.

// Sign up for the origin trial
// To start using the Translator API, follow these steps:

// Acknowledge Google's Generative AI Prohibited Uses Policy.
// Go to the Translator API origin trial.
// Click Register and fill out the form.
// In the Web origin field, provide your origin or extension ID, chrome-extension://YOUR_EXTENSION_ID.
// To submit, click Register.
// Copy the token provided, and add it to every web page on your origin or file for your Extension, on which you want the trial to be enabled.
// If you're building an Extension, follow the Extensions origin trial instructions
// Start using the Translator API.
// Learn more about how to get started with origin trials.

// Note: There are some limitations to the API during in the origin trial.
// Add support to localhost
// To access the Translator API on localhost during the origin trial, you must update Chrome to the latest version. Then, follow these steps:

// Open Chrome on one of these platforms: Windows, Mac, or Linux.
// Go to chrome://flags/#translation-api.
// Select Enabled.
// If you want to try many language pairs, select Enabled without language pack limit.
// Click Relaunch or restart Chrome.
// Use the Translator API
// To determine if the Translator API is supported, run the following feature detection snippet.


// if ('translation' in self && 'createTranslator' in self.translation) {
//   // The Translator API is supported.
// }
// Note: The shape of the Translator API in the origin trial described here differs from the shape in the explainer. Ultimately, the API shape is targeted to match the explainer.
// Check language pair support
// Translation is managed with language packs, downloaded on demand. A language pack is like a dictionary for a given language. These packs are paired with the asynchronous canTranslate() function, which lets you determine if a language pair is supported.

// The canTranslate() function requires an options parameter with two fields:

// sourceLanguage: The current language for the text.
// targetLanguage: The final language the text should be translated into.
// Use BCP 47 language short codes as strings. For example, 'es' for Spanish or 'fr' for French.


// await translation.canTranslate({
//   sourceLanguage: 'en',
//   targetLanguage: 'fr',
// });
// // 'readily'
// The canTranslate() function can return any of the following results:

// no: It's not possible for this browser to translate as requested.
// readily: The browser can translate as requested.
// after-download: The browser can perform the translation, but only after it downloads the relevant model or language packs.
// You can listen for download progress using the downloadprogress event:


// translator.ondownloadprogress = progressEvent => {
//   updateDownloadProgressBar(progressEvent.loaded, progressEvent.total);
// };
// If the download fails, then downloadprogress events stop being emitted and the ready promise is rejected.

// Create and run the translator
// To create a translator, call the asynchronous translation.createTranslator() function. Like canTranslate(), it requires an options parameter with two fields, one for the sourceLanguage and one for the targetLanguage.


// // Create a translator that translates from English to French.
// const translator = await self.translation.createTranslator({
//   sourceLanguage: 'en',
//   targetLanguage: 'fr',
// });
// Once you have a translator, call the asynchronous translate() function to translate your text.


// await translator.translate('Where is the next bus stop, please?');
// // "Où est le prochain arrêt de bus, s'il vous plaît ?"
// Limitations in the origin trial
// The following limitations apply during the origin trial.

// Supported language pairs
// At this time, up to three language packs can be downloaded for translation. We're committed to expand the range of supported languages in future releases, while maintaining high standards for user privacy. You can confirm if the language pair you need is supported with the canTranslate() function.

// It's possible that certain, less frequently used language pairs may be used for fingerprinting. For example, it's more common to translate between English and Spanish than between less common languages, such as Gaelic and Catalan. A less common language pair could be considered a data point for user identification.

// During the origin trial, we're limiting the potential translatable language pairs to protect user privacy. Language pairs must meet the following criteria:

// Both the source and the destination language are set as preferred languages in Chrome.
// Or, one of he languages is set as a preferred language in Chrome, and the other is among the following popular languages:
// English (en)
// Mandarin Chinese (zh; simplified) or Taiwanese Mandarin (zh-Hant; traditional)
// Japanese (ja)
// Portuguese (pt)
// Russian (ru)
// Spanish (es)
// Turkish (tr)
// Hindi (hi)
// Vietnamese (vi)
// Bengali (bn)
// Bypass language restrictions for local testing
// For local prototyping, you can bypass these checks by running Chrome with the command line option --disable-features=TranslationAPIAcceptLanguagesCheck. Alternatively, set chrome://flags/#translation-api to Enable without language pack limit.

// Visit chrome://on-device-translation-internals/ to manually install and uninstall language packs.

// Sequential translations
// Translations are processed sequentially. If you send large amounts of text to be translated, subsequent translations are blocked until the earlier ones complete.

// For the best responsiveness of your translation requests, chunk them together and consider displaying a loading interface, such as a spinner, to convey that a translation is ongoing.

// Web worker availability
// During the origin trial, the Translator API is only supported from the main thread. We intend to support it in web workers once the API is widely available.

// Demo
// You can see the Translator API, used in combination with the Language Detector API, in the Translator and Language Detector API playground.


// Standardization effort
// We're working to standardize the Translator API, to ensure cross-browser compatibility.

// Our API proposal received community support and has moved to the W3C Web Incubator Community Group for further discussion. The Chrome team requested feedback from the W3C Technical Architecture Group and asked Mozilla and WebKit for their standards positions.

// Participate and share feedback
// Start testing the Translator API now by joining the origin trial and share your feedback. Your input can directly impact how we build and implement future versions of this API, and all built-in AI APIs.

// For feedback on Chrome's implementation, file a bug report or a feature request.
// Discuss the Translator API design on GitHub by commenting on an existing Issue or open a new one.
// Participate in the standards effort by joining the Web Incubator Community Group.`;
//   const result = await summarizeAndRewrite(text);
//   console.log(result);

//   releaseResources(); // Trigger cleanup
// })();

