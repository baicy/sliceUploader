import React, { useRef, useReducer } from 'react'
import SparkMD5 from 'spark-md5'

const initialState = {
  uploading: false,
  currentFile: null,
  uploadedFiles: []
}
const reducer = (state, action) => {
  const { name, md5, percent } = action
  switch(action.type) {
    case 'fileChange':
      return { ...state, currentFile: { name, percent:0 }, uploading: true }
    case 'fileRead':
      return { ...state, currentFile: { ...state.currentFile, md5 } }
    case 'fileExist':
      console.log('file exist')
      return { ...state, currentFile: null, uploadedFiles: [state.uploadedFiles.find(v=>v.md5===md5), ...state.uploadedFiles.filter(v=>v.md5!==md5)] }
    case 'chunkUploaded':
      return { ...state, currentFile: {...state.currentFile, percent } }
    case 'fileUploaded':
      console.log('merged')
      console.groupEnd()
      return { ...state, uploading: false, currentFile: null, uploadedFiles: [state.currentFile, ...state.uploadedFiles] }
    default:
      return state
  }
}

const sliceUploader = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const inputRef = useRef(null)
  const chunkSize = 5 * 1024 * 1024
  let chunkNum = 1
  let currentChunk = 0, uploadedChunkNum = 0

  const readFile = (file) => {
    console.group('file', file.name)

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
        console.log('md5', md5)

        if(state.uploadedFiles.find(v=>v.md5===md5)) {
          dispatch({ type: 'fileExist', md5 })
        } else {
          dispatch({ type: 'fileRead', name: file.name, md5 })
          uploadChunks(file)
        }
      }
    }

    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice

    const readChunk = () => {
      const start = currentChunk * chunkSize, end = (start + chunkSize >= file.size) ? file.size : (start + chunkSize)
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
    }

    dispatch({ type: 'fileChange', name: file.name })
    readChunk()
  }

  const uploadChunk = (chunk) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('uploaded chunk', chunk)
        uploadedChunkNum++
        dispatch({ type: 'chunkUploaded', percent: Math.ceil(uploadedChunkNum/chunkNum*100) })
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
      dispatch({ type: 'fileUploaded' })
    }, 1000)
  }

  const uploader = ({ target }) => {
    if(!target.files.length) return
    readFile(target.files[0])
  }

  return <div>
    <input type="file" id="file" ref={inputRef} style={{display: 'none'}} onChange={uploader} />
    <button onClick={()=>inputRef.current.click()} disabled={state.uploading}>Select File</button>
    <ul>
      {state.currentFile && <li>
        <span>
          { state.currentFile.percent? 'uploading: ':'checking: ' }
          { state.currentFile.name }
          { state.currentFile.percent ? ` ${state.currentFile.percent}%` : ' ' }
        </span>
      </li>}
      {
        state.uploadedFiles.length>0 && state.uploadedFiles.map((item) => (
          <li key={item.md5}>
            <span>uploaded: {item.name} {item.percent}%</span>
          </li>
        ))
      }
    </ul>
  </div>
}

export default sliceUploader