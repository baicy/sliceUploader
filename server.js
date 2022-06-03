const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const path = require('path')
const fs = require('fs-extra')
const formidable = require('formidable')

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const uploadDir = './uploads'

function checkFileExist(md5, fileName) {
  return new Promise((resolve, reject) => {
    let exist = false

    // 查找md5对应文件名数据库文件, 没有即创建
    if(!fs.existsSync(path.join(uploadDir, 'md5.db'))) {
      fs.writeFile(path.join(uploadDir, 'md5.db'), '{}', { encoding: 'utf-8' }, err=>reject(err))
      resolve({ exist }) // 数据库未初始化, 没有上传过文件, 一定需要此次上传
    } else {
      // 查找md5对应文件是否存在, 是否有其他名字的相同文件
      const db = JSON.parse(fs.readFileSync(path.join(uploadDir, 'md5.db'), { encoding: 'utf-8' }))
      if (Object.keys(db).includes(md5)) {
        exist = true
        if(!db[md5].includes(fileName)) {
          // md5对应的文件名列表中没有该文件, 添加对应
          db[md5] = [fileName, ...db[md5]]
          fs.writeFile(path.join(uploadDir, 'md5.db'), JSON.stringify(db), { encoding: 'utf-8' }, err=>reject(err))
        }
      }
      exist && resolve({ exist }) // 存在该md5, 上传过该文件
    }

    // 系统上传过文件, 未在数据库中找到记录, 查找是否有断点上传的文件夹
    if(fs.existsSync(path.join(uploadDir, md5))) {
      const chunkList = fs.readdirSync(path.join(uploadDir, md5))
      resolve({ exist: true, chunkList: chunkList.map(i=>Number(i)) }) // 返回分片列表
    } else {
      resolve({ exist }) // 文件不存在, 需要上传
    }
  })
}

function clearFiles() {
  fs.readdirSync(path.resolve(uploadDir)).forEach(file => {
    if(!['.DS_Store', 'md5.db', '.gitkeep'].includes(file) && !fs.lstatSync(path.resolve(uploadDir, file)).isDirectory()) {
      fs.unlink(path.resolve(uploadDir, file), err=>console.error(err))
    }
  })
  fs.writeFile(path.join(uploadDir, 'md5.db'), '{}', { encoding: 'utf-8' }, err=>console.error(err))
}

function moveChunk(tmp, md5, index) {
  return new Promise((resolve, reject) => {
    fs.rename(tmp, path.resolve(uploadDir, md5, index), err => {
      if(err) {
        reject(index)
      } else {
        resolve(index)
      }
    })
  })
}

app.post('/check', (req, res) => {
  const { md5, fileName } = req.body
  checkFileExist(md5, fileName).then(data => res.send(data))
})

app.post('/upload/*', (req, res) => {
  const form = new formidable.IncomingForm({ uploadDir: './tmp' })
  form.parse(req, function(err, fields, file) {
    const { md5, index } = fields
    fs.ensureDirSync(path.resolve(uploadDir, md5))
    moveChunk(file.data.filepath, md5, index)
    .then(
      data => res.send({ ok: 1, md5, chunk: data }),
      error => res.send({ ok: 0, md5, chunk: error, msg: '上传失败' })
    )
  })
})

app.post('/merge', (req, res) => {
  const { md5, fileName, total } = req.body
  const chunks = fs.readdirSync(path.resolve(uploadDir, md5))
  if(chunks.length!==total) {
    res.send({
      ok: 0,
      msg: '文件分片数出错',
      chunks,
      total
    })
  }

  chunks.sort((a, b) => a - b)
  fs.writeFileSync(path.resolve(uploadDir, fileName), '')
  for(let i=0;i<total;i++) {
    const filePath = path.resolve(uploadDir, md5, `${i}`)
    fs.appendFileSync(path.resolve(uploadDir, fileName), fs.readFileSync(filePath))
    fs.unlinkSync(filePath)
  }
  fs.rmdirSync(path.resolve(uploadDir, md5))

  const db = JSON.parse(fs.readFileSync(path.join(uploadDir, 'md5.db'), { encoding: 'utf-8' }))
  db[md5] = [fileName, ...(db[md5]||[])]
  fs.writeFileSync(path.join(uploadDir, 'md5.db'), JSON.stringify(db), { encoding: 'utf-8' })

  res.send({ ok: 1, data: { md5, fileName } })
})

app.listen(8080, () => {
  console.log('server start, run on http://localhost:8080/')
  clearFiles()
})
