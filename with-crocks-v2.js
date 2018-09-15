const fs = require("fs");
const { resolve, basename } = require("path");

const Async = require("crocks/Async");
const { flatten, prop, compose, curryN, complement } = require("ramda");
const { chain, map, filter, traverse, concat } = require("crocks/pointfree");

const readDirectory = Async.fromNode(fs.readdir);
const fileStat = Async.fromNode(fs.stat);
const withBasename = file => basename(file);

const resolve2 = curryN(2, resolve);

//isDirectory:: FileStat -> Boolean
const isDirectory = x => x.isDir;

//isFile:: FileStat -> Boolean
const isFile = complement(isDirectory);

// this is similar to  map(f,values) followed by Async.all where
// f :: a -> Async b
// traverseToAsync :: (a -> Async b) -> t a -> Async t b
const traverseToAsync = traverse(Async.of);

//readDirWithFileName:: path -> Async FilePath
const readDirWithFileName = path =>
  readDirectory(path).map(map(file => `${basename(path)}/${file}`));

//statForItemsWithPath:: dirItemWithStat -> Async FileStat
const statForItemsWithPath = file =>
  fileStat(file).map(stat => ({ isDir: stat.isDirectory(), file }));

//filesFromFolder:: [Folder] -> Async [Files]
const filesFromFolder = compose(
  map(flatten),
  traverseToAsync(readDirWithFileName)
);
//Async.all,
//map(readDirWithFileName)

//getAllFiles :: [dirItemWithStat] -> Async [Files]
const getAllFiles = fileList => {
  const justFiles = compose(
    map(withBasename),
    map(prop("file")),
    filter(isFile)
  )(fileList);

  const justFolders = compose(
    map(prop("file")),
    filter(isDirectory)
  )(fileList);

  return compose(
    map(concat(justFiles)),
    filesFromFolder
  )(justFolders);
};

//getFiles:: [dirItem]  -> Async [Files]
const getFiles = compose(
  chain(getAllFiles),
  traverseToAsync(statForItemsWithPath)
);

const dirToRead = ".";
const pathWithRootDir = resolve2(dirToRead);

//getFileList :: Path  -> Async [Files]
const getFileList = compose(
  chain(getFiles),
  map(map(pathWithRootDir)),
  readDirectory
);

// Impure Part
//displayFileWithIndex:: [Files]  -> ()
const displayFileWithIndex = files =>
  files.forEach((item, index) => console.log(`${index}.${item}`));

getFileList(dirToRead).fork(console.log, displayFileWithIndex);
