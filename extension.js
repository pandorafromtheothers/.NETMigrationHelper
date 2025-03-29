const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
let ConfigFile = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, ".vscode/NETMigrationHelperConfig.json");
let ExtensionCommands = {} || undefined;
let ExecuteCommand = true;
function activate(context) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = [
		vscode.commands.registerCommand('NETMigrationHelper.Setup', ExtensionCommands.Setup),
		vscode.commands.registerCommand('NETMigrationHelper.AddMigration', ExtensionCommands.AddMigration),
		vscode.commands.registerCommand('NETMigrationHelper.RemoveMigration', ExtensionCommands.RemoveMigration),
		vscode.commands.registerCommand('NETMigrationHelper.UpdateDatabase', ExtensionCommands.UpdateDatabase),
	];
	context.subscriptions.push(disposable);
}

ExtensionCommands.Setup = async () => {
	let _projectData = await ProjectData();
	let _test = Buffer.from(JSON.stringify(_projectData));
	vscode.workspace.fs.writeFile(ConfigFile, _test);
}
ExtensionCommands.AddMigration = async () => {
	let _projectData = await GetConfig();
	if (_projectData == undefined)
		return;

	let _migrationName = await vscode.window.showInputBox({
		placeHolder: "Write the Migration's Name",
		validateInput: (value) => {
			if (value == "")
				return "Migration Name cannot be empty";
		}
	});
	if (_migrationName == undefined)
		return;
	_migrationName = _migrationName.trim();

	let _command = "dotnet ef migrations add #NAME#"
		.replace("#NAME#", _migrationName)
		+ ReplaceConfigKeys(_projectData);

	GetTerminal().sendText(_command, ExecuteCommand);
}
ExtensionCommands.RemoveMigration = async () => {
	let _projectData = await GetConfig();
	if (_projectData == undefined)
		return;

	let _command = "dotnet ef migrations remove" + ReplaceConfigKeys(_projectData);
	GetTerminal().sendText(_command, ExecuteCommand);
}
ExtensionCommands.UpdateDatabase = async () => {
	let _projectData = await GetConfig();
	if (_projectData == undefined)
		return;
	let _ask = await vscode.window.showQuickPick(["Yes", "No"], { canPickMany: false, title: "Are you sure you want to run this command?" });
	if (_ask == "No")
		return;

	let _command = "dotnet ef database update" + ReplaceConfigKeys(_projectData);
	GetTerminal().sendText(_command, ExecuteCommand);
}

function ReplaceConfigKeys(config = {}) {
	let _result = " --project #PROJECT# --startup-project #STARTUPPROJECT#";
	Object.keys(config).forEach(key => {
		let _stringkey = "#" + key.toUpperCase() + "#";
		if (_result.includes(_stringkey))
			_result = _result.replace(_stringkey, config[key]);
	});
	return _result;
}
function GetTerminal() {
	let _terminal = "powershell.exe";
	let _result = vscode.window.activeTerminal;
	if (_result == undefined || _result.creationOptions.shellPath != _terminal)
		_result = vscode.window.createTerminal({ shellPath: _terminal, name: "MigrationHelper" });

	_result.show();
	return _result;
}
async function GetConfig() {
	let _result = {};
	if (await ConfigFileExists())
		_result = JSON.parse((await vscode.workspace.fs.readFile(ConfigFile)).toString());
	else
		_result = await ProjectData();

	return _result;
}

async function ProjectData() {
	let _result = {};
	let _ws = vscode.workspace.workspaceFolders[0].uri;
	let _projectFiles = await GetFiles(_ws, ".csproj");
	if (_projectFiles.length == 0) {
		vscode.window.showErrorMessage("No .NET Project was found in workspace.");
	}
	let _options = _projectFiles.map((e) => e.fileName);
	let _project = await vscode.window.showQuickPick(_options, { canPickMany: false, title: "Setup Steps: 1/2", placeHolder: "Select Migratable Project" });
	let _startupProject = undefined;
	if (_project == undefined)
		return;
	else {
		_result.Project = vscode.workspace.asRelativePath(_projectFiles.filter(e => e.fileName == _project)[0].path);
	}
	let _configs = vscode.workspace.getConfiguration('launch').get("configurations");
	if (_configs.length == 1) {
		_startupProject = _configs[0].projectPath.replace("${workspaceFolder}", "");
		_result.StartupProject = vscode.workspace.asRelativePath(vscode.Uri.joinPath(_ws, _startupProject));

	} else {
		let _startupProject = await vscode.window.showQuickPick(_options, { canPickMany: false, title: "Setup Steps: 2/2", placeHolder: "Select Startup Project" });
		if (_startupProject == undefined)
			return;
		_result.StartupProject = vscode.workspace.asRelativePath(_projectFiles.filter(e => e.fileName == _startupProject)[0].path);
	}

	return _result;
}
async function ConfigFileExists() {
	try {
		await vscode.workspace.fs.stat(ConfigFile);
		return true;
	} catch (error) {
		return false;
	}
}
async function GetFiles(folderURI, endsWithfilter) {
	let _result = [];
	let _folders = [];
	_folders.push(folderURI);
	while (_folders.length > 0) {
		let _currentFolder = _folders[0];
		let _directory = await vscode.workspace.fs.readDirectory(_currentFolder);
		_folders.splice(0, 1);
		_directory.forEach(element => {
			switch (element[1]) {
				case vscode.FileType.File:
					if (element[0].endsWith(endsWithfilter))
						_result.push({ fileName: element[0], path: vscode.Uri.joinPath(_currentFolder, element[0]) });
					break;
				case vscode.FileType.Directory:
					_folders.push(vscode.Uri.joinPath(_currentFolder, element[0]));
					break;
				default:
					break;
			}
		});
	}

	return _result;
}

module.exports = {
	activate
}
