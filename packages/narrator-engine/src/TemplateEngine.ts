export type TemplateVars = Record<string, string | number>;

export class TemplateEngine {
  render(template: string, vars: TemplateVars = {}): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
      const val = vars[key];
      return val !== undefined ? String(val) : match;
    });
  }
}
