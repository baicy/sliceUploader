import React, { useState, useRef, useEffect } from 'react'
import SparkMD5 from 'spark-md5'

const sliceUploader = () => {
  const [uploading, setUploading] = useState(false)
  const [uploadedFileList, setUploadedFileList] = useState([])
  const [uploadingFile, setUploadingFile] = useState(null)
  const inputRef = useRef(null)
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
          uploadChunks(file)
        }
      }
    }

    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice

    const readChunk = () => {
      const start = currentChunk * chunkSize, end = (start + chunkSize >= file.size) ? file.size : (start + chunkSize)
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
    }

    setUploading(true)
    readChunk()
  }

  const uploadChunk = (chunk) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('uploaded chunk', chunk)
        resolve()
      }, Math.random(0, 1)*5000)
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
      console.log('uploadedFileList', uploadedFileList)
      setUploadedFileList([currentFile, ...uploadedFileList])
      currentFile = null
      setUploadingFile(null)
      setUploading(false)
    }, 1000)
  }

  const uploader = ({ target }) => {
    console.log('change', target.files)
    if(!target.files.length) return
    readFile(target.files[0])
  }

  useEffect(()=>{
    console.log('mounted')
    document.getElementById('file').addEventListener('change', uploader)

    return () => {
      console.log('unmount')
      document.getElementById('file').removeEventListener('change', uploader)
    }
  }, [])

  return <div>
    <input type="file" id="file" ref={inputRef} style={{display: 'none'}} />
    {/* <input type="file" id="file" ref={inputRef} style={{display: 'none'}} onChange={uploader} /> */}
    <button onClick={()=>inputRef.current.click()} disabled={uploading}>Select File</button>
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