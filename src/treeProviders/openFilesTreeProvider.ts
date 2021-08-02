import {
  Event,
  EventEmitter,
  ProviderResult,
  TreeDataProvider,
  TreeItem,
  Uri,
} from "vscode";
import { OpenBranchFilesStorageManager } from "../files";
import { FileItem, FileItemList } from "./fileItem";

export class OpenFilesTreeProvider implements TreeDataProvider<FileItem> {
  readonly name = "open";
  constructor(
    private openBranchFilesStorageManager: OpenBranchFilesStorageManager
  ) {}

  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> =
    new EventEmitter<FileItem | undefined>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined> =
    this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
    return element;
  }
  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    const files = this.openBranchFilesStorageManager.getMostRecentFiles();
    return new FileItemList<string>().from(files, (file) => Uri.parse(file));
  }
}
