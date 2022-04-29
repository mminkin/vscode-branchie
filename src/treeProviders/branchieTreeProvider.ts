import {
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  Uri,
} from "vscode";
import { GitHelper, Change, Repository } from "../git";
import { FileItem, FileItemList } from "./BranchieTreeItem";

export abstract class BranchieTreeProviderBase
  implements TreeDataProvider<TreeItem>
{
  protected repo: Repository;
  protected emptyList = new FileItemList().empty();

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

  createFileItems(changes: Change[]) {
    return new FileItemList<Change>().from(changes, (change) => {
      return Uri.parse(change.uri.path);
    });
  }

  async getFileItemsBetween(
    commit: string | undefined,
    earlierCommit: string | undefined
  ): Promise<TreeItem[]> {
    if (!commit || !earlierCommit || commit === earlierCommit) {
      return this.emptyList;
    }

    return this.repo
      .diffBetween(commit, earlierCommit)
      .then(this.createFileItems);
  }
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
