import { Memento } from "vscode";
import { BranchieConsole } from "../branchieConsole";
import { EditorsManager } from "./editorsManager";
import { GitHelper } from "../git/gitHelper";
import { BranchieFile } from "./file";

class LocalStorage {
  constructor(private storage: Memento) {}

  public getValue<T>(key: string): T | undefined {
    return this.storage.get<T>(key);
  }

  public setValue<T>(key: string, value: T) {
    this.storage.update(key, value);
  }
}

export class OpenBranchFilesStorageManager {
  private localStorage: LocalStorage;
  private branchName: string | undefined;
  private mostRecentFiles: BranchieFile[] = [];

  constructor(
    storage: Memento,
    private editorsManager: EditorsManager,
    private gitHelper: GitHelper,
    private console: BranchieConsole
  ) {
    this.localStorage = new LocalStorage(storage);
    this.branchName = this.gitHelper.getBranchName();
    this.saveAndRetrieveFiles(this.branchName, this.branchName); // hacky
    this.console.log("OpenBranchFilesStorageManager is up");
  }

  private async saveBranchFiles(branch: string) {
    const files = await this.editorsManager.getAllOpenFiles();

    this.console.log(`saving ${files.length} files for ${branch}`);
    this.localStorage.setValue(branch, files);
  }

  private retrieveBranchFiles(branch: string): BranchieFile[] {
    const files: BranchieFile[] = this.localStorage.getValue(branch) || [];
    this.console.log(`retrieving ${files.length} files for ${branch}`);
    return files;
  }

  private async saveAndRetrieveFiles(
    previousBranch: string | undefined,
    currentBranch: string | undefined
  ) {
    if (previousBranch) {
      await this.saveBranchFiles(previousBranch);
    }

    if (currentBranch) {
      this.mostRecentFiles = this.retrieveBranchFiles(currentBranch);
    }

    this.branchName = currentBranch;
    await this.editorsManager.openFiles(this.mostRecentFiles);
  }

  getMostRecentFiles(): string[] {
    return this.mostRecentFiles.map((file) => file.fileName);
  }

  saveCurrentBranchFiles() {
    const currentBranch = this.branchName;
    if (currentBranch) {
      this.saveBranchFiles(currentBranch);
    }
  }

  async restoreBranchFiles() {
    const previousBranch = this.branchName;
    const currentBranch = this.gitHelper.getBranchName();

    if (previousBranch === currentBranch) {
      return;
    }

    this.console.log(`switching ${previousBranch} to ${currentBranch}`);
    return this.saveAndRetrieveFiles(previousBranch, currentBranch);
  }
}
