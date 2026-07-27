export class TemplateEngine {
  static render(template: string, data: Record<string, any>): string {
    return this.renderEach(template, data);
  }

  private static renderEach(template: string, data: Record<string, any>): string {
    const blockRegex = /\{\{#each\s+([\w.]+)\}\}/;
    const endRegex = /\{\{\/each\}\}/;

    let result = template;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(result)) !== null) {
      const listPath = match[1].trim();
      const startIdx = match.index;
      const blockStart = match[0];
      let depth = 1;
      let endIdx = startIdx + blockStart.length;

      while (depth > 0 && endIdx < result.length) {
        const nextBlock = result.slice(endIdx).search(blockRegex);
        const nextEnd = result.slice(endIdx).search(endRegex);

        if (nextEnd === -1) break;

        if (nextBlock !== -1 && nextBlock < nextEnd) {
          depth++;
          endIdx += nextBlock + blockRegex.exec(result.slice(endIdx))![0].length;
        } else {
          depth--;
          endIdx += nextEnd + '{{/each}}'.length;
        }
      }

      const blockContent = result.slice(startIdx + blockStart.length, endIdx - '{{/each}}'.length);
      const list = this.resolvePath(data, listPath);
      let rendered = '';

      if (Array.isArray(list)) {
        rendered = list.map((item: any, idx: number) => {
          const scope = { ...data, ...item, index: idx + 1, this: item };
          return this.renderEach(blockContent, scope);
        }).join('');
      }

      result = result.slice(0, startIdx) + rendered + result.slice(endIdx);
    }

    result = this.renderConditionals(result, data);
    result = this.renderVariables(result, data);
    return result;
  }

  private static renderConditionals(template: string, data: Record<string, any>): string {
    const blockRegex = /\{\{#if\s+([\w.]+)\}\}/;
    const elseRegex = /\{\{else\}\}/;
    const endRegex = /\{\{\/if\}\}/;

    let result = template;
    let match: RegExpExecArray | null;

    while ((match = blockRegex.exec(result)) !== null) {
      const conditionPath = match[1].trim();
      const startIdx = match.index;
      const blockStart = match[0];
      let depth = 1;
      let endIdx = startIdx + blockStart.length;
      let elseIdx = -1;

      while (depth > 0 && endIdx < result.length) {
        const nextBlock = result.slice(endIdx).search(blockRegex);
        const nextEnd = result.slice(endIdx).search(endRegex);
        const nextElse = result.slice(endIdx).search(elseRegex);

        if (nextEnd === -1) break;

        if (nextBlock !== -1 && nextBlock < nextEnd && (nextElse === -1 || nextBlock < nextElse)) {
          depth++;
          endIdx += nextBlock + blockRegex.exec(result.slice(endIdx))![0].length;
        } else if (nextElse !== -1 && depth === 1 && (nextBlock === -1 || nextElse < nextBlock) && nextElse < nextEnd) {
          elseIdx = endIdx + nextElse;
          endIdx += nextElse + '{{else}}'.length;
        } else {
          depth--;
          if (depth === 0) {
            endIdx += nextEnd + '{{/if}}'.length;
          } else {
            endIdx += nextEnd + '{{/if}}'.length;
          }
        }
      }

      const ifBlock = result.slice(startIdx + blockStart.length, elseIdx !== -1 ? elseIdx : endIdx - '{{/if}}'.length);
      const elseBlock = elseIdx !== -1
        ? result.slice(elseIdx + '{{else}}'.length, endIdx - '{{/if}}'.length)
        : '';

      const value = this.resolvePath(data, conditionPath);
      const rendered = value ? ifBlock : elseBlock;

      result = result.slice(0, startIdx) + rendered + result.slice(endIdx);
    }

    return result;
  }

  private static renderVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(.+?)\}\}/g, (_full: string, expression: string) => {
      const path = expression.trim();
      if (path === 'this') {
        const thisVal = this.resolvePath(data, 'this');
        return thisVal != null ? String(thisVal) : '';
      }
      const value = this.resolvePath(data, path);
      return value != null ? String(value) : '';
    });
  }

  private static resolvePath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => (acc != null ? acc[part] : undefined), obj);
  }
}
