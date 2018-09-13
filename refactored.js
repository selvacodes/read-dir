const fs = require("fs");
const { resolve, basename } = require("path");
const { promisify } = require("util");
const { map, flatten, prop, compose, curryN, complement } = require("ramda");

const readDir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);
const baseName = curryN(1, basename);

const fileStatWithPath = file =>
  fileStat(file).then(stat => ({ isDir: stat.isDirectory(), file }));

const readDirWithFileName = path =>
  readDir(path).then(map(file => `${basename(path)}/${file}`));

const resolve2 = curryN(2, resolve);
const isDirectory = x => x.isDir;

async function main() {
  const dirToRead = ".";
  const pathWithRootDir = resolve2(dirToRead);

  const directoryList = await readDir(dirToRead).then(map(pathWithRootDir));
  const fileList = await Promise.all(map(fileStatWithPath, directoryList));

  const folderFiles = await Promise.all(
    fileList
      .filter(isDirectory)
      .map(prop("file"))
      .map(readDirWithFileName)
  ).then(flatten);

  const justFiles = fileList
    .filter(complement(isDirectory))
    .map(prop("file"))
    .map(file => basename(file));

  return [...justFiles, ...folderFiles];
}

main().then(files =>
  files.forEach((item, index) => console.log(`${index}.${item}`))
);
