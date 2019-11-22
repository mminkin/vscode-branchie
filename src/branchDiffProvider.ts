import * as vscode from "vscode";
import { API as GitAPI, Repository, GitExtension, Change } from "./git";
import { Uri } from "vscode";

class BranchDiffItem extends vscode.TreeItem {

  constructor(uri?: Uri, label?: string) {
    if (label) {
      super(label);
      return;
    }

    if (!uri) {
      return;
    }

    super(uri);
    this.command = {
      command: 'branchie.open',
      title: '',
      arguments: [uri]
    };
  }

}

abstract class GitBranchieProviderBase
  implements vscode.TreeDataProvider<BranchDiffItem> {
  protected git: GitAPI;
  protected repo: Repository | undefined;

  constructor(gitAPI: GitAPI) {
    this.git = gitAPI;
    this.repo = undefined;

    if (this.git.state === "initialized") {
      this.initialize();
      return;
    }

    this.git.onDidChangeState(gitAPI => {
      this.initialize();
    });
  }

  private initialize() {
    this.repo = this.git.repositories[0];
    this.refresh();
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    BranchDiffItem | undefined
  > = new vscode.EventEmitter<BranchDiffItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<BranchDiffItem | undefined> = this
    ._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(
    element: BranchDiffItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  abstract getChildren(
    element?: BranchDiffItem | undefined
  ): vscode.ProviderResult<BranchDiffItem[]>;

  protected noFilesPlaceholder = [new BranchDiffItem(undefined, "No files found")];
}

export class CurrentTreeProvider extends GitBranchieProviderBase {
  getChildren(
    element?: BranchDiffItem | undefined
  ): vscode.ProviderResult<BranchDiffItem[]> {
    if (!this.repo) {
      return this.noFilesPlaceholder;
    }

    const changes = [
      ...this.repo.state.workingTreeChanges,
      ...this.repo.state.indexChanges
    ];
    if (changes.length === 0) {
      return this.noFilesPlaceholder;
    }
    const items = changes.map(s => {
      return new BranchDiffItem(s.uri);
    });

    return items;
  }
}

export class CommittedTreeProvider extends GitBranchieProviderBase {
  async getChildren(
    element?: BranchDiffItem | undefined
  ): Promise<BranchDiffItem[]> {
    if (!this.repo) {
      return this.noFilesPlaceholder;
    }

    const master = this.repo.state.refs.find(r => r.name === "master");
    if (!master || !master.commit) {
      return this.noFilesPlaceholder;
    }
    const head = this.repo.state.HEAD;
    if (!head || !head.commit) {
      return this.noFilesPlaceholder;
    }

    const masterReference = master.commit;
    const headReference = head.commit;
    if (masterReference === headReference) {
      return this.noFilesPlaceholder;
    }

    return this.repo.diffBetween(masterReference, headReference).then(changes => {
      if (changes.length === 0) {
        return this.noFilesPlaceholder;
      }
      const items = changes.map(change => {
        const uri: Uri = Uri.parse(change.uri.path);
        return new BranchDiffItem(uri);
      });
      return items;
    });
  }
}
