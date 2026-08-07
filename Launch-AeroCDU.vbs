Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir

' Launch electron via node cli headlessly without keeping any CMD window open
WshShell.Run "cmd /c node node_modules\electron\cli.js . >> logs\aero-cdu.log 2>&1", 0, False
