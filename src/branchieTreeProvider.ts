import {
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
} from "vscode";
import { API as GitAPI, Repository } from "./git";
import { Uri } from "vscode";

class PlaceholderItem extends TreeItem {
  constructor() {
    super("No files found");
    this.contextValue = "placeholder";
  }
}

class FileItem extends TreeItem {
  constructor(uri?: Uri, label?: string) {
    if (label) {
      super(label);
      return;
    }

    if (!uri) {
      return;
    }
    super(uri);

    this.description = this.resourceUri?.path;
    this.contextValue = "file";
    this.command = {
      command: "branchie.open",
      title: "open file",
      arguments: [uri],
    };
  }
}

abstract class BranchieTreeProviderBase implements TreeDataProvider<TreeItem> {
  git: GitAPI;
  protected repo: Repository | undefined;

  readonly name: string;

  constructor(name: string, gitAPI: GitAPI) {
    this.name = name;
    this.git = gitAPI;
    this.repo = undefined;

    if (this.git.state === "initialized") {
      this.initialize();
      return;
    }

    this.git.onDidChangeState(() => {
      this.initialize();
    });
  }

  private initialize() {
    this.repo = this.git.repositories[0];
    this.refresh();
  }

  private _onDidChangeTreeData: EventEmitter<
    TreeItem | undefined
  > = new EventEmitter<FileItem | undefined>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined> = this
    ._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: FileItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  abstract getChildren(element?: TreeItem): ProviderResult<TreeItem[]>;

  protected noFilesPlaceholder = [new PlaceholderItem()];
}

export class StagedTreeProvider extends BranchieTreeProviderBase {
  constructor(gitAPI: GitAPI) {
    super("staged", gitAPI);
  }

  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    if (!this.repo) {
      return this.noFilesPlaceholder;
    }

    const changes = [...this.repo.state.indexChanges];
    if (changes.length === 0) {
      return this.noFilesPlaceholder;
    }
    const items = changes.map((s) => {
      return new FileItem(s.uri);
    });

    return items;
  }
}

export class ModifiedTreeProvider extends BranchieTreeProviderBase {
  constructor(gitAPI: GitAPI) {
    super("modified", gitAPI);
  }

  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    if (!this.repo) {
      return this.noFilesPlaceholder;
    }

    const changes = [...this.repo.state.workingTreeChanges];
    if (changes.length === 0) {
      return this.noFilesPlaceholder;
    }
    const items = changes.map((s) => {
      return new FileItem(s.uri);
    });

    return items;
  }
}

export class CommittedTreeProvider extends BranchieTreeProviderBase {
  constructor(gitAPI: GitAPI) {
    super("committed", gitAPI);
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!this.repo) {
      return this.noFilesPlaceholder;
    }

    const master = this.repo.state.refs.find((r) => r.name === "master");
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

    return this.repo
      .diffBetween(masterReference, headReference)
      .then((changes) => {
        if (changes.length === 0) {
          return this.noFilesPlaceholder;
        }

        changes.map((change) => {
          change.uri.path;
        });
        const items = changes.map((change) => {
          const uri = Uri.parse(change.uri.path);
          return new FileItem(uri);
        });
        return items;
      });
  }
}
