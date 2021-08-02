import {
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  Uri,
} from "vscode";
import { GitHelper, Change, Repository } from "../git";
import { FileItem, FileItemList } from "./fileItem";

abstract class BranchieTreeProviderBase implements TreeDataProvider<TreeItem> {
  protected repo: Repository;

  readonly name: string;

  constructor(name: string, gitHelper: GitHelper) {
    this.name = name;
    this.repo = gitHelper.getCurrentRepo();
    this.refresh();
  }

  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> =
    new EventEmitter<FileItem | undefined>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: FileItem): TreeItem | Thenable<TreeItem> {
    return element;
  }

  abstract getChildren(element?: TreeItem): ProviderResult<TreeItem[]>;
}

export class StagedTreeProvider extends BranchieTreeProviderBase {
  constructor(gitHelper: GitHelper) {
    super("staged", gitHelper);
  }

  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    const changes = [...this.repo.state.indexChanges];

    return new FileItemList<Change>().from(changes, (change) => {
      return Uri.parse(change.uri.path);
    });
  }
}

export class ModifiedTreeProvider extends BranchieTreeProviderBase {
  constructor(gitHelper: GitHelper) {
    super("modified", gitHelper);
  }

  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    const changes = [...this.repo.state.workingTreeChanges];
    return new FileItemList<Change>().from(changes, (change) => {
      return Uri.parse(change.uri.path);
    });
  }
}

export class CommittedTreeProvider extends BranchieTreeProviderBase {
  constructor(gitHelper: GitHelper) {
    super("committed", gitHelper);
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    const master = this.repo.state.refs.find((r) => r.name === "master");
    const emptyList = new FileItemList().empty();
    if (!master || !master.commit) {
      return emptyList;
    }
    const head = this.repo.state.HEAD;
    if (!head || !head.commit) {
      return emptyList;
    }

    const masterReference = master.commit;
    const headReference = head.commit;
    if (masterReference === headReference) {
      return emptyList;
    }

    return this.repo
      .diffBetween(masterReference, headReference)
      .then((changes) => {
        return new FileItemList<Change>().from(changes, (change) => {
          return Uri.parse(change.uri.path);
        });
      });
  }
}
