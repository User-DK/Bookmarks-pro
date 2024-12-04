let summarizerPool = null;
let rewriterPool = null;

async function createSummarizer(options, moreContext) {
  try {
    const summarizerOptions = {
      ...options,
      ...(moreContext && { sharedContext: moreContext }), // Include sharedContext only if moreContext is truthy
    };
    return await ai.summarizer.create(summarizerOptions);
  } catch (error) {
    console.error(`Error creating summarizer: ${error}`);
    throw error;
  }
}

async function createRewriter(options) {
  try {
    const summarizerOptions = {
      sharedContext:
        "Combine summaries into a cohesive output with a crisp title.",
      ...options,
    };
    return await ai.rewriter.create(summarizerOptions);
  } catch (error) {
    console.error(`Error creating rewriter: ${error}`);
    throw error;
  }
}

async function getSummarizer(options, moreContext) {
  if (!summarizerPool) {
    summarizerPool = await createSummarizer(options, moreContext);
  }
  return summarizerPool;
}

async function getRewriter(options) {
  if (!rewriterPool) {
    rewriterPool = await createRewriter(options);
  }
  return rewriterPool;
}

async function summarizeAndRewrite(
  text,
  summarizerOptions,
  rewriterOptions,
  maxCharLimit,
  role,
  moreContext
) {

  function splitTextIntoChunks(text, limit) {
    let chunks = [];
    for (let i = 0; i < text.length; i += limit) {
      chunks.push(text.slice(i, i + limit));
    }
    return chunks;
  }

  let summaries = [];

  try {
    if (text.length > maxCharLimit) {
      const chunks = splitTextIntoChunks(text, maxCharLimit);

      for (let i = 0; i < chunks.length; i++) {
        const context =
          i === 0
            ? "This text is the first part of the large. Summarize it for combination."
            : i === chunks.length - 1
              ? "This text is the last part of a large. Summarize it for combination."
              : "This text is a middle part of the large. Summarize it for combination.";

        try {
          const summarizer = await getSummarizer(
            summarizerOptions,
            moreContext
          );
          const summary = await summarizer.summarize(chunks[i], {
            context: context,
          });
          summaries.push(summary);
        } catch (error) {
          console.error(`Error summarizing chunk ${i}: ${error}`);
          throw error;
        }
      }
    } else {
      try {
        const summarizer = await getSummarizer(summarizerOptions, moreContext);
        const summary = await summarizer.summarize(text);
        summaries.push(summary);
      } catch (error) {
        console.error(`Error summarizing text: ${error}`);
        throw error;
      }
    }
    const combinedText = summaries.join("\n\n");

    try {
      const rewriter = await getRewriter(rewriterOptions);
      const finalResult = await rewriter.rewrite(combinedText, {
        context: `Rewrite into a cohesive summary from a ${role}'s perspective.`,
      });
      return finalResult;
    } catch (error) {
      console.error(`Error rewriting text:${error}`);
      return combinedText;
      throw error;
    }
  } catch (error) {
    console.error(`Error in summarizeAndRewrite: ${error}`);
    throw error;
  }
}
// (async () => {
//   const text = `Clearing the previous state:

// The summary container (summary-res) is cleared by setting summaryContainer.value = ''.
// Any previously shown summary result container is hidden with document.getElementById('summary-result').classList.add('hidden').
// Handling errors:

// If an error is thrown during the summary generation, the catch block hides the error message and disables the summary input fields.
// You can display a custom error message with const errorMessage = document.createElement('div'). This can be styled as a warning or alert.
// Resetting input fields:

// Before attempting to generate a new summary, all the relevant input fields (type, length, role, etc.) are reset or made enabled again in case they were disabled due to an error.
// Re-enable the UI after error:

// If you want to allow users to retry after an error, make sure to reset the input fields so they are interactive again (disabled = false).`;
//   const summarizerOptions = {
//     type: "tl;dr",
//     format: "plain-text",
//     length: "short",
//   };
//   const rewriterOptions = {
//     tone: "more-casual",
//     format: "plain-text",
//     length: "as-is",
//   };
//   const maxCharLimit = 4000;
//   const role = "kid";
//   const context = "";
//   try {
//     const result = await summarizeAndRewrite(
//       text,
//       summarizerOptions,
//       rewriterOptions,
//       maxCharLimit,
//       role,
//       context
//     );
//     console.log(result);
//   } catch (error) {
//     console.error("Error during summarization and rewriting:", error);
//   }
// })();

export { summarizeAndRewrite };
