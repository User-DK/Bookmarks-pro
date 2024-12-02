class Summarizer {
  constructor() {
    this.maxChunkSize = 4000;
  }

  async createSummarizer(config, downloadProgressCallback) {
    if (!window.ai || !window.ai.summarizer) {
      throw new Error('AI Summarization is not supported in this browser');
    }

    const canSummarize = await window.ai.summarizer.capabilities();
    if (canSummarize.available == 'no') {
      throw new Error('AI Summarization is not supported');
    }

    const summarizationSession = await window.ai.summarizer.create(
      config,
      downloadProgressCallback
    );

    if (canSummarize.available === 'after-download') {
      summarizationSession.addEventListener(
        'downloadprogress',
        downloadProgressCallback
      );
      await summarizationSession.ready;
    }

    return summarizationSession;
  }

  async rewriter(text) {
    const session = await window.ai.rewriter.create({ tone: 'more-casual', length: 'shorter' });
    const result = await session.rewrite(text, {
      context: "Explain in simple terms",
    });
    session.destroy();
    return result;
  }

  async summarize(text, options) {
    const session = await this.createSummarizer(
      {
        type: options.type,
        format: options.format,
        length: options.length,
      },
      (message, progress) => {
        console.log(`${message} (${progress.loaded}/${progress.total})`);
      }
    );

    try {
      if (options.length === 'extra-long') {
        const stream = await session.summarizeStreaming(text, {
          context: options.context || '',
        });

        let result = '';
        for await (const chunk of stream) {
          result += `\n\n${chunk}`;
        }
        session.destroy();
        return result.trim();
      }

      const chunks = this.splitIntoChunks(text);
      const summaries = await Promise.all(
        chunks.map((chunk) => this.generateSummary(chunk, options, session))
      );
      session.destroy();

      return this.combineSummaries(summaries, options);
    } catch (error) {
      console.error('Summarization failed:', error);
      session.destroy();
      throw error;
    }
  }

  splitIntoChunks(text) {
    const chunks = [];
    let currentChunk = '';
    const sentences = text.split(/[.!?]+\s+/);

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > this.maxChunkSize) {
        chunks.push(currentChunk);
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  async generateSummary(chunk, options, session) {
    try {
      return await session.summarize(chunk, {
        context: options.context || '',
      });
    } catch (error) {
      console.error('Summary generation failed for chunk:', error);
      return ''; // Return empty string for failed chunks
    }
  }

  combineSummaries(summaries, options) {
    summaries = summaries.filter((summary) => summary.trim().length > 0); // Filter out empty summaries

    switch (options.type) {
      case 'headline':
        return summaries.join(' ');
      case 'tl;dr':
      case 'teaser':
      case 'key-points':
        return summaries.join('\n\n');
      default:
        return summaries.join('\n\n');
    }
  }
}


const summarizerInstance = new Summarizer();

export { summarizerInstance, Summarizer };