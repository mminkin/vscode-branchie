import { commands, TextDocument, ViewColumn, window, workspace } from "vscode";
import { BranchieConsole } from "../branchieConsole";
import { BranchieFile } from "./file";

export class EditorsManager {
  private console: BranchieConsole;

  constructor(console: BranchieConsole) {
    this.console = console;
    this.console.log("OpenFilesKeeper is up");
  }

  private isFile(textDocument: TextDocument | undefined) {
    return textDocument?.uri.scheme === "file";
  }

  async closeActiveEditor(): Promise<BranchieFile | undefined> {
    const activeTextEditor = window.activeTextEditor;

    const viewColumn = activeTextEditor?.viewColumn;
    const file = activeTextEditor?.document;

    if (!this.isFile(file) || !file) {
      return undefined;
    }

    this.console.log(`closing ${file?.fileName}`);
    await commands.executeCommand("workbench.action.closeActiveEditor");
    return new BranchieFile(file.fileName, viewColumn);
  }

  async getAllOpenFiles(): Promise<BranchieFile[]> {
    const files: BranchieFile[] = [];
    while (window.activeTextEditor) {
      const file = await this.closeActiveEditor();
      if (file) {
        files.push(file);
      }
    }
    return files;
  }

  async openFiles(files: BranchieFile[]) {
    this.console.log(`opening ${files.length} files`);
    for (const file of files) {
      this.console.log(`opening ${file.fileName}`);
      workspace.openTextDocument(file.fileName).then(
        (f) => {
          this.console.log(`editor for ${f.fileName} in ${file.viewColumn}`);
          window.showTextDocument(f, {
            preview: false,
            viewColumn: file.viewColumn,
          });
        },
        (error: any) => {
          this.console.log(error);
        }
      );
    }
  }
}
