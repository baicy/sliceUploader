import React, { useState } from 'react'
import SparkMD5 from 'spark-md5'

const sliceUploader = () => {
  const [uploadedFileList, setUploadedFileList] = useState([])
  const [uploadingFile, setUploadingFile] = useState(null)
  let currentFile = null
  const chunkSize = 5 * 1024 * 1024
  let chunkNum = 1
  let currentChunk = 0

  const readFile = (file) => {
    console.group('file', file.name)
    console.log('select file')

    chunkNum = Math.ceil(file.size/chunkSize)

    console.log('chunk num', chunkNum)

    const fileReader = new FileReader()
    const spark = new SparkMD5.ArrayBuffer()
    fileReader.onload = ({ target }) => {
      console.log(`read ${chunkNum>1 ? `chunk ${currentChunk}` : 'file'}`)
      spark.append(target.result)
      currentChunk++
      if(currentChunk < chunkNum) {
        readChunk()
      } else {
        const md5 = spark.end()
        console.log('file read, md5', md5)

        const pos = uploadedFileList.findIndex(v=>v.md5===md5)
        if(pos>-1) {
          const list = [...uploadedFileList]
          list.splice(pos, 1)
          setUploadedFileList([uploadedFileList[pos], ...list])
          console.log('file exist')
        } else {
          currentFile = { name: file.name, status: false, md5 }
          setUploadingFile(currentFile)
          chunkNum>1 ? uploadChunks(file) : uploadFile(file)
        }
      }
    }

    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice

    const readChunk = () => {
      const start = currentChunk * chunkSize, end = (start + chunkSize >= file.size) ? file.size : (start + chunkSize)
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
    }

    readChunk()
  }

  const uploadFile = () => {
    setTimeout(() => {
      console.log('uploaded file')
      console.groupEnd()
      currentFile.status = true
      setUploadedFileList([currentFile, ...uploadedFileList])
      currentFile = null
      setUploadingFile(null)
    }, 1000)
  }

  const uploadChunk = (chunk) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('uploaded chunk', chunk)
        resolve()
      }, 1000)
    })
  }

  const uploadChunks = (file) => {
    const reqList = []
    for(let i = 0; i < chunkNum; i++) {
      reqList.push(uploadChunk(i))
    }
    Promise.all(reqList).then(() => {
      console.log('uploaded all chunks')
      mergeChunks()
    })
  }

  const mergeChunks = () => {
    setTimeout(() => {
      console.log('merged')
      console.groupEnd()
      currentFile.status = true
      setUploadedFileList([currentFile, ...uploadedFileList])
      currentFile = null
      setUploadingFile(null)
    }, 1000)
  }

  const uploader = ({ target }) => {
    readFile(target.files[0])
  }

  return <div>
    <input type="file" name="file" id="file" onChange={uploader} />
    <ul>
      {uploadingFile && <li>
        <span>uploading: {uploadingFile.name} {uploadingFile.status?.toString()}</span>
      </li>}
      {
        uploadedFileList.length>0 && uploadedFileList.map((item) => (
          <li key={item.md5}>
            <span>uploaded: {item.name} {item.status.toString()}</span>
          </li>
        ))
      }
    </ul>
  </div>
}

export default sliceUploader