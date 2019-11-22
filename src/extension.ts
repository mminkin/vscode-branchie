// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { CurrentTreeProvider, CommittedTreeProvider } from './branchDiffProvider';
import { GitExtension, API as GitApi } from './git';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "branchie" is now active!');
  
  const gitApi = await getGitApi();
  if (!gitApi) {
    vscode.window.showErrorMessage("Git was not found");
    return;
  }

  const workingTreeProvider = new CurrentTreeProvider(gitApi);
  const committedTreeProvider = new CommittedTreeProvider(gitApi);


  vscode.window.registerTreeDataProvider('branchie-changes', workingTreeProvider);
  vscode.window.registerTreeDataProvider('branchie-committed', committedTreeProvider);

  let command = vscode.commands.registerCommand('branchie.refresh', () => {
    workingTreeProvider.refresh();
    committedTreeProvider.refresh();
  }); 

  vscode.commands.registerCommand('branchie.open', (uri: vscode.Uri) => {
    vscode.workspace.openTextDocument(uri).then(doc => {
      vscode.window.showTextDocument(doc);
   });
  });

  context.subscriptions.push(command);
}

// this method is called when your extension is deactivated
export function deactivate() {}

async function getGitApi(): Promise<GitApi | undefined> {
  try {
    const extension = vscode.extensions.getExtension<GitExtension>('vscode.git');
    if (extension !== undefined) {
      const gitExtension = extension.isActive ? extension.exports : await extension.activate();
      return gitExtension.getAPI(1);
    }
  } catch {}

  return undefined;
}