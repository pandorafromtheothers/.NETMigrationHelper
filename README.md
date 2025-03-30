# NETMigrationHelper README

## Features

Migrations can only be done through the CLI. A solution with mulitple project in it, requires you writing down multiple relative paths, so a migration can be added.
This extension saves the locations of the project containing the migrations, and the startup project.
![Setup](https://github.com/user-attachments/assets/ae873292-49c7-4b9b-b1d6-cef51442e906)



By doing this, when you want to create a new migration, you'll only need to call a command without doing anything with the CLI.
![Add](https://github.com/user-attachments/assets/7bc5186e-2678-48d7-b509-ac593e9babaf)


## Requirements
.NET EF

dotnet tool install --global dotnet-ef

## Extension Settings

None.

## Release Notes

### 1.0.0

Initial release of .NETMigrationHelper
