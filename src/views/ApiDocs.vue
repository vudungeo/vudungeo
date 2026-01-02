<template>
  <div class="api-docs-container">
    <div class="header">
      <button class="back-link" @click="$router.push('/')">← Back Home</button>
      <h1>Raider.IO API Documentation</h1>
    </div>

    <div v-if="loading" class="loading">Loading documentation...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="content-wrapper">
      <div class="markdown-body" v-html="renderedContent"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ApiDocs',
  data() {
    return {
      rawContent: '',
      loading: true,
      error: null
    }
  },
  computed: {
    renderedContent() {
      if (!this.rawContent) return '';
      
      // Simple markdown-to-html conversion for a clean look without dependencies
      let html = this.rawContent
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^\*\* (.*):/gm, '<strong>$1:</strong>')
        .replace(/^---$/gm, '<hr>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

      // Group <li> tags into <ul> tags
      html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
      
      // Wrap paragraphs
      html = html.split('\n\n').map(p => {
        if (p.trim().startsWith('<h') || p.trim().startsWith('<ul') || p.trim().startsWith('<hr')) return p;
        return `<p>${p}</p>`;
      }).join('\n');

      return html;
    }
  },
  async mounted() {
    try {
      // Fetching the markdown file from the assets/document directory
      // Note: Vite treats files in public or imported through ESM differently.
      // Since it's in the public directory, we fetch it directly via absolute path.
      const response = await fetch('/document/raiderio_api_docs.md');
      if (!response.ok) throw new Error('Could not load documentation file');
      this.rawContent = await response.text();
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}
</script>

<style scoped>
.api-docs-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #eee;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
  border-bottom: 1px solid #333;
  padding-bottom: 20px;
}

.back-link {
  background: transparent;
  border: 1px solid #444;
  color: #aaa;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-link:hover {
  background: #222;
  color: #fff;
  border-color: #666;
}

h1 {
  font-size: 2rem;
  margin: 0;
  color: #ffbd0a;
}

.content-wrapper {
  background: #1a1a1a;
  padding: 40px;
  border-radius: 12px;
  border: 1px solid #333;
  line-height: 1.6;
}

.markdown-body :deep(h2) {
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
  margin-top: 40px;
  color: #ffbd0a;
}

.markdown-body :deep(h3) {
  margin-top: 30px;
  color: #ffbd0a;
  opacity: 0.9;
}

.markdown-body :deep(p) {
  margin: 16px 0;
}

.markdown-body :deep(ul) {
  padding-left: 20px;
  margin: 16px 0;
}

.markdown-body :deep(li) {
  margin-bottom: 8px;
}

.markdown-body :deep(code) {
  background: #2d2d2d;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
  color: #61afef;
}

.markdown-body :deep(a) {
  color: #61afef;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(hr) {
  border: 0;
  border-top: 1px solid #333;
  margin: 40px 0;
}

.loading, .error {
  text-align: center;
  padding: 100px;
  font-size: 1.2rem;
}

.error {
  color: #ff6b6b;
}
</style>
