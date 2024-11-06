/*
This function reads all files from a given directory and its subdirectories recursively, 
returning their relative paths with respect to a base directory. It collects the paths 
of all files found in the directory tree and stores them in an array.

Parameters:
-----------
dir: string
    The initial directory to start reading from. This directory and all its subdirectories
    will be scanned for files.
    
baseDir: string
    The base directory used to compute the relative paths of the files. All paths returned
    will be relative to this directory.

Returns:
-----------
string[]
    An array of relative file paths with respect to the base directory. Each element in
    the array is a path to a file found within the directory tree.
*/

import fs from 'fs';
import path from 'path';

export function readNestedDir(dir: string, baseDir: string): string[] {
    const files: string[] = [];

    const readDirRecursive = (currentDir: string) => {
        const items = fs.readdirSync(currentDir);

        items.forEach(item => {
            const fullPath = path.join(currentDir, item);
            const relativePath = path.relative(baseDir, fullPath);

            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                readDirRecursive(fullPath);
            } else {
                files.push(relativePath);
            }
        });
    };

    readDirRecursive(dir);
    return files;
}


