const fs = require("fs");
const path = require("path");

function readDirRecursive(startDir) {
  function readDir(dir) {
    function getDir(readDir) {
      return new Promise((resolve, reject) => {
        fs.readdir(readDir, (err, file) => {
          if (err) {
            return reject(err);
          }
          resolve(file.map(item => path.resolve(readDir, item)));
        });
      });
    }

    function getDirList(itemList) {
      function getStat(itemPath) {
        return new Promise((resolve, reject) => {
          fs.stat(itemPath, (err, stat) => {
            if (err) {
              return reject();
            }
            // resolve with item path and if directory
            resolve({ itemPath, isDirectory: stat.isDirectory() });
          });
        });
      }
      return Promise.all(itemList.map(getStat));
    }

    function fileList(itemList) {
      for (let { itemPath, isDirectory } of itemList) {
        if (isDirectory) {
          fs.readdir(itemPath, "utf8", (error, files) => {
            if (error) {
              console.log(error);
            } else {
              files.forEach(file => {
                console.log(file);
              });
            }
          });
        }
      }
    }

    return getDir(dir)
      .then(getDirList)
      .then(fileList);
  }

  // commence reading at the top
  return readDir(startDir);
}

readDirRecursive(".").then(itemList => {
  console.log(itemList);
});
