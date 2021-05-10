import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

// fs.mkdirSync recursive is not supported on earlier node versions
function mkdirSync(dir) {
  mkdirp.sync(dir);
}

var VAR_RX = /%%\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*%%/g
function evalTemplate(content, vars) {
  return content.replace(VAR_RX, function(m, p1) {
    return p1 in vars ? vars[p1] : m;
  });
}

function copyFile(src, dst, vars) {
  var file = dst, content = fs.readFileSync(src, "utf8");
  if (dst.endsWith('.t')) {
    file = dst.substring(0, dst.length-2);
    content = evalTemplate(content, vars);
  }
  fs.writeFileSync(file, content);
}

// copy content of src dir into another dir (create if missing) by transforming the given transformer
function copyTree(src, dst, vars) {
  var src = path.normalize(src);
  var dst = path.normalize(dst);
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst);
  }

  fs.readdirSync(src).forEach(file => {
    _copyTree(path.join(src, file), path.join(dst, file), vars);
  });

}
function _copyTree(src, dst, vars) {
    var stats = fs.lstatSync(src);
    if (stats.isDirectory()) {
      mkdirSync(dst);
      fs.readdirSync(src).forEach(file => {
        _copyTree(path.join(src, file), path.join(dst, file), vars);
      });
    } else if (stats.isFile()) {
        copyFile(src, dst, vars);
    } // ignore symbolic links
}

function createProject(type, target, vars) {
  copyTree(path.normalize(path.join(__dirname, '../../templates/common')), target, vars);
  copyTree(path.normalize(path.join(__dirname, '../../templates/'+type)), target, vars);
}

export default createProject;
