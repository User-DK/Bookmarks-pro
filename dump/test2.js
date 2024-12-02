// let summarizerPool = null;
// let rewriterPool = null;

// async function getSummarizer(options, moreContext) {
//   if (!summarizerPool) {
//     summarizerPool = await ai.summarizer.create({
//       sharedContext: moreContext,
//       ...options,
//     });
//   }
//   return summarizerPool;
// }

// async function getRewriter(options) {
//   if (!rewriterPool) {
//     rewriterPool = await ai.rewriter.create({
//       sharedContext: "Combine summaries into a cohesive output with a crisp title.",
//       ...options,
//     });
//   }
//   return rewriterPool;
// }

// async function summarizeAndRewrite(
//   text,
//   summarizerOptions,
//   rewriterOptions,
//   maxCharLimit,
//   role,
//   moreContext
// ) {
//   console.log("Summarizing and rewriting text...");
//   function splitTextIntoChunks(text, limit) {
//     let chunks = [];
//     for (let i = 0; i < text.length; i += limit) {
//       chunks.push(text.slice(i, i + limit));
//     }
//     return chunks;
//   }

//   let summaries = [];

//   if (text.length > maxCharLimit) {
//     console.log("Text is too long. Splitting into chunks...");
//     const chunks = splitTextIntoChunks(text, maxCharLimit);
//     const summarizer = await getSummarizer(summarizerOptions, moreContext);

//     for (let i = 0; i < chunks.length; i++) {
//       const context =
//         i === 0
//           ? "This text is the first part of the large. Summarize it for combination."
//           : i === chunks.length - 1
//             ? "This text is the last part of a large. Summarize it for combination."
//             : "This text is a middle part of the large. Summarize it for combination.";

//       const summary = await summarizer.summarize(chunks[i], { context: context });
//       console.log("Summary:", summary);
//       summaries.push(summary);
//     }
//   } else {
//     console.log("Text is short enough to summarize in one go.");
//     const summarizer = await getSummarizer(summarizerOptions, moreContext);
//     const summary = await summarizer.summarize(text);
//     console.log("Summary:", summary);
//     summaries.push(summary);
//   }

//   console.log("Summaries:", summaries);
//   console.log("Combining summaries...");

//   const combinedText = summaries.join("\n\n");
//   console.log("Combined text:", combinedText);

//   console.log("Rewriting combined text...");
//   const rewriter = await getRewriter(rewriterOptions);

//   const finalResult = await rewriter.rewrite(combinedText, {
//     context: `Rewrite into a cohesive summary from a ${role}'s perspective.`,
//   });
//   console.log("Final result:", finalResult);

//   return finalResult;
// }

// // Auto-destruction for idle objects
// // function releaseResources(timeout = 60000) {
// //   setTimeout(() => {
// //     summarizerPool = null;
// //     rewriterPool = null;
// //   }, timeout);
// // }

// // Usage
// // (async () => {
// //   const text = `Your long text here...`;
// //   const summarizerOptions = { type: type || "key-points", format: "plain-text", length: length };
// //   const rewriterOptions = { tone: tone || "as-is", format: "plain-text", length: "as-is" };
// //   const maxCharLimit = 4000;
// //   const role = "developer";
// //   const context = "";
// //   const result = await summarizeAndRewrite(text, summarizerOptions, rewriterOptions, maxCharLimit, role, context);
// //   console.log(result);
// // })();


// export { summarizeAndRewrite };



let summarizerPool = null;
let rewriterPool = null;

async function createSummarizer(options, moreContext) {
  try {
    const summarizerOptions = {
      ...options,
      ...(moreContext && { sharedContext: moreContext }), // Include sharedContext only if moreContext is truthy
    };
    // {
    //   sharedContext: moreContext,
    //   ...options,
    // }
    return await ai.summarizer.create(summarizerOptions);
  } catch (error) {
    console.error("Error creating summarizer:", error);
    throw error;
  }
}

async function createRewriter(options) {
  try {
    const summarizerOptions = {
      sharedContext: "Combine summaries into a cohesive output with a crisp title.",
      ...options
    };
    return await ai.rewriter.create(summarizerOptions);
  } catch (error) {
    console.error("Error creating rewriter:", error);
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
  console.log("Summarizing and rewriting text...");

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
      console.log("Text is too long. Splitting into chunks...");
      const chunks = splitTextIntoChunks(text, maxCharLimit);
      const summarizer = await getSummarizer(summarizerOptions, moreContext);

      for (let i = 0; i < chunks.length; i++) {
        const context =
          i === 0
            ? "This text is the first part of the large. Summarize it for combination."
            : i === chunks.length - 1
              ? "This text is the last part of a large. Summarize it for combination."
              : "This text is a middle part of the large. Summarize it for combination.";

        try {
          const summary = await summarizer.summarize(chunks[i], { context: context });
          console.log("Summary:", summary);
          summaries.push(summary);
        } catch (error) {
          console.error(`Error summarizing chunk ${i}:`, error);
          throw error;
        }
      }
    } else {
      console.log("Text is short enough to summarize in one go.");
      const summarizer = await getSummarizer(summarizerOptions, moreContext);

      try {
        const summary = await summarizer.summarize(text);
        console.log("Summary:", summary);
        summaries.push(summary);
      } catch (error) {
        console.error("Error summarizing text:", error);
        throw error;
      }
    }

    console.log("Summaries:", summaries);
    console.log("Combining summaries...");

    const combinedText = summaries.join("\n\n");
    console.log("Combined text:", combinedText);

    console.log("Rewriting combined text...");
    const rewriter = await getRewriter(rewriterOptions);

    try {
      const finalResult = await rewriter.rewrite(combinedText, {
        context: `Rewrite into a cohesive summary from a ${role}'s perspective.`,
      });
      console.log("Final result:", finalResult);
      return finalResult;
    } catch (error) {
      console.error("Error rewriting text:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in summarizeAndRewrite:", error);
    throw error;
  }
}

// Usage
(async () => {
  const text = `The command-line interface is the bread and butter for most tech professionals, especially developers and system administrators. Whether you are writing scripts, configuring servers, or automating tasks, knowing your way around Linux commands can save you hours of work.

For many, Linux may seem daunting at first glance, but once you unlock the potential of its command-line interface (CLI), you’ll realize it’s a programmer’s best friend. From directory navigation to file manipulation and even debugging, mastering these simple yet powerful Linux commands can drastically improve your workflow.

In this article, we’ll explore five command-line tricks that can make your life easier if you’re a developer. These aren’t just “nice-to-know” shortcuts — they’re game-changers that will save you time and make your interactions with the terminal far more efficient.`;
  const summarizerOptions = { type: "key-points", format: "plain-text", length: "short" };
  const rewriterOptions = { tone: "as-is", format: "plain-text", length: "sas-is" };
  const maxCharLimit = 4000;
  const role = "developer";
  const context = "";
  try {
    const result = await summarizeAndRewrite(text, summarizerOptions, rewriterOptions, maxCharLimit, role, context);
    console.log(result);
  } catch (error) {
    console.error("Error during summarization and rewriting:", error);
  }
})();

export { summarizeAndRewrite };
