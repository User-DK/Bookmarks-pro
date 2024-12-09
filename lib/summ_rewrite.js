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
            ? "This text is the first part of a large text. Summarize it for combination."
            : i === chunks.length - 1
              ? "This text is the last part of a large text. Summarize it for combination."
              : "This text is a middle part of a large text. Summarize it for combination.";

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

export { summarizeAndRewrite };
