export abstract class JavaProjectAssistant {
  abstract getName(): string;
  abstract getDescription(): string;
  abstract getInputSchema(): any;
  abstract execute(args: any): Promise<string>;
}
