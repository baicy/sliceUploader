import React, { useState } from 'react'
import SparkMD5 from 'spark-md5'

const sliceUploader = () => {
  const [uploadedFileList, setUploadedFileList] = useState([])
  const [currentFile, setCurrentFile] = useState(null)
  const chunkSize = 5 * 1024 * 1024
  let chunkNum = 1
  let currentChunk = 0, uplodedChunk = 0

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
      }
    }

    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice

    if(chunkNum===1) {
      fileReader.readAsArrayBuffer(blobSlice.call(file, 0, file.size))
      uploadFile(file)
      return
    }

    const readChunk = () => {
      const start = currentChunk * chunkSize, end = (start + chunkSize >= file.size) ? file.size : (start + chunkSize)
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
      uploadChunk(currentChunk, file)
    }

    setCurrentFile({ name: file.name, status: false })
    readChunk()
  }

  const uploadFile = (file) => {
    setCurrentFile({ name: file.name, status: false })
    setTimeout(() => {
      console.log('uploaded file')
      console.groupEnd()
      setUploadedFileList([{ name: file.name, status: true }, ...uploadedFileList])
      setCurrentFile(null)
    }, 1000)
  }

  const uploadChunk = (chunk, file) => {
    setTimeout(() => {
      console.log('uploaded chunk', chunk)
      uplodedChunk++
      if(uplodedChunk===chunkNum) {
        console.log('uploaded all chunks')
        mergeChunks(file)
      }
    }, 1000)
  }

  const mergeChunks = (file) => {
    setTimeout(() => {
      console.log('merged')
      console.groupEnd()
      setUploadedFileList([{ name: file.name, status: true }, ...uploadedFileList])
      setCurrentFile(null)
    }, 1000)
  }

  const uploader = ({ target }) => {
    readFile(target.files[0])
  }

  return <div>
    <input type="file" name="file" id="file" onChange={uploader} />
    <ul>
      {currentFile && <li>
        <span>uploading: {currentFile.name} {currentFile.status?.toString()}</span>
      </li>}
      {
        uploadedFileList.length>0 && uploadedFileList.map((item) => (
          <li key={item.name}>
            <span>uploaded: {item.name} {item.status.toString()}</span>
          </li>
        ))
      }
    </ul>
  </div>
}

export default sliceUploader