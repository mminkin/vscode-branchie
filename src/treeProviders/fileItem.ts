import { TreeItem } from "vscode";
import { Uri } from "vscode";

export class FileItem extends TreeItem {
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

class PlaceholderItem extends TreeItem {
  constructor() {
    super("No files found");
    this.contextValue = "placeholder";
  }
}

export class FileItemList<T> {
  noFilesPlaceholder = [new PlaceholderItem()];

  empty() {
    return this.noFilesPlaceholder;
  }

  from(items: T[], getUri: (item: T) => Uri) {
    if (items.length === 0) {
      return this.empty();
    }

    return items.map((item: T) => {
      return new FileItem(getUri(item));
    });
  }
}
