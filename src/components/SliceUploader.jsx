import React, { useReducer } from 'react'
import SparkMD5 from 'spark-md5'
import UploadButton from './UploadButton'
import UploadList from './UploadList'
import { styled } from '@mui/material/styles'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

const initialState = {
  uploading: false,
  currentFile: null,
  uploadedFiles: []
}
const reducer = (state, action) => {
  const { name, md5, percent } = action
  switch(action.type) {
    case 'fileChange':
      return { ...state, currentFile: { name, percent:0, status: 'checking' }, uploading: true }
    case 'fileRead':
      return { ...state, currentFile: { ...state.currentFile, md5, status: 'uploading' } }
    case 'fileExist':
      console.log('file exist')
      return { ...state, uploading: false, currentFile: null, uploadedFiles: [state.uploadedFiles.find(v=>v.md5===md5), ...state.uploadedFiles.filter(v=>v.md5!==md5)] }
    case 'chunkUploaded':
      return { ...state, currentFile: {...state.currentFile, percent } }
    case 'fileUploaded':
      console.log('merged')
      console.groupEnd()
      return { ...state, uploading: false, currentFile: null, uploadedFiles: [{...state.currentFile, status: 'uploaded'}, ...state.uploadedFiles] }
    default:
      return state
  }
}

const SliceUploader = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
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

  const UploadBox = styled(Box)({
    border: '1px dashed grey',
    textAlign: 'left',
    padding: '10px',
    marginTop: '10px',
    width: '600px',
    minHeight: '300px'
  })

  return <>
    <Container fixed>
      <UploadBox>
        <Stack spacing={2}>
          <UploadButton onChange={uploader} loading={state.uploading} />
          <UploadList currentFile={state.currentFile} uploadedFiles={state.uploadedFiles} />
        </Stack>
      </UploadBox>
    </Container>
  </>
}

export default SliceUploader