import * as vscode from 'vscode';

class BrachDiffItem extends vscode.TreeItem {
}

export class BranchDiffProvider implements vscode.TreeDataProvider<BrachDiffItem> {
  onDidChangeTreeData?: vscode.Event<BrachDiffItem | null | undefined> | undefined;  getTreeItem(element: BrachDiffItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    throw new Error("Method not implemented.");
  }
  getChildren(element?: BrachDiffItem | undefined): vscode.ProviderResult<BrachDiffItem[]> {
    throw new Error("Method not implemented.");
  }
}