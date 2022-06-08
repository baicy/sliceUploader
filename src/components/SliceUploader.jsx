import React, { useReducer, useState, useMemo, useCallback, useEffect, useRef } from 'react'
import SparkMD5 from 'spark-md5'
import UploadButton from './UploadButton'
import UploadList from './UploadList'
import FilePreviewer from './FilePreviewer'
import { styled } from '@mui/material/styles'
import { Box, Stack, Button, Paper, Divider } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { request } from '../utils/request'
import concurrency from '../utils/concurrency'

const initialState = {
  uploading: false,
  currentFile: null,
  uploadedFiles: []
}
const reducer = (state, action) => {
  const { name, md5, percent } = { ...(state.currentFile||{}), ...action }
  const { list } = action
  switch(action.type) {
    case 'fileChange':
      return { ...state, currentFile: { name, percent: 0, status: 'checking' }, uploading: true }
    case 'fileRead':
      return { ...state, currentFile: { name, md5, percent, status: 'uploading' } }
    case 'chunkUploaded':
      return { ...state, currentFile: {name, md5, percent } }
    case 'fileUploaded':
      console.log('uploaded success')
      console.groupEnd()
      return { ...state, uploading: false, currentFile: null, uploadedFiles: [{name, md5, percent, status: 'uploaded'}, ...state.uploadedFiles.filter(v=>v.md5!==md5||v.name!==name)] }
    case 'fileFastUploaded':
      console.log('fast uploaded')
      console.groupEnd()
      return { ...state, uploading: false, currentFile: null, uploadedFiles: [{name, md5, percent: 100, status: 'uploaded'}, ...state.uploadedFiles.filter(v=>v.md5!==md5||v.name!==name)] }
    case 'fileProceed':
      return { ...state, uploading: true, currentFile: {name, md5, percent, status: 'uploding'}, uploadedFiles: [...state.uploadedFiles.filter(v=>v.md5!==md5||v.name!==name)] }
    case 'fileError':
      console.log('uploaded fail')
      console.groupEnd()
      return { ...state, uploading: false, currentFile: null, uploadedFiles: [{name, md5, percent, status: 'error'}, ...state.uploadedFiles.filter(v=>v.md5!==md5||v.name!==name)] }
    case 'filesLoaded':
      return { ...state, uploadedFiles: [...list] }
    default:
      return state
  }
}

const SliceUploader = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [previewing, setPreviewing] = useState(false)
  const [currentPreview, setCurrentPreview] = useState(null)
  const uploadRef = useRef(null)
  const chunkSize = 5 * 1024 * 1024
  let chunkNum = 1
  let currentChunk = 0, uploadedChunkNum = 0

  // TODO: 点击preview时不重新渲染文件列表
  useEffect(() => {
    uploadRef.current.style.height = `${window.innerHeight - 10 - 1 - 10 - 20}px`
  })

  const readFile = (file) => {
    console.group('file', file.name)

    chunkNum = Math.ceil(file.size/chunkSize)

    console.log('chunk num', chunkNum)

    const fileReader = new FileReader()
    const spark = new SparkMD5.ArrayBuffer()
    fileReader.onload = ({ target }) => {
      spark.append(target.result)
      currentChunk++
      if(currentChunk < chunkNum) {
        readChunk()
      } else {
        const md5 = spark.end()
        console.log('md5', md5)

        request('/check', { fileName: file.name, md5 })
        .then(res => {
          const { exist, chunkList } = res
          if(exist) {
            if(chunkList) {
              uploadedChunkNum = chunkList.length
              dispatch({ type: 'fileProceed', name: file.name, md5, percent: Math.ceil(uploadedChunkNum/chunkNum*100) })
              uploadChunks(file, md5, chunkList)
            } else {
              dispatch({ type: 'fileFastUploaded', name: file.name, md5 })
            }
          } else {
            dispatch({ type: 'fileRead', name: file.name, md5 })
            uploadChunks(file, md5)
          }
        })
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

  const uploadChunk = ({ chunk, md5, file }) => {
    const form = new FormData()
    form.append('md5', md5)
    form.append('index', chunk)
    form.append('data', file.slice(chunk*chunkSize, (chunk+1)*chunkSize>=file.size?file.size:(chunk+1)*chunkSize))
    return request(`/upload/${chunk}`, form)
    .then(
      () => {
        uploadedChunkNum++
        dispatch({ type: 'chunkUploaded', percent: Math.ceil(uploadedChunkNum/chunkNum*100) })
        return Promise.resolve(chunk)
      },
      err => Promise.reject({ index: chunk, msg: err.message })
    )
  }

  const uploadChunks = (file, md5, chunkList=[]) => {
    const reqList = []
    for(let i = 0; i < chunkNum; i++) {
      !chunkList.includes(i) && reqList.push({ chunk: i, md5, file })
    }
    concurrency(10, reqList, uploadChunk)
    .then(
      (resolves) => {
        console.log('uploaded all chunks', resolves.map(r => r.value))
        mergeChunks(file, md5)
      },
      ({ resolves, rejects }) => {
        console.log('upload success chunks', resolves.map(r => r.value))
        console.log('upload failed chunks', rejects.map(r => r.reason.index))
        dispatch({ type: 'fileError' })
      }
    )
  }

  const mergeChunks = (file, md5) => {
    request('/merge', { md5, fileName: file.name, total: chunkNum }).then((res) => {
      if(res.ok) {
        dispatch({ type: 'fileUploaded' })
      } else {
        dispatch({ type: 'fileError' })
      }
    })
  }

  const uploader = ({ target }) => {
    if(!target.files.length) return
    readFile(target.files[0])
  }

  const UploadBox = styled(Paper)({
    textAlign: 'left',
    padding: '10px',
    marginTop: '10px'
  })

  const loadFiles = () => {
    request('/test').then(list => {
      dispatch({ type: 'filesLoaded', list })
    })
  }

  const handlerSetPreview = useCallback((file) => {
    setPreviewing(true)
    setCurrentPreview(file)
  }, [])

  const handlerDeleteFile = useCallback(() => {
    loadFiles()
    setPreviewing(false)
    setCurrentPreview(null)
  }, [])

  const currentFile = useMemo(()=>state.currentFile, [state.currentFile])
  const uploadedFiles = useMemo(()=>state.uploadedFiles, [state.uploadedFiles])
  const previewingFile = useMemo(() => ({ ...currentPreview }), [currentPreview])

  return <>
    <>
      <UploadBox variant="outlined" square ref={uploadRef}>
        <Stack spacing={2} sx={{ height: '100%' }}>
          <Stack direction="row" spacing={2} justifyContent="flex-start" sx={{ position: 'fixed' }}>
            <UploadButton onChange={uploader} loading={state.uploading} />
            <Button onClick={loadFiles} variant="contained" startIcon={<DownloadIcon />}>LOAD</Button>
          </Stack>
          <Divider style={{ marginTop: '60px' }} />
          <Box sx={{ overflow: 'auto' }}>
            <UploadList currentFile={currentFile} uploadedFiles={uploadedFiles} onPreview={handlerSetPreview} />
          </Box>
        </Stack>
      </UploadBox>
      { previewing && <FilePreviewer file={previewingFile} onDelete={handlerDeleteFile} />}
    </>
  </>
}

export default SliceUploader