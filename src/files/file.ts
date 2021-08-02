import { ViewColumn } from "vscode";

export class BranchieFile {
  fileName: string;
  viewColumn: ViewColumn | undefined;
  constructor(fileName: string, viewColumn: ViewColumn | undefined) {
    this.fileName = fileName;
    this.viewColumn = viewColumn;
  }
}
