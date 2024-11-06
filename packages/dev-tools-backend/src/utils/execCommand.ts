// utils/execCommand.ts

/* 
This function executes any given command in the terminal and returns a promise that resolves 
with the result of the command execution.
Parameters:
-----------
- command: string - The command to be executed in the terminal.

Returns:
-----------
- Promise<ExecResult> - A promise that resolves with an object containing:
  - success: boolean - Indicates if the command was successful.
  - message: string - A message describing the result.
  - output: string - The standard output or error of the executed command.
*/

import { exec } from 'child_process';

interface ExecResult {
  success: boolean;
  message: string;
  output: string;
}

export function execCommand(command: string): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    console.log(`Executing command: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return resolve({
          success: false,
          message: "Error during decompilation",
          output: stderr,
        });
      }

      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
        return resolve({
          success: true,
          message: "Check WARNINGS during decompilation",
          output: stderr,
        });
      }

      console.log(`Command stdout: ${stdout}`);
      resolve({
        success: true,
        message: "Successfully decompiled",
        output: stdout,
      });
    });
  });
}
