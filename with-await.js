const fs = require("fs");
const { resolve, basename } = require("path");
const { promisify } = require("util");

const readDir = promisify(fs.readdir);
const fileStat = promisify(fs.stat);

const pick = key => obj => obj[key];

const fileStatWithPath = file =>
  fileStat(file).then(stat => ({ isDir: stat.isDirectory(), file }));

const readDirWithFileName = path =>
  readDir(path).then(files => files.map(file => `${basename(path)}/${file}`));

const withBasename = file => basename(file);

const resolve2 = path1 => path2 => resolve(path1, path2);

Array.prototype.flatMap = function(fn) {
  return Array.prototype.concat.apply([], this.map(fn));
};

async function getFileList() {
  const dirToRead = ".";
  const pathWithRootDir = resolve2(dirToRead);

  const directoryList = await readDir(dirToRead).then(files =>
    files.map(pathWithRootDir)
  );
  const fileList = await Promise.all(directoryList.map(fileStatWithPath));
  const folderFiles = await Promise.all(
    fileList
      .filter(x => x.isDir)
      .map(pick("file"))
      .map(file => readDirWithFileName(file))
  ).then(files => files.flatMap(x => x));

  const justFiles = fileList
    .filter(x => !x.isDir)
    .map(pick("file"))
    .map(withBasename);

  return [...justFiles, ...folderFiles];
}

getFileList().then(files =>
  files.forEach((item, index) => console.log(`${index}.${item}`))
);
